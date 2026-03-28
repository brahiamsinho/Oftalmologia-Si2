"""
apps/bitacora/serializers.py
"""
from rest_framework import serializers
from .models import Bitacora


class BitacoraSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.SerializerMethodField()
    usuario_username = serializers.SerializerMethodField()

    class Meta:
        model = Bitacora
        fields = [
            'id_bitacora',
            'id_usuario',
            'usuario_nombre',
            'usuario_username',
            'modulo',
            'tabla_afectada',
            'id_registro_afectado',
            'accion',
            'descripcion',
            'ip_origen',
            'user_agent',
            'fecha_evento',
        ]
        read_only_fields = fields  # Sólo lectura — se registra automáticamente

    def get_usuario_nombre(self, obj):
        return obj.id_usuario.get_full_name() if obj.id_usuario else 'Sistema'

    def get_usuario_username(self, obj):
        return obj.id_usuario.username if obj.id_usuario else None
