"""
Migration 0001 — CU17: Generar y exportar reportes.

Crea la tabla crm_reportes_generados para el registro de auditoría
de cada reporte generado en el sistema.
"""

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ReporteGenerado',
            fields=[
                ('id_reporte', models.BigAutoField(primary_key=True, serialize=False)),
                (
                    'tipo_reporte',
                    models.CharField(
                        choices=[
                            ('RESUMEN_PACIENTES',   'Resumen de pacientes'),
                            ('CITAS',               'Citas y agenda'),
                            ('CONSULTAS',           'Consultas clínicas'),
                            ('MEDICIONES_VISUALES', 'Mediciones visuales'),
                            ('CIRUGIAS',            'Cirugías'),
                            ('POSTOPERATORIO',      'Seguimiento postoperatorio'),
                            ('CRM_COMUNICACIONES',  'Comunicaciones CRM'),
                        ],
                        max_length=25,
                    ),
                ),
                (
                    'formato',
                    models.CharField(
                        choices=[('JSON', 'JSON (API)'), ('CSV', 'CSV')],
                        default='JSON',
                        max_length=4,
                    ),
                ),
                ('fecha_desde', models.DateField(blank=True, null=True)),
                ('fecha_hasta', models.DateField(blank=True, null=True)),
                ('filtros_extra', models.JSONField(blank=True, null=True)),
                (
                    'estado',
                    models.CharField(
                        choices=[
                            ('GENERADO', 'Generado correctamente'),
                            ('ERROR',    'Error al generar'),
                        ],
                        default='GENERADO',
                        max_length=8,
                    ),
                ),
                ('total_registros', models.IntegerField(default=0)),
                ('mensaje_error', models.TextField(blank=True, null=True)),
                (
                    'generado_por',
                    models.ForeignKey(
                        blank=True,
                        db_column='generado_por',
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='reportes_generados',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Reporte generado',
                'verbose_name_plural': 'Reportes generados',
                'db_table': 'crm_reportes_generados',
                'ordering': ['-created_at'],
            },
        ),
    ]
