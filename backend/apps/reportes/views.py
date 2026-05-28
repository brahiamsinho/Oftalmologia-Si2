"""
ViewSets para plantillas de reporte QBE (CU21/CU22) y ejecución segura.
"""
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import HttpResponse
from django.utils.text import slugify
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.reportes.models import ReportTemplate
from apps.reportes.serializers import ReportExecutionSerializer, ReportTemplateSerializer
from apps.reportes.services.export_engine import (
    qbe_result_to_csv_bytes,
    qbe_result_to_excel_bytes,
    qbe_result_to_pdf_bytes,
)
from apps.reportes.services.qbe_engine import QBESafeQueryError, QBEEngine


class ReportTemplateViewSet(viewsets.ModelViewSet):
    """
    CRUD de `ReportTemplate`.

    - Lista / crea / actualiza / elimina plantillas con `qbe_payload`.
    - ``POST .../execute/`` — ejecuta QBE on-the-fly.
    - ``POST .../export-excel/`` — mismo JSON QBE, respuesta .xlsx en memoria.
    - ``POST .../export-pdf/`` — mismo JSON QBE, respuesta .pdf en memoria.
    - ``POST .../export-csv/`` — mismo JSON QBE, respuesta .csv en memoria.
    """

    serializer_class = ReportTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Schema actual = tenant (django-tenants); sin filtrado extra en el esqueleto."""
        return ReportTemplate.objects.all().select_related('created_by')

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(created_by=user if user.is_authenticated else None)

    def _validated_qbe_payload(self, request):
        """Parsea y valida el cuerpo igual que ``execute`` / ``export_excel``."""
        serializer = ReportExecutionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        payload_in = {
            'model': data['model'],
            'filters': data.get('filters') or {},
            'fields': data.get('fields'),
            'order_by': data.get('order_by') or [],
        }
        return payload_in, data

    @action(detail=False, methods=['post'], url_path='execute')
    def execute(self, request):
        """
        Ejecuta un documento QBE validado contra ``QBEEngine`` (whitelist + ORM).

        No acepta SQL ni texto libre: solo el JSON validado por
        `ReportExecutionSerializer`.
        """
        payload_in, data = self._validated_qbe_payload(request)
        try:
            result = QBEEngine().execute(payload_in)
        except DjangoValidationError as exc:
            detail = getattr(exc, 'message_dict', None) or list(getattr(exc, 'messages', [str(exc)]))
            return Response({'detail': detail}, status=status.HTTP_400_BAD_REQUEST)
        except QBESafeQueryError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        if data.get('aggregations'):
            result.setdefault('meta', {})['aggregations_requested'] = list(data['aggregations'])
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='export-excel')
    def export_excel(self, request):
        """
        Recibe el mismo JSON que ``execute``, ejecuta ``QBEEngine`` y devuelve un .xlsx.
        Todo el flujo es en memoria (sin guardar en disco).
        """
        payload_in, _data = self._validated_qbe_payload(request)
        try:
            result = QBEEngine().execute(payload_in)
        except DjangoValidationError as exc:
            detail = getattr(exc, 'message_dict', None) or list(getattr(exc, 'messages', [str(exc)]))
            return Response({'detail': detail}, status=status.HTTP_400_BAD_REQUEST)
        except QBESafeQueryError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        buffer = qbe_result_to_excel_bytes(result)
        model_slug = slugify(result.get('meta', {}).get('model') or 'reporte') or 'reporte'
        filename = f'reporte-{model_slug}.xlsx'

        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    def _export_file_response(self, result: dict, *, ext: str, content_type: str, builder):
        buffer = builder(result)
        model_slug = slugify(result.get('meta', {}).get('model') or 'reporte') or 'reporte'
        filename = f'reporte-{model_slug}.{ext}'
        response = HttpResponse(buffer.getvalue(), content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=['post'], url_path='export-pdf')
    def export_pdf(self, request):
        """Ejecuta QBE y devuelve un PDF en memoria."""
        payload_in, _data = self._validated_qbe_payload(request)
        try:
            result = QBEEngine().execute(payload_in)
        except DjangoValidationError as exc:
            detail = getattr(exc, 'message_dict', None) or list(getattr(exc, 'messages', [str(exc)]))
            return Response({'detail': detail}, status=status.HTTP_400_BAD_REQUEST)
        except QBESafeQueryError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return self._export_file_response(
            result,
            ext='pdf',
            content_type='application/pdf',
            builder=qbe_result_to_pdf_bytes,
        )

    @action(detail=False, methods=['post'], url_path='export-csv')
    def export_csv(self, request):
        """Ejecuta QBE y devuelve un CSV en memoria."""
        payload_in, _data = self._validated_qbe_payload(request)
        try:
            result = QBEEngine().execute(payload_in)
        except DjangoValidationError as exc:
            detail = getattr(exc, 'message_dict', None) or list(getattr(exc, 'messages', [str(exc)]))
            return Response({'detail': detail}, status=status.HTTP_400_BAD_REQUEST)
        except QBESafeQueryError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return self._export_file_response(
            result,
            ext='csv',
            content_type='text/csv; charset=utf-8',
            builder=qbe_result_to_csv_bytes,
        )
