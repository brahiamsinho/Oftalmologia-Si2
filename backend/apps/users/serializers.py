"""
apps/users/serializers.py
Serializers exclusivos del dominio de usuarios y autenticación.

Roles/Permisos → apps/roles/serializers.py y apps/permisos/serializers.py
"""
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import TokenRecuperacion, Usuario


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, validators=[validate_password],
        style={'input_type': 'password'},
    )
    password2 = serializers.CharField(
        write_only=True, label='Confirmar contraseña',
        style={'input_type': 'password'},
    )
    # Campos adicionales para perfil (paciente/especialista)
    tipo_documento = serializers.CharField(required=False, write_only=True, default='DNI')
    numero_documento = serializers.CharField(required=False, write_only=True, default='')
    especialidad = serializers.CharField(required=False, write_only=True, default='')
    codigo_profesional = serializers.CharField(required=False, write_only=True, default='')

    class Meta:
        model = Usuario
        fields = [
            'username', 'email', 'password', 'password2',
            'nombres', 'apellidos', 'telefono', 'tipo_usuario',
            'tipo_documento', 'numero_documento',
            'especialidad', 'codigo_profesional',
        ]

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Las contraseñas no coinciden.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        extra = {k: validated_data.pop(k, '') for k in [
            'tipo_documento', 'numero_documento', 'especialidad', 'codigo_profesional',
        ]}
        password = validated_data.pop('password')
        usuario = Usuario.objects.create_user(password=password, **validated_data)
        usuario._extra_registro = extra
        return usuario


class LoginSerializer(serializers.Serializer):
    """
    Login solo con correo electrónico (campo `email`).
    Verifica contraseña con check_password (evita fallos raros de authenticate()).
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        email_val = (data.get('email') or '').strip()
        password = data.get('password', '')

        usuario = Usuario.objects.filter(email__iexact=email_val).first()
        if not usuario:
            raise serializers.ValidationError({'email': 'Credenciales incorrectas.'})
        if not usuario.check_password(password):
            raise serializers.ValidationError({'email': 'Credenciales incorrectas.'})
        if not usuario.is_active:
            raise serializers.ValidationError({'email': 'Cuenta desactivada.'})
        if usuario.estado == 'BLOQUEADO':
            raise serializers.ValidationError(
                {'email': 'Cuenta bloqueada. Contacta al administrador.'}
            )
        if usuario.estado == 'INACTIVO':
            raise serializers.ValidationError({'email': 'Cuenta inactiva.'})

        data['user'] = usuario
        return data


class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(write_only=True)
    password_nuevo = serializers.CharField(write_only=True, validators=[validate_password])
    password_nuevo2 = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password_nuevo'] != data['password_nuevo2']:
            raise serializers.ValidationError({'password_nuevo2': 'Las contraseñas no coinciden.'})
        return data


class RecuperarPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ConfirmarPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    password_nuevo = serializers.CharField(write_only=True, validators=[validate_password])
    password_nuevo2 = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password_nuevo'] != data['password_nuevo2']:
            raise serializers.ValidationError({'password_nuevo2': 'Las contraseñas no coinciden.'})
        return data


# ---------------------------------------------------------------------------
# Usuario
# ---------------------------------------------------------------------------

class UsuarioSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'nombres', 'apellidos', 'nombre_completo',
            'telefono', 'foto_perfil', 'tipo_usuario', 'estado',
            'ultimo_acceso', 'fecha_creacion', 'fecha_actualizacion',
            'is_staff', 'is_active',
        ]
        read_only_fields = ['id', 'ultimo_acceso', 'fecha_creacion', 'fecha_actualizacion']

    def get_nombre_completo(self, obj):
        return obj.get_full_name()


class UsuarioCreateSerializer(serializers.ModelSerializer):
    """Para creación de usuarios por el administrador."""
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = Usuario
        fields = [
            'username', 'email', 'password', 'nombres', 'apellidos',
            'telefono', 'tipo_usuario', 'estado', 'is_staff',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        return Usuario.objects.create_user(password=password, **validated_data)


class PerfilSerializer(serializers.ModelSerializer):
    """Vista/edición del perfil propio — campos sensibles en solo lectura."""
    nombre_completo = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'nombres', 'apellidos', 'nombre_completo',
            'telefono', 'foto_perfil', 'tipo_usuario', 'estado', 'ultimo_acceso',
        ]
        read_only_fields = ['id', 'username', 'email', 'tipo_usuario', 'estado', 'ultimo_acceso']

    def get_nombre_completo(self, obj):
        return obj.get_full_name()
