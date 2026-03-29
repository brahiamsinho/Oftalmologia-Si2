from django.contrib import admin
from .models import DiagnosticoClinico

@admin.register(DiagnosticoClinico)
class DiagnosticoClinicoAdmin(admin.ModelAdmin):
    list_display = ['id_diagnostico', 'id_historia_clinica', 'fecha_diagnostico', 'cie10', 'id_especialista']
    list_filter = ['fecha_diagnostico']
    search_fields = ['descripcion', 'cie10']
