from django.contrib import admin
from .models import Bitacora, AccionBitacora


@admin.register(Bitacora)
class BitacoraAdmin(admin.ModelAdmin):
    list_display = [
        'id_bitacora', 'fecha_evento', 'accion', 'modulo',
        'id_usuario', 'tabla_afectada', 'ip_origen',
    ]
    list_filter = ['accion', 'modulo', 'fecha_evento']
    search_fields = ['descripcion', 'modulo', 'ip_origen']
    readonly_fields = [f.name for f in Bitacora._meta.fields]
    ordering = ['-fecha_evento']
    date_hierarchy = 'fecha_evento'

    def has_add_permission(self, request):
        return False  # No se crean eventos manualmente

    def has_change_permission(self, request, obj=None):
        return False  # No se editan

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser  # Solo superuser puede borrar
