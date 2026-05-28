"""
ViewSets para plantillas de reporte QBE (CU21/CU22) y ejecución segura.
"""
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import HttpResponse
from django.utils.text import slugify
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.bitacora.models import AccionBitacora
from apps.core.utils import get_client_ip, registrar_bitacora
from apps.reportes.models import ReportTemplate
from apps.reportes.serializers import ReportExecutionSerializer, ReportTemplateSerializer
from apps.reportes.services.export_engine import (
    qbe_result_to_csv_bytes,
    qbe_result_to_excel_bytes,
    qbe_result_to_pdf_bytes,
)
from apps.reportes.services.qbe_engine import QBESafeQueryError, QBEEngine


class ReportesBitacoraMixin:
    modulo_bitacora = 'reportes'
    tabla_bitacora = 'reportes_plantilla'

    def _registrar_bitacora(self, accion: str, descripcion: str, id_registro=None):
        registrar_bitacora(
            usuario=self.request.user,
            modulo=self.modulo_bitacora,
            accion=accion,
            descripcion=descripcion,
            tabla_afectada=self.tabla_bitacora,
            id_registro_afectado=id_registro,
            ip_origen=get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
        )


class ReportTemplateViewSet(ReportesBitacoraMixin, viewsets.ModelViewSet):
    """
    CRUD de `ReportTemplate`.

    - CU22: plantillas con `is_system_report=True` (predefinidas, solo lectura/ejecución).
    - CU21: plantillas personalizadas (`is_system_report=False`).
    - ``POST .../execute/`` — ejecuta QBE on-the-fly.
    - ``POST .../export-excel/`` — mismo JSON QBE, respuesta .xlsx en memoria.
    - ``POST .../export-pdf/`` — mismo JSON QBE, respuesta .pdf en memoria.
    - ``POST .../export-csv/`` — mismo JSON QBE, respuesta .csv en memoria.
    """

    serializer_class = ReportTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ReportTemplate.objects.all().select_related('created_by')
        raw = self.request.query_params.get('is_system_report')
        if raw is None:
            return qs
        normalized = raw.strip().lower()
        if normalized in ('true', '1', 'yes'):
            return qs.filter(is_system_report=True)
        if normalized in ('false', '0', 'no'):
            return qs.filter(is_system_report=False)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save(
            created_by=self.request.user if self.request.user.is_authenticated else None,
            is_system_report=False,
        )
        self._registrar_bitacora(
            AccionBitacora.CREAR,
            f'Creó plantilla de reporte personalizado: {instance.nombre}',
            instance.pk,
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.is_system_report:
            raise PermissionDenied('Los reportes predefinidos del sistema no se pueden modificar.')
        instance = serializer.save()
        self._registrar_bitacora(
            AccionBitacora.EDITAR,
            f'Editó plantilla de reporte: {instance.nombre}',
            instance.pk,
        )

    def perform_destroy(self, instance):
        if instance.is_system_report:
            raise PermissionDenied('Los reportes predefinidos del sistema no se pueden eliminar.')
        nombre = instance.nombre
        pk = instance.pk
        super().perform_destroy(instance)
        self._registrar_bitacora(
            AccionBitacora.ELIMINAR,
            f'Eliminó plantilla de reporte: {nombre}',
            pk,
        )

    def _validated_qbe_payload(self, request):
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

    def _execute_payload(self, payload_in: dict, *, descripcion_bitacora: str):
        try:
            result = QBEEngine().execute(payload_in)
        except DjangoValidationError as exc:
            detail = getattr(exc, 'message_dict', None) or list(
                getattr(exc, 'messages', [str(exc)]),
            )
            return None, Response({'detail': detail}, status=status.HTTP_400_BAD_REQUEST)
        except QBESafeQueryError as exc:
            return None, Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        self._registrar_bitacora(AccionBitacora.CREAR, descripcion_bitacora)
        return result, None

    @action(detail=True, methods=['post'], url_path='run')
    def run_template(self, request, pk=None):
        """Ejecuta una plantilla persistida y retorna `{qbe, report}`."""
        template = self.get_object()
        payload_in = dict(template.qbe_payload or {})
        model_label = payload_in.get('model', template.nombre or 'reporte')
        result, error_response = self._execute_payload(
            payload_in,
            descripcion_bitacora=f'Ejecutó plantilla de reporte "{template.nombre}" (modelo {model_label})',
        )
        if error_response:
            return error_response
        return Response(
            {
                'qbe': payload_in,
                'report': result,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['post'], url_path='execute')
    def execute(self, request):
        """Ejecuta un documento QBE validado contra ``QBEEngine``."""
        payload_in, data = self._validated_qbe_payload(request)
        model_label = payload_in.get('model', 'reporte')
        result, error_response = self._execute_payload(
            payload_in,
            descripcion_bitacora=f'Ejecutó reporte personalizado (modelo {model_label})',
        )
        if error_response:
            return error_response
        if data.get('aggregations'):
            result.setdefault('meta', {})['aggregations_requested'] = list(data['aggregations'])
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='export-excel')
    def export_excel(self, request):
        """Recibe el mismo JSON que ``execute``, ejecuta y devuelve un .xlsx."""
        payload_in, _data = self._validated_qbe_payload(request)
        model_label = payload_in.get('model', 'reporte')
        result, error_response = self._execute_payload(
            payload_in,
            descripcion_bitacora=f'Exportó reporte a Excel (modelo {model_label})',
        )
        if error_response:
            return error_response

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
        model_label = payload_in.get('model', 'reporte')
        result, error_response = self._execute_payload(
            payload_in,
            descripcion_bitacora=f'Exportó reporte a PDF (modelo {model_label})',
        )
        if error_response:
            return error_response
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
        model_label = payload_in.get('model', 'reporte')
        result, error_response = self._execute_payload(
            payload_in,
            descripcion_bitacora=f'Exportó reporte a CSV (modelo {model_label})',
        )
        if error_response:
            return error_response
        return self._export_file_response(
            result,
            ext='csv',
            content_type='text/csv; charset=utf-8',
            builder=qbe_result_to_csv_bytes,
        )
