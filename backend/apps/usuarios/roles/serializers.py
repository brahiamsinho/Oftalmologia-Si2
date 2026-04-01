"""
apps/roles/serializers.py
"""
from rest_framework import serializers

from apps.usuarios.permisos.serializers import PermisoSerializer

from .models import Rol, RolPermiso, UsuarioRol


class RolPermisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolPermiso
        fields = ['id_rol', 'id_permiso', 'fecha_asignacion']


class RolSerializer(serializers.ModelSerializer):
    """Incluye los permisos asignados al rol."""
    permisos = serializers.SerializerMethodField()

    class Meta:
        model = Rol
        fields = ['id_rol', 'nombre', 'descripcion', 'activo', 'permisos']
        read_only_fields = ['id_rol']

    def get_permisos(self, obj):
        from apps.usuarios.permisos.models import Permiso
        permisos = Permiso.objects.filter(rol_permisos__id_rol=obj)
        return PermisoSerializer(permisos, many=True).data


class UsuarioRolSerializer(serializers.ModelSerializer):
    rol_nombre = serializers.CharField(source='id_rol.nombre', read_only=True)

    class Meta:
        model = UsuarioRol
        fields = ['id_usuario', 'id_rol', 'rol_nombre', 'fecha_asignacion']
        read_only_fields = ['fecha_asignacion', 'rol_nombre']
