"""
apps/crm/reportes/serializers.py
CU17 — Generar y exportar reportes
"""
import datetime

from rest_framework import serializers

from .models import ReporteGenerado, TipoReporte


class ReporteGeneradoSerializer(serializers.ModelSerializer):
    tipo_reporte_display  = serializers.CharField(source='get_tipo_reporte_display',  read_only=True)
    formato_display       = serializers.CharField(source='get_formato_display',        read_only=True)
    estado_display        = serializers.CharField(source='get_estado_display',         read_only=True)
    generado_por_nombre   = serializers.SerializerMethodField()

    class Meta:
        model = ReporteGenerado
        fields = [
            'id_reporte',
            'tipo_reporte',       'tipo_reporte_display',
            'formato',            'formato_display',
            'fecha_desde',        'fecha_hasta',
            'filtros_extra',
            'estado',             'estado_display',
            'total_registros',    'mensaje_error',
            'generado_por',       'generado_por_nombre',
            'created_at',
        ]
        read_only_fields = fields

    def get_generado_por_nombre(self, obj):
        if obj.generado_por:
            return f'{obj.generado_por.nombres} {obj.generado_por.apellidos}'.strip()
        return None


class GenerarReporteRequestSerializer(serializers.Serializer):
    """
    Valida el cuerpo de la request POST /reportes/generar/.
    """
    tipo_reporte = serializers.ChoiceField(choices=TipoReporte.choices)
    formato = serializers.ChoiceField(
        choices=[('JSON', 'JSON'), ('CSV', 'CSV')],
        default='JSON',
        required=False,
    )
    fecha_desde = serializers.DateField(required=False, allow_null=True)
    fecha_hasta = serializers.DateField(required=False, allow_null=True)

    # Filtros opcionales adicionales
    id_paciente    = serializers.IntegerField(required=False, allow_null=True)
    id_especialista = serializers.IntegerField(required=False, allow_null=True)
    id_campana     = serializers.IntegerField(required=False, allow_null=True)
    canal          = serializers.CharField(required=False, allow_blank=True)
    tipo_mensaje   = serializers.CharField(required=False, allow_blank=True)
    estado         = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        fecha_desde = attrs.get('fecha_desde')
        fecha_hasta = attrs.get('fecha_hasta')
        if fecha_desde and fecha_hasta and fecha_hasta < fecha_desde:
            raise serializers.ValidationError({
                'fecha_hasta': 'La fecha hasta no puede ser anterior a la fecha desde.'
            })
        return attrs
