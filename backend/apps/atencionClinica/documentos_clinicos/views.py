from __future__ import annotations

from django.core.files.storage import default_storage
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.bitacora.models import AccionBitacora, Bitacora
from apps.core.permissions import IsMedicoOrAdmin, IsPacienteOrStaff
from apps.pacientes.historial_clinico.models import HistoriaClinica

from .models import DocumentoClinicoAutorizado, EstadoDocumentoClinico
from .serializers import DocumentoClinicoSerializer


class DocumentoClinicoViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = DocumentoClinicoSerializer
    lookup_field = 'id_documento_clinico'
    lookup_url_kwarg = 'pk'

    def get_permissions(self):
        if self.action in {'create', 'update', 'partial_update', 'destroy'}:
            return [IsAuthenticated(), IsMedicoOrAdmin()]
        return [IsAuthenticated(), IsPacienteOrStaff()]

    def _get_historia(self):
        historia_id = self.kwargs.get('id_historia_clinica')
        if historia_id is None:
            return None

        queryset = HistoriaClinica.objects.select_related('id_paciente', 'id_paciente__usuario')
        if getattr(self.request.user, 'tipo_usuario', None) == 'PACIENTE':
            return get_object_or_404(queryset, pk=historia_id, id_paciente__usuario=self.request.user)
        return get_object_or_404(queryset, pk=historia_id)

    def get_historia(self):
        if not hasattr(self, '_historia_cache'):
            self._historia_cache = self._get_historia()
        return self._historia_cache

    def get_queryset(self):
        historia = self.get_historia()
        queryset = DocumentoClinicoAutorizado.objects.select_related(
            'id_historia_clinica',
            'id_historia_clinica__id_paciente',
            'creado_por',
        ).filter(id_historia_clinica=historia)

        if getattr(self.request.user, 'tipo_usuario', None) == 'PACIENTE':
            queryset = queryset.filter(estado=EstadoDocumentoClinico.ACTIVO)

        estado = (self.request.query_params.get('estado') or '').strip()
        tipo_documento = (self.request.query_params.get('tipo_documento') or '').strip()
        if estado:
            queryset = queryset.filter(estado=estado)
        if tipo_documento:
            queryset = queryset.filter(tipo_documento=tipo_documento)

        return queryset

    def perform_create(self, serializer):
        documento = serializer.save(
            id_historia_clinica=self.get_historia(),
            creado_por=self.request.user,
        )
        Bitacora.objects.create(
            id_usuario=self.request.user,
            modulo='ATENCION_CLINICA',
            accion=AccionBitacora.CREAR,
            tabla_afectada='documentos_clinicos_autorizados',
            id_registro_afectado=documento.id_documento_clinico,
            descripcion=f'Documento clínico creado: {documento.titulo}',
            ip_origen=self.request.META.get('REMOTE_ADDR', ''),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_update(self, serializer):
        documento = serializer.save()
        Bitacora.objects.create(
            id_usuario=self.request.user,
            modulo='ATENCION_CLINICA',
            accion=AccionBitacora.EDITAR,
            tabla_afectada='documentos_clinicos_autorizados',
            id_registro_afectado=documento.id_documento_clinico,
            descripcion=f'Documento clínico actualizado: {documento.titulo}',
            ip_origen=self.request.META.get('REMOTE_ADDR', ''),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )

    def perform_destroy(self, instance):
        Bitacora.objects.create(
            id_usuario=self.request.user,
            modulo='ATENCION_CLINICA',
            accion=AccionBitacora.ELIMINAR,
            tabla_afectada='documentos_clinicos_autorizados',
            id_registro_afectado=instance.id_documento_clinico,
            descripcion=f'Documento clínico eliminado: {instance.titulo}',
            ip_origen=self.request.META.get('REMOTE_ADDR', ''),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )
        if instance.archivo and default_storage.exists(instance.archivo.name):
            default_storage.delete(instance.archivo.name)
        instance.delete()

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, *args, **kwargs):
        documento = self.get_object()
        if documento.estado != EstadoDocumentoClinico.ACTIVO or not documento.archivo:
            return Response({'detail': 'Documento no disponible para descarga.'}, status=status.HTTP_404_NOT_FOUND)

        Bitacora.objects.create(
            id_usuario=request.user,
            modulo='ATENCION_CLINICA',
            accion=AccionBitacora.DESCARGAR,
            tabla_afectada='documentos_clinicos_autorizados',
            id_registro_afectado=documento.id_documento_clinico,
            descripcion=f'Descarga de documento clínico: {documento.titulo}',
            ip_origen=request.META.get('REMOTE_ADDR', ''),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        archivo = documento.archivo.open('rb')
        nombre = documento.archivo.name.rsplit('/', 1)[-1]
        return FileResponse(archivo, as_attachment=True, filename=nombre)
