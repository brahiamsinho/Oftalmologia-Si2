from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsMedicoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora
from apps.pacientes.pacientes.models import Paciente

from .models import Postoperatorio
from .serializers import PostoperatorioSerializer


class PostoperatorioViewSet(viewsets.ModelViewSet):
    queryset = Postoperatorio.objects.select_related(
        'id_paciente',
        'id_historia_clinica',
        'id_cirugia',
        'profesional_atiende',
    ).all()
    serializer_class = PostoperatorioSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'estado_postoperatorio',
        'id_paciente',
        'id_cirugia',
        'profesional_atiende',
    ]
    search_fields = [
        'id_paciente__nombres',
        'id_paciente__apellidos',
        'alertas',
        'observaciones',
    ]
    ordering_fields = ['fecha_control', 'proximo_control', 'created_at', 'updated_at']
    ordering = ['-fecha_control', '-created_at']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsMedicoOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return Postoperatorio.objects.none()

        tipo = getattr(user, 'tipo_usuario', '') or ''
        if tipo == 'PACIENTE':
            paciente = Paciente.objects.filter(usuario=user).first()
            if not paciente:
                return Postoperatorio.objects.none()
            queryset = queryset.filter(id_paciente=paciente)
        elif tipo in ('MEDICO', 'ESPECIALISTA'):
            queryset = queryset.filter(profesional_atiende=user)
        elif tipo not in ('ADMIN', 'ADMINISTRATIVO'):
            return Postoperatorio.objects.none()

        fecha = self.request.query_params.get('fecha')
        if fecha:
            queryset = queryset.filter(fecha_control__date=fecha)
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(profesional_atiende=self.request.user)
        registrar_bitacora(
            usuario=self.request.user,
            modulo='postoperatorio',
            accion=AccionBitacora.CREAR,
            descripcion=f'Registro postoperatorio #{instance.id_postoperatorio}',
            tabla_afectada='postoperatorios',
            id_registro_afectado=instance.id_postoperatorio,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        registrar_bitacora(
            usuario=self.request.user,
            modulo='postoperatorio',
            accion=AccionBitacora.EDITAR,
            descripcion=f'Edito postoperatorio #{instance.id_postoperatorio}',
            tabla_afectada='postoperatorios',
            id_registro_afectado=instance.id_postoperatorio,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_destroy(self, instance):
        object_id = instance.id_postoperatorio
        registrar_bitacora(
            usuario=self.request.user,
            modulo='postoperatorio',
            accion=AccionBitacora.ELIMINAR,
            descripcion=f'Elimino postoperatorio #{object_id}',
            tabla_afectada='postoperatorios',
            id_registro_afectado=object_id,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )
        super().perform_destroy(instance)
