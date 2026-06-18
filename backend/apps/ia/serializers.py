from rest_framework import serializers

from apps.ia.models import ChatbotUrgencyClassification, CriticalHumanHandoff


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


class UrgencyClassificationRequestSerializer(serializers.Serializer):
    """POST /ia/urgency-classification/ — CU24.

    El cliente solo envía texto e historial opcional. No se acepta paciente_id,
    nivel, usuario ni datos de auditoría para evitar spoofing.
    """

    message = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        max_length=2000,
        help_text='Síntomas/molestias/condición de salud expresados por el paciente.',
    )
    history = ChatHistoryItemSerializer(many=True, required=False, default=list)

    def validate_history(self, value):
        if len(value) > 10:
            raise serializers.ValidationError(
                'El historial para clasificación es demasiado largo (máximo 10 mensajes).',
            )
        return value

    def validate(self, attrs):
        forbidden_fields = {
            'paciente_id',
            'id_paciente',
            'patient_id',
            'usuario',
            'usuario_id',
            'user_id',
            'nivel',
            'level',
            'confidence',
            'confianza',
            'requires_human_attention',
            'requiere_atencion_humana',
            'derivation_status',
            'estado_derivacion',
        }
        received_forbidden = sorted(forbidden_fields.intersection(set(self.initial_data.keys())))
        if received_forbidden:
            raise serializers.ValidationError(
                {
                    'detail': (
                        'Campos no permitidos en la solicitud: '
                        f'{", ".join(received_forbidden)}.'
                    ),
                },
            )
        return attrs


class UrgencyClassificationResponseSerializer(serializers.ModelSerializer):
    classification_id = serializers.IntegerField(source='id_clasificacion')
    level = serializers.CharField(source='nivel')
    confidence = serializers.FloatField(source='confianza')
    requires_human_attention = serializers.BooleanField(source='requiere_atencion_humana')
    orientation = serializers.CharField(source='orientacion')
    matched_criteria = serializers.JSONField(source='criterios_detectados')
    derivation_status = serializers.CharField(source='estado_derivacion')
    handoff_status = serializers.CharField(source='estado_derivacion')

    class Meta:
        model = ChatbotUrgencyClassification
        fields = [
            'classification_id',
            'level',
            'confidence',
            'requires_human_attention',
            'orientation',
            'matched_criteria',
            'derivation_status',
            'handoff_status',
            'created_at',
        ]


class UrgencyClassificationListSerializer(serializers.ModelSerializer):
    classification_id = serializers.IntegerField(source='id_clasificacion', read_only=True)
    paciente_nombre = serializers.SerializerMethodField()

    class Meta:
        model = ChatbotUrgencyClassification
        fields = [
            'classification_id',
            'paciente',
            'paciente_nombre',
            'nivel',
            'confianza',
            'requiere_atencion_humana',
            'created_at',
        ]

    def get_paciente_nombre(self, obj):
        return str(obj.paciente)


class CriticalHumanHandoffListSerializer(serializers.ModelSerializer):
    handoff_id = serializers.IntegerField(source='id_handoff', read_only=True)
    paciente_nombre = serializers.SerializerMethodField()

    class Meta:
        model = CriticalHumanHandoff
        fields = [
            'handoff_id',
            'paciente',
            'paciente_nombre',
            'nivel_urgencia',
            'estado',
            'asignado_a',
            'created_at',
        ]

    def get_paciente_nombre(self, obj):
        return str(obj.paciente)


class CriticalHumanHandoffDetailSerializer(serializers.ModelSerializer):
    handoff_id = serializers.IntegerField(source='id_handoff', read_only=True)
    classification_id = serializers.IntegerField(read_only=True)
    paciente_nombre = serializers.SerializerMethodField()

    class Meta:
        model = CriticalHumanHandoff
        fields = [
            'handoff_id',
            'classification_id',
            'paciente',
            'paciente_nombre',
            'mensaje_original',
            'nivel_urgencia',
            'criterios_detectados',
            'estado',
            'asignado_a',
            'aceptado_por',
            'notificado_en',
            'aceptado_en',
            'resuelto_en',
            'created_at',
            'updated_at',
        ]

    def get_paciente_nombre(self, obj):
        return str(obj.paciente)
