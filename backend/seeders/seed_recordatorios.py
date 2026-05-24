"""
Seeder CU17 — reglas de recordatorio por defecto en el schema del tenant actual.
"""
from apps.notificaciones.automatizaciones.models import ReglaRecordatorio, TipoReglaRecordatorio
from apps.notificaciones.automatizaciones.services.scheduling import (
    NOMBRE_REGLA_CITA_DEFAULT,
    NOMBRE_REGLA_POSTOP_DEFAULT,
)

REGLAS_DEFAULT = (
    {
        'nombre': NOMBRE_REGLA_POSTOP_DEFAULT,
        'tipo_regla': TipoReglaRecordatorio.CONTROL_POSTOPERATORIO,
        'horas_antes': 24,
        'titulo_template': 'Control postoperatorio — {paciente}',
        'cuerpo_template': (
            'Hola {paciente}, te recordamos tu control postoperatorio el {fecha_control}. '
            'Por favor confirma tu asistencia.'
        ),
        'activa': True,
    },
    {
        'nombre': NOMBRE_REGLA_CITA_DEFAULT,
        'tipo_regla': TipoReglaRecordatorio.RECORDATORIO_CITA,
        'horas_antes': 24,
        'titulo_template': 'Recordatorio de cita — {paciente}',
        'cuerpo_template': (
            'Hola {paciente}, tenés una cita programada para el {fecha_cita}. '
            'Te esperamos en la clínica.'
        ),
        'activa': True,
    },
)


def run():
    creados = 0
    actualizados = 0

    for row in REGLAS_DEFAULT:
        _, created = ReglaRecordatorio.objects.update_or_create(
            nombre=row['nombre'],
            defaults={
                'tipo_regla': row['tipo_regla'],
                'horas_antes': row['horas_antes'],
                'titulo_template': row['titulo_template'],
                'cuerpo_template': row['cuerpo_template'],
                'activa': row['activa'],
            },
        )
        if created:
            creados += 1
        else:
            actualizados += 1

    return creados, actualizados
