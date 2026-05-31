from rest_framework import serializers

from .models import DispositivoFcm, Notificacion, PlataformaFcm


class DispositivoFcmRegisterSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=512, trim_whitespace=True)
    plataforma = serializers.ChoiceField(
        choices=PlataformaFcm.choices,
        default=PlataformaFcm.ANDROID,
    )

    def validate_token(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('El token FCM es obligatorio.')
        return value.strip()


class DispositivoFcmSerializer(serializers.ModelSerializer):
    class Meta:
        model = DispositivoFcm
        fields = ('id', 'plataforma', 'creado_en', 'actualizado_en')
        read_only_fields = fields


class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = ('id', 'titulo', 'cuerpo', 'tipo', 'leida', 'creada_en')
        read_only_fields = ('id', 'titulo', 'cuerpo', 'tipo', 'creada_en')
