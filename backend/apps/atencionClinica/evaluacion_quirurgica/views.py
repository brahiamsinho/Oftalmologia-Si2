from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsMedicoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora
from apps.pacientes.pacientes.models import Paciente

from .models import EvaluacionQuirurgica
from .serializers import EvaluacionQuirurgicaSerializer


class EvaluacionQuirurgicaViewSet(viewsets.ModelViewSet):
    queryset = EvaluacionQuirurgica.objects.select_related(
        'id_paciente',
        'id_historia_clinica',
        'id_consulta',
        'evaluado_por',
    ).all()
    serializer_class = EvaluacionQuirurgicaSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado_prequirurgico', 'id_paciente', 'id_historia_clinica', 'evaluado_por']
    search_fields = [
        'id_paciente__nombres',
        'id_paciente__apellidos',
        'riesgo_quirurgico',
        'hallazgos',
        'plan_quirurgico',
        'observaciones',
    ]
    ordering_fields = ['fecha_evaluacion', 'created_at', 'updated_at']
    ordering = ['-fecha_evaluacion', '-created_at']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsMedicoOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return EvaluacionQuirurgica.objects.none()

        tipo = getattr(user, 'tipo_usuario', '') or ''
        if tipo == 'PACIENTE':
            paciente = Paciente.objects.filter(usuario=user).first()
            if not paciente:
                return EvaluacionQuirurgica.objects.none()
            return queryset.filter(id_paciente=paciente)

        if tipo in ('MEDICO', 'ESPECIALISTA'):
            return queryset.filter(evaluado_por=user)

        if tipo in ('ADMIN', 'ADMINISTRATIVO'):
            return queryset

        return EvaluacionQuirurgica.objects.none()

    def perform_create(self, serializer):
        instance = serializer.save(evaluado_por=self.request.user)
        registrar_bitacora(
            usuario=self.request.user,
            modulo='evaluacion_quirurgica',
            accion=AccionBitacora.CREAR,
            descripcion=(
                f'Registro evaluacion quirurgica #{instance.id_evaluacion_quirurgica} '
                f'para paciente {instance.id_paciente_id}'
            ),
            tabla_afectada='evaluaciones_quirurgicas',
            id_registro_afectado=instance.id_evaluacion_quirurgica,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='evaluacion_quirurgica',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Edito evaluacion quirurgica #{instance.id_evaluacion_quirurgica}',
            tabla_afectada='evaluaciones_quirurgicas',
            id_registro_afectado=instance.id_evaluacion_quirurgica,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_destroy(self, instance):
        object_id = instance.id_evaluacion_quirurgica
        registrar_bitacora(
            usuario=self.request.user,
            modulo='evaluacion_quirurgica',
            accion=AccionBitacora.ELIMINAR,
            descripcion=f'Elimino evaluacion quirurgica #{object_id}',
            tabla_afectada='evaluaciones_quirurgicas',
            id_registro_afectado=object_id,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )
        super().perform_destroy(instance)

