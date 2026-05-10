# Generated manually for apps.reportes (Django 5.x compatible)

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
            name='ReportTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=200)),
                ('descripcion', models.TextField(blank=True, default='')),
                (
                    'qbe_payload',
                    models.JSONField(
                        default=dict,
                        help_text='Definición QBE (modelo lógico, filtros, agregaciones). Interpretado únicamente por el motor seguro en services.qbe_engine.',
                    ),
                ),
                (
                    'is_system_report',
                    models.BooleanField(
                        db_index=True,
                        default=False,
                        help_text='True = plantilla predefinida (CU22); False = personalizada (CU21).',
                    ),
                ),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'created_by',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='report_templates_created',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'verbose_name': 'Plantilla de reporte',
                'verbose_name_plural': 'Plantillas de reporte',
                'db_table': 'reportes_plantilla',
                'ordering': ['-created_at', 'nombre'],
            },
        ),
    ]
