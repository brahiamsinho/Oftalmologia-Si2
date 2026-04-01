from django.contrib import admin
from .models import Permiso


@admin.register(Permiso)
class PermisoAdmin(admin.ModelAdmin):
    list_display = ['id_permiso', 'codigo', 'nombre', 'modulo', 'descripcion']
    list_filter = ['modulo']
    search_fields = ['codigo', 'nombre', 'modulo']
    ordering = ['modulo', 'codigo']
