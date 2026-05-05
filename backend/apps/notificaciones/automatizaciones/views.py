from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsAdministrativoOrAdmin
from apps.core.utils import get_client_ip, registrar_bitacora

from .models import EstadoTarea, LogEjecucionRecordatorio, ReglaRecordatorio, TareaRecordatorioProgramada
from .serializers import (
    GenerarTareaSerializer,
    LogEjecucionRecordatorioSerializer,
    ReglaRecordatorioSerializer,
    TareaRecordatorioSerializer,
    procesar_tarea_recordatorio,
)


class AutomatizacionesBitacoraMixin:
    modulo_bitacora = 'notificaciones_automatizaciones'
    tabla_bitacora = ''
    id_field_name = 'id'

    def _id_value(self, instance):
        return getattr(instance, self.id_field_name)

    def _registrar(self, accion, descripcion, instance):
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


class ReglaRecordatorioViewSet(AutomatizacionesBitacoraMixin, viewsets.ModelViewSet):
    queryset = ReglaRecordatorio.objects.select_related('creado_por').all()
    serializer_class = ReglaRecordatorioSerializer
    tabla_bitacora = 'notificaciones_reglas_recordatorio'
    id_field_name = 'id_regla'

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsAdministrativoOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = getattr(self.request, 'tenant', None)
        return qs.for_tenant(tenant)

    def perform_create(self, serializer):
        instance = serializer.save(creado_por=self.request.user)
        self._registrar(AccionBitacora.CREAR, f'Creo regla de recordatorio #{instance.id_regla}', instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        self._registrar(AccionBitacora.EDITAR, f'Edito regla de recordatorio #{instance.id_regla}', instance)

    def perform_destroy(self, instance):
        object_id = instance.id_regla
        self._registrar(AccionBitacora.ELIMINAR, f'Elimino regla de recordatorio #{object_id}', instance)
        super().perform_destroy(instance)


class TareaRecordatorioViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = TareaRecordatorioProgramada.objects.select_related(
        'id_regla',
        'id_paciente',
        'id_postoperatorio',
    ).all()
    serializer_class = TareaRecordatorioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        tenant = getattr(self.request, 'tenant', None)
        queryset = queryset.for_tenant(tenant)
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)
        return queryset

    def get_permissions(self):
        if self.action in ('generar', 'procesar_pendientes'):
            return [IsAuthenticated(), IsAdministrativoOrAdmin()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'], url_path='generar')
    def generar(self, request):
        serializer = GenerarTareaSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        tarea = serializer.save()
        registrar_bitacora(
            usuario=request.user,
            modulo='notificaciones_automatizaciones',
            accion=AccionBitacora.CREAR,
            descripcion=f'Genero tarea de recordatorio #{tarea.id_tarea}',
            tabla_afectada='notificaciones_tareas_recordatorio',
            id_registro_afectado=tarea.id_tarea,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )
        return Response(TareaRecordatorioSerializer(tarea).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='procesar')
    def procesar_pendientes(self, request):
        pendientes = self.get_queryset().filter(
            estado=EstadoTarea.PENDIENTE,
            programada_para__lte=timezone.now(),
        )[:50]
        procesadas = 0
        for tarea in pendientes:
            procesar_tarea_recordatorio(tarea)
            procesadas += 1
        return Response({'procesadas': procesadas})


class LogEjecucionRecordatorioViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = LogEjecucionRecordatorio.objects.select_related('id_tarea').all()
    serializer_class = LogEjecucionRecordatorioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = getattr(self.request, 'tenant', None)
        return qs.for_tenant(tenant)
