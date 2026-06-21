from django.contrib import admin

from .models import DocumentoClinicoAutorizado


@admin.register(DocumentoClinicoAutorizado)
class DocumentoClinicoAutorizadoAdmin(admin.ModelAdmin):
    list_display = ('id_documento_clinico', 'titulo', 'tipo_documento', 'estado', 'fecha_emision', 'creado_por')
    list_filter = ('tipo_documento', 'estado', 'fecha_emision')
    search_fields = ('titulo', 'contenido', 'origen_modulo')
