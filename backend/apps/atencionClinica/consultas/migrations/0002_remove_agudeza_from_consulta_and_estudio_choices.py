# Elimina columnas de agudeza en Consulta y el tipo agudeza_visual en Estudio (datos ya en medicion_visual).

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('consultas', '0001_initial'),
        ('medicion_visual', '0002_migrate_agudeza_desde_consulta_y_estudio'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='consulta',
            name='agudeza_visual_od',
        ),
        migrations.RemoveField(
            model_name='consulta',
            name='agudeza_visual_oi',
        ),
        migrations.AlterField(
            model_name='estudio',
            name='tipo_estudio',
            field=models.CharField(
                choices=[
                    ('refraccion', 'Refracción'),
                    ('tonometria', 'Tonometría (Presión Intraocular)'),
                    ('fondo_ojo', 'Fondo de Ojo'),
                    ('topografia', 'Topografía Corneal'),
                    ('paquimetria', 'Paquimetría'),
                    ('tomografia', 'Tomografía de Coherencia Óptica (OCT)'),
                    ('campo_visual', 'Campo Visual'),
                    ('otros', 'Otros'),
                ],
                default='otros',
                max_length=50,
            ),
        ),
    ]
