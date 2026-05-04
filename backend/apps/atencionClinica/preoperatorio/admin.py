from django.contrib import admin

from .models import Preoperatorio


@admin.register(Preoperatorio)
class PreoperatorioAdmin(admin.ModelAdmin):
    list_display = (
        'id_preoperatorio',
        'id_paciente',
        'estado_preoperatorio',
        'checklist_completado',
        'apto_anestesia',
        'validado_por',
        'fecha_validacion',
        'created_at',
    )
    list_filter = ('estado_preoperatorio', 'checklist_completado', 'apto_anestesia')
    search_fields = (
        'id_paciente__nombres',
        'id_paciente__apellidos',
        'checklist_detalle',
        'examenes_requeridos',
        'observaciones',
    )

