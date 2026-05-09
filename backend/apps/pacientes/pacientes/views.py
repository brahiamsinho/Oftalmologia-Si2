"""
apps/patients/views.py

En django-tenants puro, cada schema tiene sus propios pacientes.
No se filtra por tenant_id.
"""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdministrativoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import Paciente
from .serializers import PacienteCreateSerializer, PacienteSerializer


class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.select_related('usuario').all()
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado_paciente', 'sexo', 'tipo_documento']
    search_fields = [
        'nombres',
        'apellidos',
        'numero_historia',
        'numero_documento',
        'email',
    ]
    ordering_fields = ['apellidos', 'nombres', 'fecha_registro', 'numero_historia']
    ordering = ['apellidos', 'nombres']

    def get_queryset(self):
        queryset = super().get_queryset()

        raw = self.request.query_params.get('sin_cuenta', '').strip().lower()
        if raw in ('1', 'true', 'yes', 'si'):
            return queryset.filter(usuario__isnull=True)

        return queryset

    def get_serializer_class(self):
        return PacienteCreateSerializer if self.action == 'create' else PacienteSerializer

    def perform_create(self, serializer):
        paciente = serializer.save()

        registrar_bitacora(
            usuario=self.request.user,
            modulo='patients',
            accion=AccionBitacora.CREAR,
            descripcion=f'Creó paciente: {paciente.get_full_name()} [{paciente.numero_historia}]',
            tabla_afectada='pacientes',
            id_registro_afectado=paciente.id_paciente,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_update(self, serializer):
        paciente = serializer.save()

        registrar_bitacora(
            usuario=self.request.user,
            modulo='patients',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Editó paciente: {paciente.get_full_name()} [{paciente.numero_historia}]',
            tabla_afectada='pacientes',
            id_registro_afectado=paciente.id_paciente,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_destroy(self, instance):
        pid = instance.id_paciente
        nombre = instance.get_full_name()
        nh = instance.numero_historia

        super().perform_destroy(instance)

        registrar_bitacora(
            usuario=self.request.user,
            modulo='patients',
            accion=AccionBitacora.ELIMINAR,
            descripcion=f'Eliminó paciente: {nombre} [{nh}]',
            tabla_afectada='pacientes',
            id_registro_afectado=pid,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )