from django.contrib import admin

from .models import LogEjecucionRecordatorio, ReglaRecordatorio, TareaRecordatorioProgramada


@admin.register(ReglaRecordatorio)
class ReglaRecordatorioAdmin(admin.ModelAdmin):
    list_display = ('id_regla', 'nombre', 'tipo_regla', 'horas_antes', 'activa', 'created_at')
    list_filter = ('tipo_regla', 'activa')
    search_fields = ('nombre',)


@admin.register(TareaRecordatorioProgramada)
class TareaRecordatorioProgramadaAdmin(admin.ModelAdmin):
    list_display = ('id_tarea', 'id_regla', 'id_paciente', 'programada_para', 'estado', 'intentos')
    list_filter = ('estado',)
    search_fields = ('id_paciente__nombres', 'id_paciente__apellidos')


@admin.register(LogEjecucionRecordatorio)
class LogEjecucionRecordatorioAdmin(admin.ModelAdmin):
    list_display = ('id_log', 'id_tarea', 'nivel', 'mensaje', 'ejecutado_en')
    list_filter = ('nivel',)
    search_fields = ('mensaje', 'detalle')
