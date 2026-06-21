"""
Vistas REST para CU23 (NL → QBE + ejecución de reporte).
"""
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ia.serializers import ChatbotMessageRequestSerializer, NlpToReportRequestSerializer
from apps.ia.services.chatbot import GeminiChatbotAssistant, GeminiChatbotError
from apps.ia.services.derivation import derive_critical_case_to_staff
from apps.ia.services.nlp_translator import GeminiQBETranslator, GeminiTranslatorError
from apps.reportes.services.export_intent import parse_export_formats_from_query
from apps.reportes.services.qbe_engine import QBESafeQueryError, QBEEngine


class NlpToReportView(APIView):
    """
    POST ``/api/ia/nlp-to-report/`` (tenant: ``/t/<slug>/api/ia/nlp-to-report/``).

    1. Traduce ``query`` con ``GeminiQBETranslator.translate_to_qbe``.
    2. Ejecuta el JSON con ``QBEEngine.execute`` (misma whitelist que reportes).
    """
    permission_classes = [IsAuthenticated]

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

        export_formats = parse_export_formats_from_query(text)

        return Response(
            {
                'qbe': qbe,
                'report': report,
                'export_formats': export_formats,
            },
            status=status.HTTP_200_OK,
        )


class ChatbotMessageView(APIView):
    """
    POST ``/api/ia/chatbot/`` (tenant: ``/t/<slug>/api/ia/chatbot/``).

    Recibe mensaje + historial corto y responde con texto del asistente virtual.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        ser = ChatbotMessageRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        message = ser.validated_data['message']
        history = ser.validated_data.get('history') or []

        try:
            assistant = GeminiChatbotAssistant()
            result = assistant.generate_reply(message=message, history=history)
        except GeminiChatbotError as exc:
            return Response(
                {'detail': str(exc), 'reply': ''},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        derivacion = derive_critical_case_to_staff(
            user=request.user,
            message=message,
            reply=result['reply'],
        )
        result['derivacion'] = derivacion

        return Response(result, status=status.HTTP_200_OK)
