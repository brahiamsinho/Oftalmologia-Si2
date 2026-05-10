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
