from django.contrib import admin
from .models import TratamientoClinico

@admin.register(TratamientoClinico)
class TratamientoClinicoAdmin(admin.ModelAdmin):
    list_display = ['id_tratamiento', 'id_historia_clinica', 'estado', 'fecha_inicio', 'fecha_fin']
    list_filter = ['estado']
