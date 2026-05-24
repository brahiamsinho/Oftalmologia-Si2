from django.contrib import admin

from .models import AfiliacionSeguroPaciente, Aseguradora, Convenio


@admin.register(Aseguradora)
class AseguradoraAdmin(admin.ModelAdmin):
    list_display = ('id_aseguradora', 'codigo', 'nombre', 'activo', 'updated_at')
    list_filter = ('activo',)
    search_fields = ('codigo', 'nombre', 'razon_social')


@admin.register(Convenio)
class ConvenioAdmin(admin.ModelAdmin):
    list_display = (
        'id_convenio',
        'codigo',
        'nombre',
        'id_aseguradora',
        'porcentaje_cobertura',
        'activo',
        'fecha_inicio',
        'fecha_fin',
    )
    list_filter = ('activo', 'id_aseguradora')
    search_fields = ('codigo', 'nombre')


@admin.register(AfiliacionSeguroPaciente)
class AfiliacionSeguroPacienteAdmin(admin.ModelAdmin):
    list_display = (
        'id_afiliacion',
        'id_paciente',
        'id_convenio',
        'numero_afiliado',
        'es_principal',
        'activo',
    )
    list_filter = ('activo', 'es_principal', 'es_titular')
    search_fields = ('numero_afiliado', 'numero_poliza', 'id_paciente__numero_documento')
