from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.text import slugify
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsMedicoOrAdmin, IsPaciente
from apps.pacientes.pacientes.models import Paciente

from .models import DocumentoClinicoAutorizado, EstadoDocumentoClinico, HistoriaClinica
from .serializers import (
    DocumentoClinicoAutorizadoSerializer,
    HistoriaClinicaDetalleSerializer,
    HistoriaClinicaSerializer,
)
from .services import documento_clinico_download_filename, generar_documento_clinico_pdf


class HistoriaClinicaViewSet(viewsets.ModelViewSet):
    queryset = HistoriaClinica.objects.select_related('id_paciente').all()
    permission_classes = [IsAuthenticated, IsMedicoOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado']
    search_fields = [
        'id_paciente__nombres',
        'id_paciente__apellidos',
        'id_paciente__numero_historia',
    ]
    ordering = ['-fecha_apertura']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return HistoriaClinicaDetalleSerializer
        return HistoriaClinicaSerializer


class DocumentoClinicoAutorizadoViewSet(viewsets.ModelViewSet):
    queryset = DocumentoClinicoAutorizado.objects.select_related(
        'id_historia_clinica',
        'id_paciente',
        'autorizado_por',
    ).all()
    serializer_class = DocumentoClinicoAutorizadoSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy', 'autorizar'):
            return [IsAuthenticated(), IsMedicoOrAdmin()]

        if self.action in ('list', 'retrieve', 'download'):
            if self.kwargs.get('id_historia_clinica') is None:
                return [IsAuthenticated(), IsPaciente()]
            return [IsAuthenticated(), IsMedicoOrAdmin()]

        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        tipo = getattr(user, 'tipo_usuario', '') or ''

        if not user.is_authenticated:
            return queryset.none()

        if tipo == 'PACIENTE':
            paciente = Paciente.objects.filter(usuario=user).first()
            if not paciente:
                return queryset.none()
            return queryset.filter(
                id_paciente=paciente,
                estado=EstadoDocumentoClinico.AUTORIZADO,
            )

        historia_id = self.kwargs.get('id_historia_clinica')
        if historia_id:
            return queryset.filter(id_historia_clinica=historia_id)

        return queryset.none()

    def perform_create(self, serializer):
        historia = get_object_or_404(
            HistoriaClinica.objects.select_related('id_paciente'),
            pk=self.kwargs.get('id_historia_clinica'),
        )
        serializer.save(
            id_historia_clinica=historia,
            id_paciente=historia.id_paciente,
            estado=EstadoDocumentoClinico.BORRADOR,
            nombre_archivo_descarga=serializer.validated_data.get('nombre_archivo_descarga')
            or slugify(serializer.validated_data.get('titulo') or 'documento-clinico')
            or 'documento-clinico',
        )

    @action(detail=True, methods=['post'], url_path='autorizar')
    def autorizar(self, request, *args, **kwargs):
        documento = self.get_object()
        documento.autorizar(request.user)
        documento.save(update_fields=['estado', 'autorizado_por', 'autorizado_en', 'updated_at'])
        return Response(self.get_serializer(documento).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, *args, **kwargs):
        documento = self.get_object()
        pdf_bytes = generar_documento_clinico_pdf(documento)
        filename = documento_clinico_download_filename(documento)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
