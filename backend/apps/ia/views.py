"""
Vistas REST para CU23 (NL → QBE + ejecución de reporte).
"""
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
### Agregá esto para permitir acceso sin autenticación
from rest_framework.permissions import AllowAny

from apps.ia.serializers import NlpToReportRequestSerializer
from apps.ia.services.nlp_translator import GeminiQBETranslator, GeminiTranslatorError
from apps.reportes.services.qbe_engine import QBESafeQueryError, QBEEngine


class NlpToReportView(APIView):
    """
    POST ``/api/ia/nlp-to-report/`` (tenant: ``/t/<slug>/api/ia/nlp-to-report/``).

    1. Traduce ``query`` con ``GeminiQBETranslator.translate_to_qbe``.
    2. Ejecuta el JSON con ``QBEEngine.execute`` (misma whitelist que reportes).
    """
    permission_classes = [AllowAny]  # <- Agregá esto
    # permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        ser = NlpToReportRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        text = ser.validated_data['query']

        try:
            translator = GeminiQBETranslator()
            qbe = translator.translate_to_qbe(text)
        except GeminiTranslatorError as exc:
            return Response(
                {'detail': str(exc), 'qbe': None, 'report': None},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        payload = {
            'model': qbe['model'],
            'filters': qbe.get('filters') or {},
            'fields': qbe.get('fields'),
            'order_by': qbe.get('order_by') or [],
        }

        try:
            report = QBEEngine().execute(payload)
        except DjangoValidationError as exc:
            detail = getattr(exc, 'message_dict', None) or list(
                getattr(exc, 'messages', [str(exc)]),
            )
            return Response(
                {
                    'qbe': qbe,
                    'report': None,
                    'report_error': detail,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except QBESafeQueryError as exc:
            return Response(
                {'qbe': qbe, 'report': None, 'report_error': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                'qbe': qbe,
                'report': report,
            },
            status=status.HTTP_200_OK,
        )
