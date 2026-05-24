from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdministrativoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import BeneficioPaciente, PromocionDescuento
from .serializers import (
    BeneficioPacienteSerializer,
    BeneficiosAplicablesSerializer,
    PromocionDescuentoSerializer,
    VerificarAplicacionSerializer,
)


class DescuentosBitacoraMixin:
    modulo_bitacora = 'descuentos'
    tabla_bitacora = ''
    id_field_name = 'id'

    def _id_value(self, instance):
        return getattr(instance, self.id_field_name)

    def _registrar(self, accion: str, descripcion: str, instance):
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
            f'Creó registro en {self.tabla_bitacora} #{self._id_value(instance)}',
            instance,
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        self._registrar(
            AccionBitacora.EDITAR,
            f'Editó registro en {self.tabla_bitacora} #{self._id_value(instance)}',
            instance,
        )

    def perform_destroy(self, instance):
        object_id = self._id_value(instance)
        self._registrar(
            AccionBitacora.ELIMINAR,
            f'Eliminó registro en {self.tabla_bitacora} #{object_id}',
            instance,
        )
        super().perform_destroy(instance)


class PromocionDescuentoViewSet(DescuentosBitacoraMixin, viewsets.ModelViewSet):
    queryset = PromocionDescuento.objects.select_related('creado_por').all()
    serializer_class = PromocionDescuentoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'tipo_beneficio', 'alcance', 'compatibilidad_seguro']
    search_fields = ['codigo', 'nombre', 'descripcion', 'condiciones_aplicacion']
    ordering_fields = ['fecha_inicio', 'fecha_fin', 'nombre', 'created_at']
    ordering = ['-fecha_inicio']
    tabla_bitacora = 'descuentos_promociones'
    id_field_name = 'id_promocion'

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsAdministrativoOrAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        instance = serializer.save(creado_por=self.request.user)
        self._registrar(
            AccionBitacora.CREAR,
            f'Creó promoción #{instance.id_promocion} ({instance.codigo})',
            instance,
        )

    @action(detail=False, methods=['get'], url_path='aplicables')
    def aplicables(self, request):
        """
        GET ?paciente_id=1&fecha=2026-05-23
        Lista promociones y marca cuáles aplican al paciente (CU19).
        """
        ser = BeneficiosAplicablesSerializer(
            data={
                'paciente_id': request.query_params.get('paciente_id'),
                'fecha': request.query_params.get('fecha') or None,
            },
        )
        ser.is_valid(raise_exception=True)
        return Response(ser.validated_data['resultado'], status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='verificar-aplicacion')
    def verificar_aplicacion(self, request):
        """
        GET ?paciente_id=1&promocion_id=2&fecha=2026-05-23
        """
        ser = VerificarAplicacionSerializer(
            data={
                'paciente_id': request.query_params.get('paciente_id'),
                'promocion_id': request.query_params.get('promocion_id'),
                'fecha': request.query_params.get('fecha') or None,
            },
        )
        ser.is_valid(raise_exception=True)
        return Response(ser.validated_data['resultado'], status=status.HTTP_200_OK)


class BeneficioPacienteViewSet(DescuentosBitacoraMixin, viewsets.ModelViewSet):
    queryset = BeneficioPaciente.objects.select_related('id_paciente', 'id_promocion').all()
    serializer_class = BeneficioPacienteSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'id_paciente', 'id_promocion', 'notificado']
    search_fields = [
        'id_paciente__nombres',
        'id_paciente__apellidos',
        'id_promocion__codigo',
        'id_promocion__nombre',
    ]
    ordering_fields = ['fecha_asignacion', 'fecha_fin', 'created_at']
    ordering = ['-fecha_asignacion']
    tabla_bitacora = 'descuentos_beneficios_paciente'
    id_field_name = 'id_beneficio'

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsAdministrativoOrAdmin()]
        return [IsAuthenticated()]
