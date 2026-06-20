from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('inteligencia_artificial', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ClasificacionUrgencia',
            fields=[
                ('id_clasificacion', models.BigAutoField(primary_key=True, serialize=False)),
                ('nivel_urgencia', models.CharField(choices=[('BAJA', 'Baja'), ('MEDIA', 'Media'), ('ALTA', 'Alta'), ('CRITICA', 'Crítica')], db_index=True, max_length=20)),
                ('puntaje_riesgo', models.PositiveSmallIntegerField(default=0)),
                ('factores_clinicos', models.JSONField(blank=True, default=list)),
                ('criterios_evaluados', models.JSONField(blank=True, default=dict)),
                ('recomendacion', models.TextField()),
                ('requiere_derivacion', models.BooleanField(default=False)),
                ('estado', models.CharField(choices=[('PENDIENTE', 'Pendiente'), ('REVISADO', 'Revisado'), ('DERIVADO', 'Derivado')], db_index=True, default='PENDIENTE', max_length=20)),
                ('fecha_revision', models.DateTimeField(blank=True, null=True)),
                ('notas_internas', models.TextField(blank=True, default='')),
                ('fecha_creacion', models.DateTimeField(default=django.utils.timezone.now)),
                ('id_interaccion', models.OneToOneField(db_column='id_interaccion', on_delete=django.db.models.deletion.CASCADE, related_name='clasificacion_urgencia', to='inteligencia_artificial.interaccionasistentevirtual')),
                ('id_usuario', models.ForeignKey(db_column='id_usuario', on_delete=django.db.models.deletion.CASCADE, related_name='clasificaciones_urgencia', to=settings.AUTH_USER_MODEL)),
                ('revisado_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='clasificaciones_urgencia_revisadas', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Clasificacion de urgencia',
                'verbose_name_plural': 'Clasificaciones de urgencia',
                'db_table': 'ia_clasificaciones_urgencia',
                'ordering': ['-fecha_creacion'],
            },
        ),
        migrations.AddIndex(
            model_name='clasificacionurgencia',
            index=models.Index(fields=['estado', 'nivel_urgencia'], name='ia_clasif_estad_nivel_57bda1_idx'),
        ),
        migrations.AddIndex(
            model_name='clasificacionurgencia',
            index=models.Index(fields=['id_usuario', '-fecha_creacion'], name='ia_clasif_id_usuari_6f2a44_idx'),
        ),
    ]
