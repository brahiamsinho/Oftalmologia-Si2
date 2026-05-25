# CU19 — Seguros y convenios (initial)

import django.core.validators
import django.db.models.deletion
import django.utils.timezone
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('pacientes', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Aseguradora',
            fields=[
                ('id_aseguradora', models.BigAutoField(primary_key=True, serialize=False)),
                ('codigo', models.CharField(max_length=30, unique=True)),
                ('nombre', models.CharField(max_length=150)),
                ('razon_social', models.CharField(blank=True, default='', max_length=200)),
                ('telefono', models.CharField(blank=True, default='', max_length=30)),
                ('email', models.EmailField(blank=True, default='', max_length=120)),
                ('activo', models.BooleanField(db_index=True, default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Aseguradora',
                'verbose_name_plural': 'Aseguradoras',
                'db_table': 'seguros_aseguradoras',
                'ordering': ['nombre'],
            },
        ),
        migrations.CreateModel(
            name='Convenio',
            fields=[
                ('id_convenio', models.BigAutoField(primary_key=True, serialize=False)),
                ('codigo', models.CharField(max_length=40)),
                ('nombre', models.CharField(max_length=150)),
                ('descripcion', models.TextField(blank=True, default='')),
                (
                    'porcentaje_cobertura',
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal('80.00'),
                        help_text='Porcentaje que cubre el convenio (0–100).',
                        max_digits=5,
                        validators=[
                            django.core.validators.MinValueValidator(Decimal('0')),
                            django.core.validators.MaxValueValidator(Decimal('100')),
                        ],
                    ),
                ),
                (
                    'copago_monto',
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal('0.00'),
                        help_text='Copago fijo en moneda local (referencia administrativa).',
                        max_digits=12,
                        validators=[django.core.validators.MinValueValidator(Decimal('0'))],
                    ),
                ),
                ('fecha_inicio', models.DateField(default=django.utils.timezone.now)),
                ('fecha_fin', models.DateField(blank=True, null=True)),
                ('activo', models.BooleanField(db_index=True, default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'creado_por',
                    models.ForeignKey(
                        blank=True,
                        db_column='creado_por',
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='convenios_creados',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    'id_aseguradora',
                    models.ForeignKey(
                        db_column='id_aseguradora',
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='convenios',
                        to='seguros.aseguradora',
                    ),
                ),
            ],
            options={
                'verbose_name': 'Convenio',
                'verbose_name_plural': 'Convenios',
                'db_table': 'seguros_convenios',
                'ordering': ['-fecha_inicio', 'nombre'],
            },
        ),
        migrations.CreateModel(
            name='AfiliacionSeguroPaciente',
            fields=[
                ('id_afiliacion', models.BigAutoField(primary_key=True, serialize=False)),
                ('numero_afiliado', models.CharField(max_length=60)),
                ('numero_poliza', models.CharField(blank=True, default='', max_length=60)),
                ('titular_nombre', models.CharField(blank=True, default='', max_length=150)),
                ('es_titular', models.BooleanField(default=True)),
                (
                    'es_principal',
                    models.BooleanField(
                        default=False,
                        help_text='Cobertura principal del paciente para facturación/referencia.',
                    ),
                ),
                ('fecha_inicio', models.DateField(default=django.utils.timezone.now)),
                ('fecha_fin', models.DateField(blank=True, null=True)),
                ('activo', models.BooleanField(db_index=True, default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'id_convenio',
                    models.ForeignKey(
                        db_column='id_convenio',
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='afiliaciones',
                        to='seguros.convenio',
                    ),
                ),
                (
                    'id_paciente',
                    models.ForeignKey(
                        db_column='id_paciente',
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='afiliaciones_seguro',
                        to='pacientes.paciente',
                    ),
                ),
            ],
            options={
                'verbose_name': 'Afiliación de seguro',
                'verbose_name_plural': 'Afiliaciones de seguro',
                'db_table': 'seguros_afiliaciones_paciente',
                'ordering': ['-es_principal', '-fecha_inicio'],
            },
        ),
        migrations.AddConstraint(
            model_name='convenio',
            constraint=models.UniqueConstraint(
                fields=('id_aseguradora', 'codigo'),
                name='seguros_convenio_aseguradora_codigo_uniq',
            ),
        ),
        migrations.AddConstraint(
            model_name='afiliacionseguropaciente',
            constraint=models.UniqueConstraint(
                fields=('id_paciente', 'id_convenio', 'numero_afiliado'),
                name='seguros_afiliacion_paciente_convenio_num_uniq',
            ),
        ),
    ]
