from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdministrativoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import CampanaCRM, HistorialContacto, SegmentacionPaciente
from .serializers import CampanaCRMSerializer, HistorialContactoSerializer, SegmentacionPacienteSerializer


class CrmBitacoraMixin:
    modulo_bitacora = 'crm'
    tabla_bitacora = ''
    id_field_name = 'id'

    def _id_value(self, instance):
        return getattr(instance, self.id_field_name)

    def _registrar(self, accion, descripcion, instance):
        registrar_bitacora(
            usuario=self.request.user,
            modulo=self.modulo_bitacora,
            accion=accion,
            descripcion=descripcion,
            tabla_afectada=self.tabla_bitacora,
            id_registro_afectado=self._id_value(instance),
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_create(self, serializer):
        instance = serializer.save()
        self._registrar(
            AccionBitacora.CREAR,
            f'Creo registro CRM en {self.tabla_bitacora} #{self._id_value(instance)}',
            instance,
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        self._registrar(
            AccionBitacora.EDITAR,
            f'Edito registro CRM en {self.tabla_bitacora} #{self._id_value(instance)}',
            instance,
        )

    def perform_destroy(self, instance):
        object_id = self._id_value(instance)
        self._registrar(
            AccionBitacora.ELIMINAR,
            f'Elimino registro CRM en {self.tabla_bitacora} #{object_id}',
            instance,
        )
        super().perform_destroy(instance)


class SegmentacionPacienteViewSet(CrmBitacoraMixin, viewsets.ModelViewSet):
    queryset = SegmentacionPaciente.objects.all()
    serializer_class = SegmentacionPacienteSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo']
    search_fields = ['nombre', 'descripcion', 'criterios']
    ordering_fields = ['nombre', 'created_at', 'updated_at']
    ordering = ['nombre']
    tabla_bitacora = 'crm_segmentaciones'
    id_field_name = 'id_segmentacion'

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsAdministrativoOrAdmin()]
        return [IsAuthenticated()]


class CampanaCRMViewSet(CrmBitacoraMixin, viewsets.ModelViewSet):
    queryset = CampanaCRM.objects.select_related('id_segmentacion', 'creado_por').all()
    serializer_class = CampanaCRMSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'id_segmentacion']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['fecha_inicio', 'fecha_fin', 'created_at', 'updated_at']
    ordering = ['-created_at']
    tabla_bitacora = 'crm_campanas'
    id_field_name = 'id_campana'

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsAdministrativoOrAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        instance = serializer.save(creado_por=self.request.user)
        self._registrar(
            AccionBitacora.CREAR,
            f'Creo campana CRM #{instance.id_campana}',
            instance,
        )


class HistorialContactoViewSet(CrmBitacoraMixin, viewsets.ModelViewSet):
    """
    CU16 — Gestionar CRM para la comunicación con pacientes.

    Endpoints:
        GET    /crm-contactos/           — lista paginada
        POST   /crm-contactos/           — crear comunicación (contactado_por = request.user)
        GET    /crm-contactos/{id}/      — detalle
        PATCH  /crm-contactos/{id}/      — editar parcial
        DELETE /crm-contactos/{id}/      — eliminar

    Filtros disponibles:
        ?id_paciente=          — por paciente
        ?id_campana=           — por campaña CRM
        ?canal=                — LLAMADA | WHATSAPP | EMAIL | SMS | OTRO
        ?tipo_mensaje=         — RECORDATORIO | NOTIFICACION | SEGUIMIENTO | RESULTADO | INFORMATIVO | OTRO
        ?estado_comunicacion=  — PENDIENTE | ENVIADO | ENTREGADO | LEIDO | RESPONDIDO | FALLIDO
        ?search=               — busca en nombre paciente, asunto, mensaje, resultado, observaciones
        ?ordering=             — fecha_contacto, created_at, updated_at
    """
    queryset = HistorialContacto.objects.select_related(
        'id_paciente',
        'id_campana',
        'contactado_por',
    ).all()
    serializer_class = HistorialContactoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'id_paciente',
        'id_campana',
        'canal',
        'tipo_mensaje',
        'estado_comunicacion',
    ]
    search_fields = [
        'id_paciente__nombres',
        'id_paciente__apellidos',
        'asunto',
        'mensaje',
        'respuesta_paciente',
        'resultado',
        'observaciones',
    ]
    ordering_fields = ['fecha_contacto', 'created_at', 'updated_at']
    ordering = ['-fecha_contacto', '-created_at']
    tabla_bitacora = 'crm_historial_contactos'
    id_field_name = 'id_historial_contacto'

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsAdministrativoOrAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        instance = serializer.save(contactado_por=self.request.user)
        self._registrar(
            AccionBitacora.CREAR,
            f'Creo comunicacion CRM #{instance.id_historial_contacto} '
            f'canal={instance.canal} tipo={instance.tipo_mensaje} '
            f'estado={instance.estado_comunicacion}',
            instance,
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        self._registrar(
            AccionBitacora.EDITAR,
            f'Edito comunicacion CRM #{instance.id_historial_contacto} '
            f'estado={instance.estado_comunicacion}',
            instance,
        )