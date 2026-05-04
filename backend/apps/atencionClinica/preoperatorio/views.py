from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsMedicoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora
from apps.pacientes.pacientes.models import Paciente

from .models import EstadoPreoperatorio, Preoperatorio
from .serializers import PreoperatorioSerializer


class PreoperatorioViewSet(viewsets.ModelViewSet):
    queryset = Preoperatorio.objects.select_related(
        'id_paciente',
        'id_historia_clinica',
        'id_evaluacion_quirurgica',
        'id_cita',
        'validado_por',
    ).all()
    serializer_class = PreoperatorioSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'estado_preoperatorio',
        'id_paciente',
        'id_historia_clinica',
        'id_evaluacion_quirurgica',
        'id_cita',
    ]
    search_fields = [
        'id_paciente__nombres',
        'id_paciente__apellidos',
        'checklist_detalle',
        'examenes_requeridos',
        'examenes_completados',
        'observaciones',
    ]
    ordering_fields = ['created_at', 'updated_at', 'fecha_programada_cirugia', 'fecha_validacion']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsMedicoOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return Preoperatorio.objects.none()

        tipo = getattr(user, 'tipo_usuario', '') or ''
        if tipo == 'PACIENTE':
            paciente = Paciente.objects.filter(usuario=user).first()
            if not paciente:
                return Preoperatorio.objects.none()
            return queryset.filter(id_paciente=paciente)
        if tipo in ('MEDICO', 'ESPECIALISTA'):
            return queryset.filter(validado_por=user)
        if tipo in ('ADMIN', 'ADMINISTRATIVO'):
            return queryset
        return Preoperatorio.objects.none()

    def _aplicar_validacion(self, instance):
        if instance.estado_preoperatorio in (
            EstadoPreoperatorio.APROBADO,
            EstadoPreoperatorio.OBSERVADO,
            EstadoPreoperatorio.RECHAZADO,
        ):
            instance.marcar_validado(self.request.user)
            instance.save(update_fields=['validado_por', 'fecha_validacion'])

    def perform_create(self, serializer):
        instance = serializer.save()
        self._aplicar_validacion(instance)
        registrar_bitacora(
            usuario=self.request.user,
            modulo='preoperatorio',
            accion=AccionBitacora.CREAR,
            descripcion=f'Registro preoperatorio #{instance.id_preoperatorio}',
            tabla_afectada='preoperatorios',
            id_registro_afectado=instance.id_preoperatorio,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        self._aplicar_validacion(instance)
        registrar_bitacora(
            usuario=self.request.user,
            modulo='preoperatorio',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Edito preoperatorio #{instance.id_preoperatorio}',
            tabla_afectada='preoperatorios',
            id_registro_afectado=instance.id_preoperatorio,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_destroy(self, instance):
        object_id = instance.id_preoperatorio
        registrar_bitacora(
            usuario=self.request.user,
            modulo='preoperatorio',
            accion=AccionBitacora.ELIMINAR,
            descripcion=f'Elimino preoperatorio #{object_id}',
            tabla_afectada='preoperatorios',
            id_registro_afectado=object_id,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )
        super().perform_destroy(instance)

