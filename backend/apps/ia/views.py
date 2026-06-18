"""
Vistas REST para CU23 (NL → QBE + ejecución de reporte).
"""
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bitacora.models import AccionBitacora
from apps.core.permissions import IsPaciente, IsStaffUser
from apps.core.utils import get_client_ip, registrar_bitacora
from apps.ia.models import ChatbotUrgencyClassification, CriticalHumanHandoff
from apps.ia.serializers import (
    ChatbotMessageRequestSerializer,
    CriticalHumanHandoffDetailSerializer,
    CriticalHumanHandoffListSerializer,
    NlpToReportRequestSerializer,
    UrgencyClassificationListSerializer,
    UrgencyClassificationRequestSerializer,
    UrgencyClassificationResponseSerializer,
)
from apps.ia.services.chatbot import GeminiChatbotAssistant, GeminiChatbotError
from apps.ia.services.human_handoff import create_handoff, notify_available_staff
from apps.ia.services.nlp_translator import GeminiQBETranslator, GeminiTranslatorError
from apps.ia.services.urgency_classifier import classify_urgency
from apps.pacientes.pacientes.models import Paciente
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

        return Response(result, status=status.HTTP_200_OK)


class UrgencyClassificationView(APIView):
    """
    POST ``/api/ia/urgency-classification/``
    (tenant: ``/t/<slug>/api/ia/urgency-classification/``).

    CU24: clasifica la urgencia de una consulta del paciente con reglas
    determinísticas, persiste el resultado y registra bitácora sin exponer el
    texto clínico completo.
    """

    permission_classes = [IsAuthenticated, IsPaciente]

    def post(self, request, *args, **kwargs):
        serializer = UrgencyClassificationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        paciente = Paciente.objects.filter(usuario=request.user).first()
        if not paciente:
            return Response(
                {'detail': 'No existe una ficha de paciente vinculada al usuario autenticado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        message = serializer.validated_data['message']
        history = serializer.validated_data.get('history') or []

        try:
            result = classify_urgency(message=message, history=history)
            classification = ChatbotUrgencyClassification.objects.create(
                usuario=request.user,
                paciente=paciente,
                mensaje_usuario=message,
                nivel=result.level,
                confianza=result.confidence,
                criterios_detectados=result.matched_criteria,
                orientacion=result.orientation,
                requiere_atencion_humana=result.requires_human_attention,
                estado_derivacion=result.derivation_status,
            )
        except Exception:
            return Response(
                {'detail': 'No se pudo procesar la clasificación de urgencia.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        registrar_bitacora(
            usuario=request.user,
            modulo='ia',
            accion=AccionBitacora.CREAR,
            descripcion=(
                'Clasificación de urgencia generada por chatbot '
                f'(nivel={classification.nivel}, requiere_derivacion={classification.requiere_atencion_humana}).'
            ),
            tabla_afectada='ia_chatbot_urgency_classifications',
            id_registro_afectado=classification.pk,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        response = UrgencyClassificationResponseSerializer(classification)
        return Response(response.data, status=status.HTTP_201_CREATED)


class UrgencyClassificationListView(APIView):
    """
    GET ``/api/ia/urgency-classifications/`` (tenant).

    Lista clasificaciones de urgencia CU24 para auditoría del staff.
    """

    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request, *args, **kwargs):
        classifications = ChatbotUrgencyClassification.objects.select_related('paciente').all()
        serializer = UrgencyClassificationListSerializer(classifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HandoffListView(APIView):
    """
    GET ``/api/ia/human-handoffs/`` (tenant).

    Lista derivaciones a atención humana para el tenant autenticado.
    """

    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request, *args, **kwargs):
        handoffs = CriticalHumanHandoff.objects.select_related('paciente').all()
        serializer = CriticalHumanHandoffListSerializer(handoffs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HandoffDetailView(APIView):
    """
    GET ``/api/ia/human-handoffs/<id>/`` (tenant).

    Detalle completo de una derivación.
    """

    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request, *args, **kwargs):
        try:
            handoff = CriticalHumanHandoff.objects.select_related('paciente').get(
                pk=kwargs['pk'],
            )
        except CriticalHumanHandoff.DoesNotExist:
            return Response(
                {'detail': 'Derivación no encontrada.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CriticalHumanHandoffDetailSerializer(handoff)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HandoffFromClassificationView(APIView):
    """
    POST ``/api/ia/human-handoffs/from-classification/<classification_id>/``
    (tenant).

    Crea una derivación humana desde una clasificación crítica CU24 y notifica
    al personal disponible.
    """

    permission_classes = [IsAuthenticated, IsStaffUser]

    def post(self, request, *args, **kwargs):
        classification_id = kwargs.get('classification_id')

        try:
            classification = ChatbotUrgencyClassification.objects.get(
                pk=classification_id,
            )
        except ChatbotUrgencyClassification.DoesNotExist:
            return Response(
                {'detail': 'Clasificación no encontrada.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            handoff = create_handoff(
                classification=classification,
                usuario=request.user,
                ip_origen=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
            )
        except ValueError as exc:
            return Response(
                {'detail': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        notify_available_staff(
            handoff=handoff,
            usuario=request.user,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        serializer = CriticalHumanHandoffDetailSerializer(handoff)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class HandoffAcceptView(APIView):
    """
    POST ``/api/ia/human-handoffs/<id>/accept/`` (tenant).

    El usuario autenticado acepta formalmente atender la derivación.
    """

    permission_classes = [IsAuthenticated, IsStaffUser]

    def post(self, request, *args, **kwargs):
        try:
            handoff = CriticalHumanHandoff.objects.get(pk=kwargs['pk'])
        except CriticalHumanHandoff.DoesNotExist:
            return Response(
                {'detail': 'Derivación no encontrada.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if handoff.estado in ('RESUELTA', 'CANCELADA', 'FALLIDA'):
            return Response(
                {'detail': f'No se puede aceptar una derivación en estado {handoff.estado}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        handoff.estado = 'ACEPTADA'
        handoff.aceptado_por = request.user
        handoff.aceptado_en = timezone.now()
        handoff.save(update_fields=['estado', 'aceptado_por', 'aceptado_en', 'updated_at'])

        registrar_bitacora(
            usuario=request.user,
            modulo='IA',
            accion=AccionBitacora.CONFIRMAR,
            descripcion=(
                f'Derivación {handoff.id_handoff} aceptada por '
                f'{request.user.get_full_name()} ({request.user.tipo_usuario}).'
            ),
            tabla_afectada=CriticalHumanHandoff._meta.db_table,
            id_registro_afectado=handoff.id_handoff,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        serializer = CriticalHumanHandoffDetailSerializer(handoff)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HandoffResolveView(APIView):
    """
    POST ``/api/ia/human-handoffs/<id>/resolve/`` (tenant).

    Marca la derivación como resuelta.
    """

    permission_classes = [IsAuthenticated, IsStaffUser]

    def post(self, request, *args, **kwargs):
        try:
            handoff = CriticalHumanHandoff.objects.get(pk=kwargs['pk'])
        except CriticalHumanHandoff.DoesNotExist:
            return Response(
                {'detail': 'Derivación no encontrada.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if handoff.estado in ('RESUELTA', 'CANCELADA', 'FALLIDA'):
            return Response(
                {'detail': f'No se puede resolver una derivación en estado {handoff.estado}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        handoff.estado = 'RESUELTA'
        handoff.resuelto_en = timezone.now()
        handoff.save(update_fields=['estado', 'resuelto_en', 'updated_at'])

        registrar_bitacora(
            usuario=request.user,
            modulo='IA',
            accion=AccionBitacora.EDITAR,
            descripcion=(
                f'Derivación {handoff.id_handoff} resuelta por '
                f'{request.user.get_full_name()} ({request.user.tipo_usuario}).'
            ),
            tabla_afectada=CriticalHumanHandoff._meta.db_table,
            id_registro_afectado=handoff.id_handoff,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        serializer = CriticalHumanHandoffDetailSerializer(handoff)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HandoffStartCareView(APIView):
    """
    POST ``/api/ia/human-handoffs/<id>/start-care/`` (tenant).

    Marca la derivación como EN_ATENCION (el staff comenzó a atender al paciente).
    """

    permission_classes = [IsAuthenticated, IsStaffUser]

    def post(self, request, *args, **kwargs):
        try:
            handoff = CriticalHumanHandoff.objects.get(pk=kwargs['pk'])
        except CriticalHumanHandoff.DoesNotExist:
            return Response(
                {'detail': 'Derivación no encontrada.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if handoff.estado != 'ACEPTADA':
            return Response(
                {'detail': f'Solo se puede iniciar atención desde estado ACEPTADA, actual: {handoff.estado}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        handoff.estado = 'EN_ATENCION'
        handoff.save(update_fields=['estado', 'updated_at'])

        registrar_bitacora(
            usuario=request.user,
            modulo='IA',
            accion=AccionBitacora.EDITAR,
            descripcion=(
                f'Derivación {handoff.id_handoff} marcada como EN_ATENCION por '
                f'{request.user.get_full_name()} ({request.user.tipo_usuario}).'
            ),
            tabla_afectada=CriticalHumanHandoff._meta.db_table,
            id_registro_afectado=handoff.id_handoff,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        serializer = CriticalHumanHandoffDetailSerializer(handoff)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HandoffCancelView(APIView):
    """
    POST ``/api/ia/human-handoffs/<id>/cancel/`` (tenant).

    Cancela la derivación. Disponible desde cualquier estado activo.
    """

    permission_classes = [IsAuthenticated, IsStaffUser]

    def post(self, request, *args, **kwargs):
        try:
            handoff = CriticalHumanHandoff.objects.get(pk=kwargs['pk'])
        except CriticalHumanHandoff.DoesNotExist:
            return Response(
                {'detail': 'Derivación no encontrada.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if handoff.estado in ('RESUELTA', 'CANCELADA', 'FALLIDA'):
            return Response(
                {'detail': f'No se puede cancelar una derivación en estado {handoff.estado}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        handoff.estado = 'CANCELADA'
        handoff.save(update_fields=['estado', 'updated_at'])

        registrar_bitacora(
            usuario=request.user,
            modulo='IA',
            accion=AccionBitacora.EDITAR,
            descripcion=(
                f'Derivación {handoff.id_handoff} cancelada por '
                f'{request.user.get_full_name()} ({request.user.tipo_usuario}).'
            ),
            tabla_afectada=CriticalHumanHandoff._meta.db_table,
            id_registro_afectado=handoff.id_handoff,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        serializer = CriticalHumanHandoffDetailSerializer(handoff)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HandoffFailView(APIView):
    """
    POST ``/api/ia/human-handoffs/<id>/fail/`` (tenant).

    Marca la derivación como FALLIDA.
    Disponible desde ACEPTADA o EN_ATENCION.
    """

    permission_classes = [IsAuthenticated, IsStaffUser]

    def post(self, request, *args, **kwargs):
        try:
            handoff = CriticalHumanHandoff.objects.get(pk=kwargs['pk'])
        except CriticalHumanHandoff.DoesNotExist:
            return Response(
                {'detail': 'Derivación no encontrada.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if handoff.estado not in ('ACEPTADA', 'EN_ATENCION'):
            return Response(
                {'detail': f'Solo se puede marcar como fallida desde ACEPTADA o EN_ATENCION, actual: {handoff.estado}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        handoff.estado = 'FALLIDA'
        handoff.save(update_fields=['estado', 'updated_at'])

        registrar_bitacora(
            usuario=request.user,
            modulo='IA',
            accion=AccionBitacora.EDITAR,
            descripcion=(
                f'Derivación {handoff.id_handoff} marcada como FALLIDA por '
                f'{request.user.get_full_name()} ({request.user.tipo_usuario}).'
            ),
            tabla_afectada=CriticalHumanHandoff._meta.db_table,
            id_registro_afectado=handoff.id_handoff,
            ip_origen=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        serializer = CriticalHumanHandoffDetailSerializer(handoff)
        return Response(serializer.data, status=status.HTTP_200_OK)
