from django.contrib import admin
from .models import AntecedenteClinico

@admin.register(AntecedenteClinico)
class AntecedenteClinicoAdmin(admin.ModelAdmin):
    list_display = ['id_antecedente', 'id_historia_clinica', 'tipo_antecedente', 'fecha_registro']
    list_filter = ['tipo_antecedente']
