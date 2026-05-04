from django.contrib import admin

from .models import Postoperatorio


@admin.register(Postoperatorio)
class PostoperatorioAdmin(admin.ModelAdmin):
    list_display = (
        'id_postoperatorio',
        'id_paciente',
        'id_cirugia',
        'estado_postoperatorio',
        'profesional_atiende',
        'fecha_control',
        'proximo_control',
    )
    list_filter = ('estado_postoperatorio', 'fecha_control', 'proximo_control')
    search_fields = (
        'id_paciente__nombres',
        'id_paciente__apellidos',
        'alertas',
        'observaciones',
    )
