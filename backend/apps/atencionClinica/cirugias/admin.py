from django.contrib import admin

from .models import Cirugia


@admin.register(Cirugia)
class CirugiaAdmin(admin.ModelAdmin):
    list_display = (
        'id_cirugia',
        'id_paciente',
        'estado_cirugia',
        'cirujano',
        'fecha_programada',
        'fecha_real_inicio',
        'fecha_real_fin',
    )
    list_filter = ('estado_cirugia', 'fecha_programada')
    search_fields = (
        'id_paciente__nombres',
        'id_paciente__apellidos',
        'procedimiento',
        'resultado',
        'complicaciones',
    )

