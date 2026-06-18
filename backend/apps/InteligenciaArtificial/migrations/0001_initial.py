import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='InteraccionAsistenteVirtual',
            fields=[
                ('id_interaccion', models.BigAutoField(primary_key=True, serialize=False)),
                ('id_conversacion', models.UUIDField(db_index=True, default=uuid.uuid4)),
                ('mensaje', models.TextField()),
                ('respuesta', models.TextField()),
                ('intencion', models.CharField(choices=[('CITAS_HORARIOS', 'Citas y horarios'), ('PROCEDIMIENTOS', 'Procedimientos'), ('PREOPERATORIO', 'Indicaciones preoperatorias'), ('POSTOPERATORIO', 'Cuidados postoperatorios'), ('SEGUROS_FACTURACION', 'Seguros y facturacion'), ('SISTEMA', 'Uso del sistema'), ('SALUDO', 'Saludo'), ('URGENCIA', 'Sintomas o posible urgencia'), ('FUERA_ALCANCE', 'Fuera del alcance'), ('NO_COMPRENDIDA', 'No comprendida')], db_index=True, max_length=40)),
                ('estado', models.CharField(choices=[('RESPONDIDA', 'Respondida'), ('REQUIERE_CU24', 'Requiere clasificacion CU24'), ('FUERA_ALCANCE', 'Fuera del alcance'), ('NO_COMPRENDIDA', 'No comprendida')], db_index=True, default='RESPONDIDA', max_length=30)),
                ('requiere_clasificacion_urgencia', models.BooleanField(default=False)),
                ('nivel_prioridad', models.CharField(choices=[('NO_APLICA', 'No aplica'), ('BAJA', 'Baja'), ('MEDIA', 'Media'), ('ALTA', 'Alta')], default='NO_APLICA', max_length=20)),
                ('sintomas_detectados', models.JSONField(blank=True, default=list)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('ip_origen', models.CharField(blank=True, max_length=45, null=True)),
                ('user_agent', models.TextField(blank=True, null=True)),
                ('fecha_creacion', models.DateTimeField(default=django.utils.timezone.now)),
                ('id_usuario', models.ForeignKey(db_column='id_usuario', on_delete=django.db.models.deletion.CASCADE, related_name='interacciones_asistente_virtual', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Interaccion del asistente virtual',
                'verbose_name_plural': 'Interacciones del asistente virtual',
                'db_table': 'ia_interacciones_asistente_virtual',
                'ordering': ['-fecha_creacion'],
            },
        ),
        migrations.AddIndex(
            model_name='interaccionasistentevirtual',
            index=models.Index(fields=['id_usuario', '-fecha_creacion'], name='ia_interacc_id_usua_c4bd01_idx'),
        ),
        migrations.AddIndex(
            model_name='interaccionasistentevirtual',
            index=models.Index(fields=['id_conversacion', '-fecha_creacion'], name='ia_interacc_id_conv_3a0b30_idx'),
        ),
        migrations.AddIndex(
            model_name='interaccionasistentevirtual',
            index=models.Index(fields=['requiere_clasificacion_urgencia', 'nivel_prioridad'], name='ia_interacc_requier_0fbc0f_idx'),
        ),
    ]
