from django.contrib import admin
from .models import Rol, RolPermiso, UsuarioRol


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ['id_rol', 'nombre', 'activo', 'descripcion']
    list_filter = ['activo']
    search_fields = ['nombre', 'descripcion']
    ordering = ['nombre']


@admin.register(UsuarioRol)
class UsuarioRolAdmin(admin.ModelAdmin):
    list_display = ['id_usuario', 'id_rol', 'fecha_asignacion']
    list_filter = ['id_rol']
    search_fields = ['id_usuario__username', 'id_usuario__email', 'id_rol__nombre']
    ordering = ['-fecha_asignacion']


@admin.register(RolPermiso)
class RolPermisoAdmin(admin.ModelAdmin):
    list_display = ['id_rol', 'id_permiso', 'fecha_asignacion']
    list_filter = ['id_rol']
    ordering = ['id_rol', 'id_permiso']
