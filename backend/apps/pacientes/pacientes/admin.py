from django.contrib import admin
from .models import Paciente


@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = [
        'id_paciente', 'numero_historia', 'nombres', 'apellidos',
        'tipo_documento', 'numero_documento', 'estado_paciente', 'fecha_registro',
    ]
    list_filter = ['estado_paciente', 'sexo', 'tipo_documento']
    search_fields = ['nombres', 'apellidos', 'numero_historia', 'numero_documento', 'email']
    readonly_fields = ['numero_historia', 'fecha_registro']
    ordering = ['apellidos', 'nombres']
