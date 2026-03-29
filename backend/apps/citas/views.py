"""
apps/appointments/views.py

Endpoints:
  GET/POST       /api/v1/tipos-cita/
  GET/PUT/PATCH  /api/v1/tipos-cita/{id}/
  GET/POST       /api/v1/disponibilidades/
  GET/PUT/PATCH  /api/v1/disponibilidades/{id}/
  GET/POST       /api/v1/citas/
  GET/PUT/PATCH  /api/v1/citas/{id}/
  POST           /api/v1/citas/{id}/confirmar/
  POST           /api/v1/citas/{id}/cancelar/
  POST           /api/v1/citas/{id}/reprogramar/
"""
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdministrativoOrAdmin, IsMedicoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import Cita, DisponibilidadEspecialista, EstadoCita, TipoCita
from .serializers import (
    CitaSerializer, DisponibilidadEspecialistaSerializer, TipoCitaSerializer,
)


class TipoCitaViewSet(viewsets.ModelViewSet):
    """GET/POST /api/v1/tipos-cita/ — Solo ADMIN puede crear/editar."""
    queryset = TipoCita.objects.all()
    serializer_class = TipoCitaSerializer
    permission_classes = [IsAuthenticated]


class DisponibilidadEspecialistaViewSet(viewsets.ModelViewSet):
    """
    Gestión de horarios disponibles de cada especialista.
    GET/POST /api/v1/disponibilidades/
    """
    queryset = DisponibilidadEspecialista.objects.select_related('id_especialista__usuario').all()
    serializer_class = DisponibilidadEspecialistaSerializer
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['id_especialista', 'dia_semana', 'activo']
    ordering = ['id_especialista', 'dia_semana', 'hora_inicio']


class CitaViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de citas médicas.
    Acciones adicionales: confirmar, cancelar, reprogramar.
    """
    queryset = Cita.objects.select_related(
        'id_paciente', 'id_especialista__usuario', 'id_tipo_cita', 'creado_por'
    ).all()
    serializer_class = CitaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'id_especialista', 'id_paciente', 'id_tipo_cita']
    search_fields = [
        'id_paciente__nombres', 'id_paciente__apellidos',
        'id_especialista__usuario__nombres', 'motivo',
    ]
    ordering_fields = ['fecha_hora_inicio', 'estado', 'fecha_creacion']
    ordering = ['fecha_hora_inicio']

    def perform_create(self, serializer):
        cita = serializer.save(creado_por=self.request.user)
        registrar_bitacora(
            usuario=self.request.user, modulo='appointments', accion=AccionBitacora.CREAR,
            descripcion=f'Cita programada #{cita.id_cita} — {cita.id_paciente} con {cita.id_especialista}',
            tabla_afectada='citas', id_registro_afectado=cita.id_cita,
            ip_origen=get_client_ip(self.request),
        )

    @action(detail=True, methods=['post'])
    def confirmar(self, request, pk=None):
        """POST /api/v1/citas/{id}/confirmar/"""
        cita = self.get_object()
        if cita.estado not in (EstadoCita.PROGRAMADA, EstadoCita.REPROGRAMADA):
            return Response({'error': f'No se puede confirmar una cita en estado {cita.estado}.'}, status=400)
        cita.estado = EstadoCita.CONFIRMADA
        cita.confirmada_en = timezone.now()
        cita.save(update_fields=['estado', 'confirmada_en'])
        registrar_bitacora(
            usuario=request.user, modulo='appointments', accion=AccionBitacora.CONFIRMAR,
            descripcion=f'Cita #{cita.id_cita} confirmada',
            tabla_afectada='citas', id_registro_afectado=cita.id_cita,
            ip_origen=get_client_ip(request),
        )
        return Response(CitaSerializer(cita).data)

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """POST /api/v1/citas/{id}/cancelar/"""
        cita = self.get_object()
        if cita.estado in (EstadoCita.ATENDIDA, EstadoCita.CANCELADA):
            return Response({'error': f'No se puede cancelar una cita en estado {cita.estado}.'}, status=400)
        cita.estado = EstadoCita.CANCELADA
        motivo = request.data.get('motivo', '')
        if motivo:
            cita.observaciones = motivo
        cita.save(update_fields=['estado', 'observaciones'])
        registrar_bitacora(
            usuario=request.user, modulo='appointments', accion=AccionBitacora.CANCELAR,
            descripcion=f'Cita #{cita.id_cita} cancelada. Motivo: {motivo}',
            tabla_afectada='citas', id_registro_afectado=cita.id_cita,
            ip_origen=get_client_ip(request),
        )
        return Response(CitaSerializer(cita).data)

    @action(detail=True, methods=['post'])
    def reprogramar(self, request, pk=None):
        """
        POST /api/v1/citas/{id}/reprogramar/
        Body: { "fecha_hora_inicio": "...", "fecha_hora_fin": "..." }
        Crea una nueva cita referenciando la original, y cancela la antigua.
        """
        cita_original = self.get_object()
        nueva_data = {
            'id_paciente': cita_original.id_paciente_id,
            'id_especialista': cita_original.id_especialista_id,
            'id_tipo_cita': cita_original.id_tipo_cita_id,
            'fecha_hora_inicio': request.data.get('fecha_hora_inicio'),
            'fecha_hora_fin': request.data.get('fecha_hora_fin'),
            'motivo': cita_original.motivo,
            'id_cita_reprogramada_desde': cita_original.id_cita,
        }
        serializer = CitaSerializer(data=nueva_data)
        serializer.is_valid(raise_exception=True)
        nueva_cita = serializer.save(
            creado_por=request.user, estado=EstadoCita.REPROGRAMADA
        )
        # Marcar original como reprogramada
        cita_original.estado = EstadoCita.REPROGRAMADA
        cita_original.save(update_fields=['estado'])
        registrar_bitacora(
            usuario=request.user, modulo='appointments', accion=AccionBitacora.REPROGRAMAR,
            descripcion=f'Cita #{cita_original.id_cita} reprogramada → nueva #{nueva_cita.id_cita}',
            tabla_afectada='citas', id_registro_afectado=nueva_cita.id_cita,
            ip_origen=get_client_ip(request),
        )
        return Response(CitaSerializer(nueva_cita).data, status=status.HTTP_201_CREATED)
