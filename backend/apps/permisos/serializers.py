"""
apps/permisos/serializers.py
"""
from rest_framework import serializers
from .models import Permiso


class PermisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permiso
        fields = ['id_permiso', 'codigo', 'nombre', 'modulo', 'descripcion']
        read_only_fields = ['id_permiso']
