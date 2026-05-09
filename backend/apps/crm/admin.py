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
    list_display = (
        'id_historial_contacto',
        'id_paciente',
        'canal',
        'tipo_mensaje',
        'estado_comunicacion',
        'fecha_contacto',
        'id_campana',
        'contactado_por',
    )
    list_filter = ('canal', 'tipo_mensaje', 'estado_comunicacion', 'fecha_contacto')
    search_fields = (
        'id_paciente__nombres',
        'id_paciente__apellidos',
        'asunto',
        'mensaje',
        'respuesta_paciente',
        'resultado',
        'observaciones',
    )
    readonly_fields = ('contactado_por', 'created_at', 'updated_at')
    fieldsets = (
        ('Identificación', {
            'fields': ('id_historial_contacto', 'id_paciente', 'id_campana'),
        }),
        ('Comunicación', {
            'fields': ('canal', 'tipo_mensaje', 'estado_comunicacion', 'fecha_contacto', 'asunto'),
        }),
        ('Contenido', {
            'fields': ('mensaje', 'respuesta_paciente', 'resultado', 'observaciones'),
        }),
        ('Auditoría', {
            'fields': ('contactado_por', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
