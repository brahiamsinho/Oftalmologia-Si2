from rest_framework import serializers

from apps.InteligenciaArtificial.models import InteraccionAsistenteVirtual


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
            'fecha_creacion',
        ]
        read_only_fields = fields
