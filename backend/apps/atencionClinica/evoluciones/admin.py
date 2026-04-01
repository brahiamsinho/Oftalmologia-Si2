from django.contrib import admin
from .models import EvolucionClinica

@admin.register(EvolucionClinica)
class EvolucionClinicaAdmin(admin.ModelAdmin):
    list_display = ['id_evolucion', 'id_historia_clinica', 'fecha_evolucion', 'id_especialista']
