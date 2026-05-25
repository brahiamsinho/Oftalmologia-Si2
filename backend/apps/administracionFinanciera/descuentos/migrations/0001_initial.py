# Generated manually for CU19 (PUDS)

import decimal

import django.core.validators
import django.db.models.deletion
import django.utils.timezone
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
            name='PromocionDescuento',
            fields=[
                ('id_promocion', models.BigAutoField(primary_key=True, serialize=False)),
                ('codigo', models.CharField(max_length=40, unique=True)),
                ('nombre', models.CharField(max_length=150)),
                ('descripcion', models.TextField(blank=True, default='')),
                (
                    'tipo_beneficio',
                    models.CharField(
                        choices=[('PORCENTAJE', 'Porcentaje'), ('MONTO_FIJO', 'Monto fijo')],
                        default='PORCENTAJE',
                        max_length=20,
                    ),
                ),
                (
                    'valor',
                    models.DecimalField(
                        decimal_places=2,
                        help_text='Porcentaje (0–100) o monto fijo según tipo_beneficio.',
                        max_digits=12,
                        validators=[django.core.validators.MinValueValidator(decimal.Decimal('0.01'))],
                    ),
                ),
                (
                    'alcance',
                    models.CharField(
                        choices=[
                            ('GENERAL', 'Todos los pacientes'),
                            ('ASIGNADA', 'Solo pacientes asignados'),
                        ],
                        default='GENERAL',
                        max_length=20,
                    ),
                ),
                (
                    'compatibilidad_seguro',
                    models.CharField(
                        choices=[
                            ('CUALQUIERA', 'Compatible con o sin seguro'),
                            ('SOLO_SIN_SEGURO', 'Solo sin cobertura vigente'),
                            ('INCOMPATIBLE_SEGURO', 'No acumular con seguro vigente'),
                        ],
                        default='CUALQUIERA',
                        max_length=30,
                    ),
                ),
                (
                    'acumulable',
                    models.BooleanField(
                        default=False,
                        help_text='Si es False, no puede combinarse con otra promoción vigente del paciente.',
                    ),
                ),
                (
                    'condiciones_aplicacion',
                    models.TextField(
                        blank=True,
                        default='',
                        help_text='Condiciones legibles para admisión/facturación.',
                    ),
                ),
                ('fecha_inicio', models.DateField(default=django.utils.timezone.now)),
                ('fecha_fin', models.DateField(blank=True, null=True)),
                (
                    'estado',
                    models.CharField(
                        choices=[
                            ('BORRADOR', 'Borrador'),
                            ('ACTIVA', 'Activa'),
                            ('INACTIVA', 'Inactiva'),
                            ('FINALIZADA', 'Finalizada'),
                        ],
                        db_index=True,
                        default='BORRADOR',
                        max_length=20,
                    ),
                ),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'creado_por',
                    models.ForeignKey(
                        blank=True,
                        db_column='creado_por',
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='promociones_creadas',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'verbose_name': 'Promoción / descuento',
                'verbose_name_plural': 'Promociones y descuentos',
                'db_table': 'descuentos_promociones',
                'ordering': ['-fecha_inicio', 'nombre'],
            },
        ),
        migrations.CreateModel(
            name='BeneficioPaciente',
            fields=[
                ('id_beneficio', models.BigAutoField(primary_key=True, serialize=False)),
                ('fecha_asignacion', models.DateField(default=django.utils.timezone.now)),
                ('fecha_fin', models.DateField(blank=True, null=True)),
                ('activo', models.BooleanField(db_index=True, default=True)),
                ('notificado', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'id_paciente',
                    models.ForeignKey(
                        db_column='id_paciente',
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='beneficios_asignados',
                        to='pacientes.paciente',
                    ),
                ),
                (
                    'id_promocion',
                    models.ForeignKey(
                        db_column='id_promocion',
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='asignaciones_paciente',
                        to='descuentos.promociondescuento',
                    ),
                ),
            ],
            options={
                'verbose_name': 'Beneficio asignado',
                'verbose_name_plural': 'Beneficios asignados',
                'db_table': 'descuentos_beneficios_paciente',
                'ordering': ['-fecha_asignacion'],
            },
        ),
        migrations.AddConstraint(
            model_name='beneficiopaciente',
            constraint=models.UniqueConstraint(
                fields=('id_paciente', 'id_promocion'),
                name='descuentos_beneficio_paciente_promo_uniq',
            ),
        ),
    ]
