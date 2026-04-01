from django.contrib import admin
from .models import HistoriaClinica

@admin.register(HistoriaClinica)
class HistoriaClinicaAdmin(admin.ModelAdmin):
    list_display = ['id_historia_clinica', 'id_paciente', 'fecha_apertura', 'estado']
    list_filter = ['estado']
    search_fields = ['id_paciente__nombres', 'id_paciente__apellidos', 'id_paciente__numero_historia']
    readonly_fields = ['fecha_apertura']
