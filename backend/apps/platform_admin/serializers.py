from rest_framework import serializers

from .models import PlatformAdministrator


class PlatformLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'}, trim_whitespace=False)

    def validate(self, attrs):
        email = (attrs.get('email') or '').strip().lower()
        raw = attrs.get('password')

        try:
            admin = PlatformAdministrator.objects.get(email=email)
        except PlatformAdministrator.DoesNotExist:
            raise serializers.ValidationError(
                {'detail': 'Credenciales inválidas.'},
            ) from None

        if not admin.is_active or not admin.check_password(raw):
            raise serializers.ValidationError(
                {'detail': 'Credenciales inválidas.'},
            )

        attrs['administrator'] = admin
        return attrs


class PlatformAdministratorSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformAdministrator
        fields = ('id', 'email', 'nombre', 'is_active', 'created_at')
        read_only_fields = fields
