from django.contrib import admin
from .models import Especialista


@admin.register(Especialista)
class EspecialistaAdmin(admin.ModelAdmin):
    list_display = [
        'id_especialista', 'usuario', 'especialidad',
        'codigo_profesional', 'activo',
    ]
    list_filter = ['especialidad', 'activo']
    search_fields = [
        'especialidad', 'codigo_profesional',
        'usuario__nombres', 'usuario__apellidos', 'usuario__email',
    ]
    ordering = ['usuario__apellidos', 'usuario__nombres']
