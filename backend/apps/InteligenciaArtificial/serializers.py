from rest_framework import serializers

from apps.InteligenciaArtificial.models import ClasificacionUrgencia, InteraccionAsistenteVirtual


class ClasificacionUrgenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClasificacionUrgencia
        fields = [
            'id_clasificacion',
            'id_interaccion',
            'id_usuario',
            'nivel_urgencia',
            'puntaje_riesgo',
            'factores_clinicos',
            'criterios_evaluados',
            'recomendacion',
            'requiere_derivacion',
            'estado',
            'revisado_por',
            'fecha_revision',
            'notas_internas',
            'fecha_creacion',
        ]
        read_only_fields = fields


class ClasificacionUrgenciaUpdateSerializer(serializers.Serializer):
    derivado = serializers.BooleanField(required=False)
    notas_internas = serializers.CharField(required=False, allow_blank=True, trim_whitespace=True)


class AsistenteVirtualRequestSerializer(serializers.Serializer):
    mensaje = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        min_length=2,
        max_length=2000,
        help_text='Consulta del paciente en lenguaje natural.',
    )
    id_conversacion = serializers.UUIDField(required=False)


class InteraccionAsistenteVirtualSerializer(serializers.ModelSerializer):
    clasificacion_urgencia = ClasificacionUrgenciaSerializer(read_only=True)

    class Meta:
        model = InteraccionAsistenteVirtual
        fields = [
            'id_interaccion',
            'id_conversacion',
            'id_usuario',
            'mensaje',
            'respuesta',
            'intencion',
            'estado',
            'requiere_clasificacion_urgencia',
            'nivel_prioridad',
            'sintomas_detectados',
            'metadata',
            'clasificacion_urgencia',
            'fecha_creacion',
        ]
        read_only_fields = fields
