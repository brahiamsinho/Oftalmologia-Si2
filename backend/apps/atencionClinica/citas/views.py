"""
apps/appointments/views.py
"""
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.atencionClinica.especialistas.models import Especialista
from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdministrativoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora
from apps.pacientes.pacientes.models import Paciente

from .models import Cita, DisponibilidadEspecialista, EstadoCita, TipoCita
from .serializers import CitaSerializer, DisponibilidadEspecialistaSerializer, TipoCitaSerializer


class TipoCitaViewSet(viewsets.ModelViewSet):
    queryset = TipoCita.objects.all()
    serializer_class = TipoCitaSerializer
    permission_classes = [IsAuthenticated]


class DisponibilidadEspecialistaViewSet(viewsets.ModelViewSet):
    queryset = DisponibilidadEspecialista.objects.select_related('id_especialista__usuario').all()
    serializer_class = DisponibilidadEspecialistaSerializer
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['id_especialista', 'dia_semana', 'activo']
    ordering = ['id_especialista', 'dia_semana', 'hora_inicio']


class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.select_related(
        'id_paciente',
        'id_especialista__usuario',
        'id_tipo_cita',
        'creado_por',
    ).all()
    serializer_class = CitaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'id_especialista', 'id_paciente', 'id_tipo_cita']
    search_fields = [
        'id_paciente__nombres',
        'id_paciente__apellidos',
        'id_especialista__usuario__nombres',
        'motivo',
    ]
    ordering_fields = ['fecha_hora_inicio', 'estado', 'fecha_creacion']
    ordering = ['fecha_hora_inicio']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user.is_authenticated:
            return Cita.objects.none()

        tipo = getattr(user, 'tipo_usuario', '') or ''

        if tipo == 'PACIENTE':
            paciente = Paciente.objects.filter(usuario=user).first()
            if not paciente:
                return Cita.objects.none()
            return queryset.filter(id_paciente=paciente)

        if tipo in ('MEDICO', 'ESPECIALISTA'):
            especialista = Especialista.objects.filter(usuario=user).first()
            if not especialista:
                return Cita.objects.none()
            return queryset.filter(id_especialista=especialista)

        if tipo in ('ADMIN', 'ADMINISTRATIVO'):
            return queryset

        return Cita.objects.none()

    def perform_create(self, serializer):
        cita = serializer.save(creado_por=self.request.user)
        registrar_bitacora(
            usuario=self.request.user,
            modulo='appointments',
            accion=AccionBitacora.CREAR,
            descripcion=f'Cita programada #{cita.id_cita} — {cita.id_paciente} con {cita.id_especialista}',
            tabla_afectada='citas',
            id_registro_afectado=cita.id_cita,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_update(self, serializer):
        cita = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='appointments',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Editó cita #{cita.id_cita}',
            tabla_afectada='citas',
            id_registro_afectado=cita.id_cita,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_destroy(self, instance):
        cid = instance.id_cita
        registrar_bitacora(
            usuario=self.request.user,
            modulo='appointments',
            accion=AccionBitacora.ELIMINAR,
            descripcion=f'Eliminó cita #{cid}',
            tabla_afectada='citas',
            id_registro_afectado=cid,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )
        super().perform_destroy(instance)

    @action(detail=True, methods=['post'])
    def confirmar(self, request, pk=None):
        cita = self.get_object()

        if cita.estado not in (EstadoCita.PROGRAMADA, EstadoCita.REPROGRAMADA):
            return Response(
                {'error': f'No se puede confirmar una cita en estado {cita.estado}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cita.estado = EstadoCita.CONFIRMADA
        cita.confirmada_en = timezone.now()
        cita.save(update_fields=['estado', 'confirmada_en'])

        registrar_bitacora(
            usuario=request.user,
            modulo='appointments',
            accion=AccionBitacora.CONFIRMAR,
            descripcion=f'Cita #{cita.id_cita} confirmada',
            tabla_afectada='citas',
            id_registro_afectado=cita.id_cita,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return Response(CitaSerializer(cita).data)

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        cita = self.get_object()

        if cita.estado in (EstadoCita.ATENDIDA, EstadoCita.CANCELADA):
            return Response(
                {'error': f'No se puede cancelar una cita en estado {cita.estado}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cita.estado = EstadoCita.CANCELADA
        motivo = request.data.get('motivo', '')

        if motivo:
            cita.observaciones = motivo

        cita.save(update_fields=['estado', 'observaciones'])

        registrar_bitacora(
            usuario=request.user,
            modulo='appointments',
            accion=AccionBitacora.CANCELAR,
            descripcion=f'Cita #{cita.id_cita} cancelada. Motivo: {motivo}',
            tabla_afectada='citas',
            id_registro_afectado=cita.id_cita,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return Response(CitaSerializer(cita).data)

    @action(detail=True, methods=['post'])
    def reprogramar(self, request, pk=None):
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

        serializer = CitaSerializer(data=nueva_data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        nueva_cita = serializer.save(
            creado_por=request.user,
            estado=EstadoCita.REPROGRAMADA,
        )

        cita_original.estado = EstadoCita.REPROGRAMADA
        cita_original.save(update_fields=['estado'])

        registrar_bitacora(
            usuario=request.user,
            modulo='appointments',
            accion=AccionBitacora.REPROGRAMAR,
            descripcion=f'Cita #{cita_original.id_cita} reprogramada → nueva #{nueva_cita.id_cita}',
            tabla_afectada='citas',
            id_registro_afectado=nueva_cita.id_cita,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return Response(CitaSerializer(nueva_cita).data, status=status.HTTP_201_CREATED)