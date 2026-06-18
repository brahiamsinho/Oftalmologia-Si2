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
        resultado = AsistenteVirtualService.responder(mensaje)

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
        if serializer.validated_data.get('id_conversacion'):
            interaction_data['id_conversacion'] = serializer.validated_data['id_conversacion']

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

        data = InteraccionAsistenteVirtualSerializer(interaccion).data
        return Response(data, status=status.HTTP_201_CREATED)
