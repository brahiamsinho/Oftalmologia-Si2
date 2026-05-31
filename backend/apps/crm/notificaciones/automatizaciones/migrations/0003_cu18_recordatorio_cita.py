# CU17 (PUDS) — recordatorio de cita + FK id_cita (nombre archivo histórico cu18)

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('automatizaciones', '0002_initial'),
        ('citas', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='tarearecordatorioprogramada',
            name='id_cita',
            field=models.ForeignKey(
                blank=True,
                db_column='id_cita',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='recordatorios_programados',
                to='citas.cita',
            ),
        ),
        migrations.AlterField(
            model_name='reglarecordatorio',
            name='tipo_regla',
            field=models.CharField(
                choices=[
                    ('CONTROL_POSTOPERATORIO', 'Control postoperatorio'),
                    ('RECORDATORIO_CITA', 'Recordatorio de cita'),
                ],
                default='CONTROL_POSTOPERATORIO',
                max_length=40,
            ),
        ),
    ]
