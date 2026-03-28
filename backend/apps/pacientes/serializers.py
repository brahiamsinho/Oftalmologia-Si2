"""
apps/patients/serializers.py
"""
from rest_framework import serializers
from .models import Paciente


class PacienteSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()
    usuario_username = serializers.SerializerMethodField()

    class Meta:
        model = Paciente
        fields = [
            'id_paciente', 'usuario', 'usuario_username',
            'numero_historia', 'tipo_documento', 'numero_documento',
            'nombres', 'apellidos', 'nombre_completo',
            'fecha_nacimiento', 'sexo', 'telefono', 'email', 'direccion',
            'contacto_emergencia_nombre', 'contacto_emergencia_telefono',
            'estado_paciente', 'fecha_registro', 'observaciones_generales',
        ]
        read_only_fields = ['id_paciente', 'numero_historia', 'fecha_registro']

    def get_nombre_completo(self, obj):
        return obj.get_full_name()

    def get_usuario_username(self, obj):
        return obj.usuario.username if obj.usuario else None


class PacienteCreateSerializer(serializers.ModelSerializer):
    """Para creación por el administrativo (numero_historia se genera automáticamente)."""

    class Meta:
        model = Paciente
        fields = [
            'usuario', 'tipo_documento', 'numero_documento',
            'nombres', 'apellidos', 'fecha_nacimiento', 'sexo',
            'telefono', 'email', 'direccion',
            'contacto_emergencia_nombre', 'contacto_emergencia_telefono',
            'estado_paciente', 'observaciones_generales',
        ]

    def create(self, validated_data):
        from .utils import generar_numero_historia
        validated_data['numero_historia'] = generar_numero_historia()
        return super().create(validated_data)
