from django.contrib import admin
from .models import DocumentoClinicoAutorizado, HistoriaClinica

@admin.register(HistoriaClinica)
class HistoriaClinicaAdmin(admin.ModelAdmin):
    list_display = ['id_historia_clinica', 'id_paciente', 'fecha_apertura', 'estado']
    list_filter = ['estado']
    search_fields = ['id_paciente__nombres', 'id_paciente__apellidos', 'id_paciente__numero_historia']
    readonly_fields = ['fecha_apertura']


@admin.register(DocumentoClinicoAutorizado)
class DocumentoClinicoAutorizadoAdmin(admin.ModelAdmin):
    list_display = [
        'id_documento_clinico',
        'tipo_documento',
        'estado',
        'titulo',
        'id_paciente',
        'id_historia_clinica',
        'autorizado_por',
        'autorizado_en',
    ]
    list_filter = ['tipo_documento', 'estado', 'autorizado_en']
    search_fields = ['titulo', 'contenido', 'id_paciente__nombres', 'id_paciente__apellidos']
    readonly_fields = ['fecha_emision', 'autorizado_en', 'created_at', 'updated_at']
