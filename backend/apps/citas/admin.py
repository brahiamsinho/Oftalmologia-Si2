from django.contrib import admin
from .models import Cita, DisponibilidadEspecialista, TipoCita


@admin.register(TipoCita)
class TipoCitaAdmin(admin.ModelAdmin):
    list_display = ['id_tipo_cita', 'nombre', 'descripcion']


@admin.register(DisponibilidadEspecialista)
class DisponibilidadEspecialistaAdmin(admin.ModelAdmin):
    list_display = [
        'id_disponibilidad', 'id_especialista', 'dia_semana',
        'hora_inicio', 'hora_fin', 'intervalo_minutos', 'activo',
    ]
    list_filter = ['dia_semana', 'activo', 'id_especialista']


@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display = [
        'id_cita', 'id_paciente', 'id_especialista', 'id_tipo_cita',
        'fecha_hora_inicio', 'fecha_hora_fin', 'estado',
    ]
    list_filter = ['estado', 'id_tipo_cita']
    search_fields = [
        'id_paciente__nombres', 'id_paciente__apellidos',
        'id_especialista__usuario__nombres',
    ]
    date_hierarchy = 'fecha_hora_inicio'
    ordering = ['-fecha_hora_inicio']
