from django.contrib import admin

from .models import CampanaCRM, HistorialContacto, SegmentacionPaciente


@admin.register(SegmentacionPaciente)
class SegmentacionPacienteAdmin(admin.ModelAdmin):
    list_display = ('id_segmentacion', 'nombre', 'activo', 'created_at')
    list_filter = ('activo',)
    search_fields = ('nombre', 'descripcion', 'criterios')


@admin.register(CampanaCRM)
class CampanaCRMAdmin(admin.ModelAdmin):
    list_display = ('id_campana', 'nombre', 'id_segmentacion', 'estado', 'fecha_inicio', 'fecha_fin')
    list_filter = ('estado', 'fecha_inicio', 'fecha_fin')
    search_fields = ('nombre', 'descripcion')


@admin.register(HistorialContacto)
class HistorialContactoAdmin(admin.ModelAdmin):
    list_display = ('id_historial_contacto', 'id_paciente', 'id_campana', 'canal', 'fecha_contacto')
    list_filter = ('canal', 'fecha_contacto')
    search_fields = ('id_paciente__nombres', 'id_paciente__apellidos', 'resultado', 'observaciones')
