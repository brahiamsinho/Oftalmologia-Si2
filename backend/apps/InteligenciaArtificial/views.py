import logging

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.InteligenciaArtificial.models import (
    ClasificacionUrgencia,
    EstadoClasificacionUrgencia,
    InteraccionAsistenteVirtual,
)
from apps.InteligenciaArtificial.serializers import (
    ClasificacionUrgenciaSerializer,
    ClasificacionUrgenciaUpdateSerializer,
    AsistenteVirtualRequestSerializer,
    InteraccionAsistenteVirtualSerializer,
)
from apps.InteligenciaArtificial.services.clasificador_urgencia import ClasificadorUrgenciaService
from apps.InteligenciaArtificial.services.asistente_virtual import AsistenteVirtualService
from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsMedicoOrAdmin, IsPaciente
from apps.core.utils import get_client_ip, registrar_bitacora
from apps.crm.notificaciones.services import enviar_push_a_usuario
from apps.usuarios.users.models import EstadoUsuario, TipoUsuario, Usuario


logger = logging.getLogger(__name__)


_STAFF_TYPES = (
    TipoUsuario.ADMINISTRATIVO,
    TipoUsuario.MEDICO,
    TipoUsuario.ESPECIALISTA,
    TipoUsuario.ADMIN,
)


def _notificar_clasificacion_urgencia(*, user, interaccion, clasificacion) -> None:
    if not interaccion.requiere_clasificacion_urgencia:
        return

    requester_name = (user.get_full_name() or user.username or 'Usuario').strip()
    nivel = (getattr(clasificacion, 'nivel_urgencia', '') or 'media').strip().lower()
    requiere_derivacion = bool(getattr(clasificacion, 'requiere_derivacion', False))
    notification_type = 'derivacion_urgente' if requiere_derivacion else 'clasificacion_urgencia'

    if requiere_derivacion:
        titulo = 'Caso urgente derivado al equipo humano'
        cuerpo = (
            f'{requester_name} consultó el asistente. '
            f'Se detectó una urgencia {nivel} con revisión prioritaria. '
            'Revisar la conversación y coordinar atención inmediata.'
        )
    else:
        titulo = f'Clasificación de urgencia {nivel}'
        cuerpo = (
            f'{requester_name} consultó el asistente. '
            f'Se detectó una clasificación de urgencia {nivel}. '
            'Revisar la conversación y definir conducta clínica.'
        )

    recipients = list(
        Usuario.objects.filter(
            is_active=True,
            estado=EstadoUsuario.ACTIVO,
            tipo_usuario__in=_STAFF_TYPES,
        )
        .exclude(pk=user.pk)
        .only('id', 'username', 'nombres', 'apellidos', 'tipo_usuario'),
    )

    if not recipients:
        logger.warning('No se encontraron usuarios de staff para notificar la clasificación de urgencia.')
        return

    payload = {
        'origen': 'asistente_virtual_cu24',
        'nivel': nivel,
        'tipo': notification_type,
    }

    for recipient in recipients:
        enviar_push_a_usuario(
            recipient.pk,
            titulo,
            cuerpo,
            data=payload,
            tipo=notification_type,
        )


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
        queryset = InteraccionAsistenteVirtual.objects.select_related('clasificacion_urgencia').filter(id_usuario=user)
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

        clasificacion = None
        if interaccion.requiere_clasificacion_urgencia:
            clasificacion = ClasificadorUrgenciaService.clasificar_interaccion(interaccion)
            _notificar_clasificacion_urgencia(user=request.user, interaccion=interaccion, clasificacion=clasificacion)

        registrar_bitacora(
            usuario=request.user,
            modulo='inteligencia_artificial',
            accion=AccionBitacora.CREAR,
            descripcion=(
                f'CU23 asistente virtual: intencion={interaccion.intencion}, '
                f'estado={interaccion.estado}, cu24={interaccion.requiere_clasificacion_urgencia}, '
                f'clasificacion={getattr(clasificacion, "nivel_urgencia", "NA")}'
            ),
            tabla_afectada='ia_interacciones_asistente_virtual',
            id_registro_afectado=interaccion.id_interaccion,
            ip_origen=interaction_data['ip_origen'],
            user_agent=interaction_data['user_agent'],
        )

        data = InteraccionAsistenteVirtualSerializer(interaccion).data
        return Response(data, status=status.HTTP_201_CREATED)


class ClasificacionUrgenciaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    CU24: clasificaciones de urgencia para staff medico.
    """

    serializer_class = ClasificacionUrgenciaSerializer
    permission_classes = [IsAuthenticated, IsMedicoOrAdmin]
    lookup_field = 'id_clasificacion'

    def get_queryset(self):
        queryset = ClasificacionUrgencia.objects.select_related(
            'id_interaccion',
            'id_usuario',
            'revisado_por',
        )
        estado = self.request.query_params.get('estado')
        nivel = self.request.query_params.get('nivel_urgencia')
        if estado:
            queryset = queryset.filter(estado=estado)
        if nivel:
            queryset = queryset.filter(nivel_urgencia=nivel)
        return queryset

    @action(detail=False, methods=['get'], url_path='pendientes')
    def pendientes(self, request, *args, **kwargs):
        queryset = self.get_queryset().filter(estado=EstadoClasificacionUrgencia.PENDIENTE)
        return Response(self.get_serializer(queryset, many=True).data)

    @action(detail=True, methods=['patch'], url_path='revisar')
    def revisar(self, request, *args, **kwargs):
        clasificacion = self.get_object()
        serializer = ClasificacionUrgenciaUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        clasificacion = ClasificadorUrgenciaService.revisar_clasificacion(
            clasificacion,
            revisado_por=request.user,
            derivado=serializer.validated_data.get('derivado'),
            notas_internas=serializer.validated_data.get('notas_internas'),
        )

        registrar_bitacora(
            usuario=request.user,
            modulo='inteligencia_artificial',
            accion=AccionBitacora.EDITAR,
            descripcion=(
                f'CU24 revision clasificacion urgencia: id={clasificacion.id_clasificacion}, '
                f'nivel={clasificacion.nivel_urgencia}, estado={clasificacion.estado}'
            ),
            tabla_afectada='ia_clasificaciones_urgencia',
            id_registro_afectado=clasificacion.id_clasificacion,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return Response(self.get_serializer(clasificacion).data)
