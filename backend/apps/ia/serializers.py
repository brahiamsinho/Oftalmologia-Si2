from rest_framework import serializers


class NlpToReportRequestSerializer(serializers.Serializer):
    """POST /ia/nlp-to-report/ — consulta en lenguaje natural."""

    query = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        max_length=4000,
        help_text='Descripción en texto libre de qué datos se quieren ver (reporte QBE).',
    )


class ChatHistoryItemSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=['user', 'assistant'])
    content = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        max_length=4000,
    )


class ChatbotMessageRequestSerializer(serializers.Serializer):
    """POST /ia/chatbot/ — mensaje del usuario + historial corto opcional."""

    message = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        max_length=4000,
        help_text='Mensaje actual del usuario para el asistente virtual.',
    )
    history = ChatHistoryItemSerializer(many=True, required=False, default=list)

    def validate_history(self, value):
        if len(value) > 20:
            raise serializers.ValidationError(
                'El historial es demasiado largo (máximo 20 mensajes).',
            )
        return value
