from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsMedicoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora
from apps.pacientes.pacientes.models import Paciente

from .models import Cirugia, EstadoCirugia
from .serializers import CirugiaSerializer


class CirugiaViewSet(viewsets.ModelViewSet):
    queryset = Cirugia.objects.select_related(
        'id_paciente',
        'id_historia_clinica',
        'id_preoperatorio',
        'id_cita',
        'cirujano',
    ).all()
    serializer_class = CirugiaSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado_cirugia', 'id_paciente', 'id_historia_clinica', 'id_preoperatorio', 'cirujano']
    search_fields = [
        'id_paciente__nombres',
        'id_paciente__apellidos',
        'procedimiento',
        'resultado',
        'complicaciones',
        'observaciones',
    ]
    ordering_fields = ['fecha_programada', 'fecha_real_inicio', 'fecha_real_fin', 'created_at']
    ordering = ['-fecha_programada', '-created_at']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy', 'reprogramar'):
            return [IsAuthenticated(), IsMedicoOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return Cirugia.objects.none()

        tipo = getattr(user, 'tipo_usuario', '') or ''
        if tipo == 'PACIENTE':
            paciente = Paciente.objects.filter(usuario=user).first()
            if not paciente:
                return Cirugia.objects.none()
            return queryset.filter(id_paciente=paciente)
        if tipo in ('MEDICO', 'ESPECIALISTA'):
            return queryset.filter(cirujano=user)
        if tipo in ('ADMIN', 'ADMINISTRATIVO'):
            return queryset
        return Cirugia.objects.none()

    def perform_create(self, serializer):
        instance = serializer.save(cirujano=self.request.user)
        registrar_bitacora(
            usuario=self.request.user,
            modulo='cirugias',
            accion=AccionBitacora.CREAR,
            descripcion=f'Registro cirugia #{instance.id_cirugia}',
            tabla_afectada='cirugias',
            id_registro_afectado=instance.id_cirugia,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='cirugias',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Edito cirugia #{instance.id_cirugia}',
            tabla_afectada='cirugias',
            id_registro_afectado=instance.id_cirugia,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_destroy(self, instance):
        object_id = instance.id_cirugia
        registrar_bitacora(
            usuario=self.request.user,
            modulo='cirugias',
            accion=AccionBitacora.ELIMINAR,
            descripcion=f'Elimino cirugia #{object_id}',
            tabla_afectada='cirugias',
            id_registro_afectado=object_id,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )
        super().perform_destroy(instance)

    @action(detail=True, methods=['post'])
    def reprogramar(self, request, pk=None):
        cirugia = self.get_object()
        nueva_fecha = request.data.get('fecha_programada')
        motivo = (request.data.get('motivo_reprogramacion') or '').strip()

        if not nueva_fecha:
            return Response({'fecha_programada': 'Este campo es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)

        ser = CirugiaSerializer(
            cirugia,
            data={
                'fecha_programada': nueva_fecha,
                'estado_cirugia': EstadoCirugia.REPROGRAMADA,
                'motivo_reprogramacion': motivo,
            },
            partial=True,
        )
        ser.is_valid(raise_exception=True)
        ser.save()

        registrar_bitacora(
            usuario=request.user,
            modulo='cirugias',
            accion=AccionBitacora.REPROGRAMAR,
            descripcion=f'Reprogramo cirugia #{cirugia.id_cirugia}',
            tabla_afectada='cirugias',
            id_registro_afectado=cirugia.id_cirugia,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        return Response(CirugiaSerializer(cirugia).data)

