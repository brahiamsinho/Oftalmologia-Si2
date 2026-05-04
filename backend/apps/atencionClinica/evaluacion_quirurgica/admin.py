from django.contrib import admin

from .models import EvaluacionQuirurgica


@admin.register(EvaluacionQuirurgica)
class EvaluacionQuirurgicaAdmin(admin.ModelAdmin):
    list_display = (
        'id_evaluacion_quirurgica',
        'id_paciente',
        'id_historia_clinica',
        'estado_prequirurgico',
        'evaluado_por',
        'fecha_evaluacion',
    )
    list_filter = ('estado_prequirurgico', 'fecha_evaluacion')
    search_fields = (
        'id_paciente__nombres',
        'id_paciente__apellidos',
        'hallazgos',
        'plan_quirurgico',
    )

