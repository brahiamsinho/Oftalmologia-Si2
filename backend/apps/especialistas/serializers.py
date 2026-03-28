"""
apps/specialists/serializers.py
"""
from rest_framework import serializers
from .models import Especialista


class EspecialistaSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    class Meta:
        model = Especialista
        fields = [
            'id_especialista',
            'usuario',
            'username',
            'nombre_completo',
            'email',
            'codigo_profesional',
            'especialidad',
            'activo',
        ]
        read_only_fields = ['id_especialista']

    def get_nombre_completo(self, obj):
        return obj.usuario.get_full_name()

    def get_username(self, obj):
        return obj.usuario.username

    def get_email(self, obj):
        return obj.usuario.email
