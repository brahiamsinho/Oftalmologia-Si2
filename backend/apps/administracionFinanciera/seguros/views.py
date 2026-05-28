from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdministrativoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import AfiliacionSeguroPaciente, Aseguradora, Convenio
from .serializers import (
    AfiliacionSeguroPacienteSerializer,
    AseguradoraSerializer,
    ConvenioSerializer,
    VerificarCoberturaSerializer,
)


class SegurosBitacoraMixin:
    modulo_bitacora = 'seguros'
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


class AseguradoraViewSet(SegurosBitacoraMixin, viewsets.ModelViewSet):
    queryset = Aseguradora.objects.all()
    serializer_class = AseguradoraSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo']
    search_fields = ['codigo', 'nombre', 'razon_social', 'email']
    ordering_fields = ['nombre', 'codigo', 'created_at']
    ordering = ['nombre']
    tabla_bitacora = 'seguros_aseguradoras'
    id_field_name = 'id_aseguradora'

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsAdministrativoOrAdmin()]
        return [IsAuthenticated()]


class ConvenioViewSet(SegurosBitacoraMixin, viewsets.ModelViewSet):
    queryset = Convenio.objects.select_related('id_aseguradora', 'creado_por').all()
    serializer_class = ConvenioSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'id_aseguradora']
    search_fields = ['codigo', 'nombre', 'descripcion', 'id_aseguradora__nombre']
    ordering_fields = ['fecha_inicio', 'fecha_fin', 'nombre', 'created_at']
    ordering = ['-fecha_inicio']
    tabla_bitacora = 'seguros_convenios'
    id_field_name = 'id_convenio'

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsAdministrativoOrAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        instance = serializer.save(creado_por=self.request.user)
        self._registrar(
            AccionBitacora.CREAR,
            f'Creó convenio #{instance.id_convenio}',
            instance,
        )

    @action(detail=False, methods=['get'], url_path='verificar-cobertura')
    def verificar_cobertura(self, request):
        """
        GET ?paciente_id=1&fecha=2026-05-23
        Devuelve cobertura principal vigente del paciente (CU18).
        """
        ser = VerificarCoberturaSerializer(
            data={
                'paciente_id': request.query_params.get('paciente_id'),
                'fecha': request.query_params.get('fecha') or None,
            },
        )
        ser.is_valid(raise_exception=True)
        return Response(ser.validated_data['resultado'], status=status.HTTP_200_OK)


class AfiliacionSeguroPacienteViewSet(SegurosBitacoraMixin, viewsets.ModelViewSet):
    queryset = AfiliacionSeguroPaciente.objects.select_related(
        'id_paciente',
        'id_convenio',
        'id_convenio__id_aseguradora',
    ).all()
    serializer_class = AfiliacionSeguroPacienteSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['activo', 'es_principal', 'id_paciente', 'id_convenio']
    search_fields = [
        'numero_afiliado',
        'numero_poliza',
        'titular_nombre',
        'id_paciente__nombres',
        'id_paciente__apellidos',
        'id_convenio__nombre',
    ]
    ordering_fields = ['fecha_inicio', 'fecha_fin', 'created_at']
    ordering = ['-es_principal', '-fecha_inicio']
    tabla_bitacora = 'seguros_afiliaciones_paciente'
    id_field_name = 'id_afiliacion'

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsAdministrativoOrAdmin()]
        return [IsAuthenticated()]
