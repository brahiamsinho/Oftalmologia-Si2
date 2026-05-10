# Data migration — plantillas CU22 (reportes predefinidos).
# Con django-tenants esta migración se aplica en cada schema de tenant;
# `ReportTemplate` no tiene FK a Tenant (el aislamiento es el schema).

from datetime import timedelta

from django.db import migrations
from django.utils import timezone


def _payload_pacientes_recientes(cutoff):
    """Ventana de 'recientes' fijada en el momento de aplicar la migración por tenant."""
    return {
        'model': 'Paciente',
        'filters': {'fecha_registro__gte': cutoff.isoformat()},
        'fields': [
            'nombres',
            'apellidos',
            'tipo_documento',
            'numero_documento',
            'fecha_registro',
        ],
        'order_by': ['-fecha_registro'],
    }


def _payload_ausentismo_citas():
    # Estado real del dominio: paciente no asistió (no existe valor AUSENTE).
    return {
        'model': 'Cita',
        'filters': {'estado': 'NO_ASISTIO'},
        'fields': [
            'id_cita',
            'fecha_hora_inicio',
            'fecha_hora_fin',
            'estado',
            'motivo',
        ],
        'order_by': ['-fecha_hora_inicio'],
    }


def seed_reportes_predefinidos(apps, schema_editor):
    ReportTemplate = apps.get_model('reportes', 'ReportTemplate')
    cutoff = timezone.now() - timedelta(days=30)

    templates = (
        {
            'nombre': 'Pacientes Nuevos Recientes',
            'descripcion': (
                'Pacientes con fecha de registro en los últimos 30 días '
                '(referencia tomada al aplicar esta migración en el schema actual).'
            ),
            'qbe_payload': _payload_pacientes_recientes(cutoff),
        },
        {
            'nombre': 'Ausentismo de Citas',
            'descripcion': (
                'Citas marcadas como “No Asistió” (estado NO_ASISTIO). '
                'Incluye identificador, horario y motivo registrado.'
            ),
            'qbe_payload': _payload_ausentismo_citas(),
        },
    )

    for row in templates:
        ReportTemplate.objects.update_or_create(
            nombre=row['nombre'],
            defaults={
                'descripcion': row['descripcion'],
                'qbe_payload': row['qbe_payload'],
                'is_system_report': True,
                'created_by_id': None,
            },
        )


def unseed_reportes_predefinidos(apps, schema_editor):
    ReportTemplate = apps.get_model('reportes', 'ReportTemplate')
    ReportTemplate.objects.filter(
        nombre__in=['Pacientes Nuevos Recientes', 'Ausentismo de Citas'],
        is_system_report=True,
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('reportes', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_reportes_predefinidos, unseed_reportes_predefinidos),
    ]
