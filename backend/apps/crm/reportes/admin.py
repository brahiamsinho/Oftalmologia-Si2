from django.contrib import admin

from .models import ReporteGenerado


@admin.register(ReporteGenerado)
class ReporteGeneradoAdmin(admin.ModelAdmin):
    list_display = (
        'id_reporte', 'tipo_reporte', 'formato',
        'fecha_desde', 'fecha_hasta',
        'estado', 'total_registros',
        'generado_por', 'created_at',
    )
    list_filter = ('tipo_reporte', 'formato', 'estado', 'created_at')
    search_fields = ('generado_por__nombres', 'generado_por__apellidos', 'tipo_reporte')
    readonly_fields = (
        'id_reporte', 'tipo_reporte', 'formato',
        'fecha_desde', 'fecha_hasta', 'filtros_extra',
        'estado', 'total_registros', 'mensaje_error',
        'generado_por', 'created_at',
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
