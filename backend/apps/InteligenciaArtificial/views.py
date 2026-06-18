from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.InteligenciaArtificial.models import InteraccionAsistenteVirtual
from apps.InteligenciaArtificial.serializers import (
    AsistenteVirtualRequestSerializer,
    InteraccionAsistenteVirtualSerializer,
)
from apps.InteligenciaArtificial.services.asistente_virtual import AsistenteVirtualService
from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsPaciente
from apps.core.utils import get_client_ip, registrar_bitacora
from apps.ia.models import ChatbotUrgencyClassification
from apps.ia.serializers import UrgencyClassificationResponseSerializer
from apps.ia.services.human_handoff import ensure_handoff_for_classification
from apps.ia.services.urgency_classifier import classify_urgency
from apps.pacientes.pacientes.models import Paciente


class AsistenteVirtualPacienteViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    CU23: asistente virtual para Paciente autenticado.

    - GET lista el historial del paciente autenticado.
    - POST asistente-virtual/ procesa una consulta y registra la interaccion.
    """

    serializer_class = InteraccionAsistenteVirtualSerializer
    permission_classes = [IsAuthenticated, IsPaciente]
    lookup_field = 'id_interaccion'

    @staticmethod
    def _build_conversation_history(user, id_conversacion):
        if not id_conversacion:
            return []

        interacciones = InteraccionAsistenteVirtual.objects.filter(
            id_usuario=user,
            id_conversacion=id_conversacion,
        ).order_by('fecha_creacion', 'id_interaccion')[:5]

        history: list[dict[str, object]] = []
        for interaccion in interacciones:
            history.append({'role': 'user', 'content': interaccion.mensaje})
            history.append({'role': 'assistant', 'content': interaccion.respuesta})
        return history

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return InteraccionAsistenteVirtual.objects.none()
        queryset = InteraccionAsistenteVirtual.objects.filter(id_usuario=user)
        id_conversacion = self.request.query_params.get('id_conversacion')
        if id_conversacion:
            queryset = queryset.filter(id_conversacion=id_conversacion)
        return queryset

    @action(detail=False, methods=['post'], url_path='asistente-virtual')
    def consultar(self, request, *args, **kwargs):
        serializer = AsistenteVirtualRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        mensaje = serializer.validated_data['mensaje']
        id_conversacion = serializer.validated_data.get('id_conversacion')
        history = self._build_conversation_history(request.user, id_conversacion)
        resultado = AsistenteVirtualService.responder(mensaje, history=history)

        interaction_data = {
            'id_usuario': request.user,
            'mensaje': mensaje,
            'respuesta': resultado.respuesta,
            'intencion': resultado.intencion,
            'estado': resultado.estado,
            'requiere_clasificacion_urgencia': resultado.requiere_clasificacion_urgencia,
            'nivel_prioridad': resultado.nivel_prioridad,
            'sintomas_detectados': resultado.sintomas_detectados,
            'metadata': resultado.metadata,
            'ip_origen': get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        }
        if id_conversacion:
            interaction_data['id_conversacion'] = id_conversacion

        interaccion = InteraccionAsistenteVirtual.objects.create(**interaction_data)

        registrar_bitacora(
            usuario=request.user,
            modulo='inteligencia_artificial',
            accion=AccionBitacora.CREAR,
            descripcion=(
                f'CU23 asistente virtual: intencion={interaccion.intencion}, '
                f'estado={interaccion.estado}, cu24={interaccion.requiere_clasificacion_urgencia}'
            ),
            tabla_afectada='ia_interacciones_asistente_virtual',
            id_registro_afectado=interaccion.id_interaccion,
            ip_origen=interaction_data['ip_origen'],
            user_agent=interaction_data['user_agent'],
        )

        cu24_clasificacion = None
        if resultado.requiere_clasificacion_urgencia:
            try:
                paciente = Paciente.objects.filter(usuario=request.user).first()
                if paciente:
                    cu24_result = classify_urgency(message=mensaje, history=history)
                    classification = ChatbotUrgencyClassification.objects.create(
                        usuario=request.user,
                        paciente=paciente,
                        mensaje_usuario=mensaje,
                        nivel=cu24_result.level,
                        confianza=cu24_result.confidence,
                        criterios_detectados=cu24_result.matched_criteria,
                        orientacion=cu24_result.orientation,
                        requiere_atencion_humana=cu24_result.requires_human_attention,
                        estado_derivacion=cu24_result.derivation_status,
                    )
                    if cu24_result.requires_human_attention:
                        handoff = ensure_handoff_for_classification(
                            classification=classification,
                            usuario=request.user,
                            ip_origen=interaction_data['ip_origen'],
                            user_agent=interaction_data['user_agent'],
                        )
                        classification._critical_handoff = handoff
                    registrar_bitacora(
                        usuario=request.user,
                        modulo='ia',
                        accion=AccionBitacora.CREAR,
                        descripcion=(
                            f'CU24 automatica desde CU23: nivel={cu24_result.level}, '
                            f'derivacion={cu24_result.derivation_status}'
                        ),
                        tabla_afectada='ia_chatbot_urgency_classifications',
                        id_registro_afectado=classification.pk,
                        ip_origen=interaction_data['ip_origen'],
                        user_agent=interaction_data['user_agent'],
                    )
                    cu24_clasificacion = UrgencyClassificationResponseSerializer(classification).data
            except Exception:
                cu24_clasificacion = None

        data = InteraccionAsistenteVirtualSerializer(interaccion).data
        data['clasificacion_urgencia'] = cu24_clasificacion
        return Response(data, status=status.HTTP_201_CREATED)
