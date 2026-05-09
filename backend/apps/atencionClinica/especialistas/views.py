"""
apps/specialists/views.py
"""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdministrativoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import Especialista
from .serializers import EspecialistaSerializer


class EspecialistaViewSet(viewsets.ModelViewSet):
    queryset = Especialista.objects.select_related('usuario').all()
    serializer_class = EspecialistaSerializer
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['especialidad', 'activo']
    search_fields = [
        'especialidad',
        'codigo_profesional',
        'usuario__nombres',
        'usuario__apellidos',
        'usuario__email',
    ]
    ordering_fields = ['usuario__apellidos', 'especialidad', 'activo']
    ordering = ['usuario__apellidos']

    def perform_create(self, serializer):
        especialista = serializer.save()

        registrar_bitacora(
            usuario=self.request.user,
            modulo='specialists',
            accion=AccionBitacora.CREAR,
            descripcion=f'Creó especialista: {especialista.get_full_name()} ({especialista.especialidad})',
            tabla_afectada='especialistas',
            id_registro_afectado=especialista.id_especialista,
            ip_origen=get_client_ip(self.request),
        )

    def perform_update(self, serializer):
        especialista = serializer.save()

        registrar_bitacora(
            usuario=self.request.user,
            modulo='specialists',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Editó especialista: {especialista.get_full_name()}',
            tabla_afectada='especialistas',
            id_registro_afectado=especialista.id_especialista,
            ip_origen=get_client_ip(self.request),
        )

    @action(detail=True, methods=['get'], url_path='disponibilidades')
    def disponibilidades(self, request, pk=None):
        from apps.atencionClinica.citas.models import DisponibilidadEspecialista
        from apps.atencionClinica.citas.serializers import DisponibilidadEspecialistaSerializer

        especialista = self.get_object()

        qs = DisponibilidadEspecialista.objects.filter(
            id_especialista=especialista,
            activo=True,
        )

        return Response(DisponibilidadEspecialistaSerializer(qs, many=True).data)