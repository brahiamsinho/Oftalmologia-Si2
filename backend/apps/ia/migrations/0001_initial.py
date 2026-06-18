# Generated manually for CU24 after local/Docker Django runtime was unavailable.

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('pacientes', '0002_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ChatbotUrgencyClassification',
            fields=[
                ('id_clasificacion', models.BigAutoField(primary_key=True, serialize=False)),
                ('mensaje_usuario', models.TextField()),
                (
                    'nivel',
                    models.CharField(
                        choices=[
                            ('BAJO', 'Bajo'),
                            ('MEDIO', 'Medio'),
                            ('ALTO', 'Alto'),
                            ('CRITICO', 'Crítico'),
                            ('INSUFICIENTE', 'Información insuficiente'),
                            ('INDETERMINADO', 'No determinable'),
                        ],
                        db_index=True,
                        max_length=20,
                    ),
                ),
                (
                    'confianza',
                    models.FloatField(
                        help_text='Confianza determinística normalizada entre 0.0 y 1.0.',
                        validators=[
                            django.core.validators.MinValueValidator(0.0),
                            django.core.validators.MaxValueValidator(1.0),
                        ],
                    ),
                ),
                ('criterios_detectados', models.JSONField(blank=True, default=list)),
                ('orientacion', models.TextField()),
                ('requiere_atencion_humana', models.BooleanField(db_index=True, default=False)),
                (
                    'estado_derivacion',
                    models.CharField(
                        choices=[
                            ('NO_REQUERIDA', 'No requerida'),
                            ('PENDIENTE', 'Pendiente'),
                        ],
                        db_index=True,
                        default='NO_REQUERIDA',
                        max_length=20,
                    ),
                ),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'paciente',
                    models.ForeignKey(
                        db_column='id_paciente',
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='clasificaciones_urgencia_chatbot',
                        to='pacientes.paciente',
                    ),
                ),
                (
                    'usuario',
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='clasificaciones_urgencia_chatbot',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'verbose_name': 'Clasificación de urgencia del chatbot',
                'verbose_name_plural': 'Clasificaciones de urgencia del chatbot',
                'db_table': 'ia_chatbot_urgency_classifications',
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['paciente', '-created_at'], name='ia_urg_paciente_created_idx'),
                    models.Index(fields=['nivel', '-created_at'], name='ia_urg_nivel_created_idx'),
                    models.Index(fields=['estado_derivacion', '-created_at'], name='ia_urg_deriv_created_idx'),
                ],
            },
        ),
    ]
