"""
apps/patients/views.py

Endpoints:
  GET/POST        /api/pacientes/
  GET/PUT/PATCH   /api/pacientes/{id}/
  DELETE          /api/pacientes/{id}/

Especialistas → apps/specialists/views.py
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
    """
    CRUD de pacientes.
    Listado y edición: admin/administrativo.
    """
    queryset = Paciente.objects.select_related('usuario').all()
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado_paciente', 'sexo', 'tipo_documento']
    search_fields = [
        'nombres', 'apellidos', 'numero_historia',
        'numero_documento', 'email',
    ]
    ordering_fields = ['apellidos', 'nombres', 'fecha_registro', 'numero_historia']
    ordering = ['apellidos', 'nombres']

    def get_serializer_class(self):
        return PacienteCreateSerializer if self.action == 'create' else PacienteSerializer

    def perform_create(self, serializer):
        paciente = serializer.save()
        registrar_bitacora(
            usuario=self.request.user, modulo='patients', accion=AccionBitacora.CREAR,
            descripcion=f'Creó paciente: {paciente.get_full_name()} [{paciente.numero_historia}]',
            tabla_afectada='pacientes', id_registro_afectado=paciente.id_paciente,
            ip_origen=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        paciente = serializer.save()
        registrar_bitacora(
            usuario=self.request.user, modulo='patients', accion=AccionBitacora.EDITAR,
            descripcion=f'Editó paciente: {paciente.get_full_name()} [{paciente.numero_historia}]',
            tabla_afectada='pacientes', id_registro_afectado=paciente.id_paciente,
            ip_origen=get_client_ip(self.request),
        )
