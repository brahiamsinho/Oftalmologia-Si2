"""
Serializers REST para plantillas QBE y validación de ejecución on-the-fly.
"""
from rest_framework import serializers

from apps.reportes.models import ReportTemplate


class ReportTemplateSerializer(serializers.ModelSerializer):
    """CRUD de plantillas CU21/CU22; `qbe_payload` solo pasa validación de tipo JSON."""

    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)

    class Meta:
        model = ReportTemplate
        fields = [
            'id',
            'nombre',
            'descripcion',
            'qbe_payload',
            'is_system_report',
            'created_by',
            'created_by_email',
            'created_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_by_email', 'created_at']


class ReportExecutionSerializer(serializers.Serializer):
    """
    Valida el cuerpo JSON al ejecutar un reporte QBE sin plantilla persistida.

    Debe mantenerse alineado con las claves aceptadas en `validate_qbe_payload`
    y con el contrato de `QBEEngine.execute` (`services.qbe_engine`).
    """

    model = serializers.CharField(max_length=120, required=True)
    fields = serializers.ListField(
        child=serializers.CharField(max_length=120),
        required=False,
        allow_null=True,
        default=None,
    )
    filters = serializers.JSONField(required=False, default=dict)
    aggregations = serializers.ListField(
        child=serializers.CharField(max_length=32),
        required=False,
        default=list,
    )
    order_by = serializers.ListField(
        child=serializers.CharField(max_length=120),
        required=False,
        default=list,
    )
