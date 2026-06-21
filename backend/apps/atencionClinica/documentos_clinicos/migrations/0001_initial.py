# Generated manually for CU26.
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('historial_clinico', '0002_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DocumentoClinicoAutorizado',
            fields=[
                ('id_documento_clinico', models.BigAutoField(primary_key=True, serialize=False)),
                ('tipo_documento', models.CharField(choices=[('RECETA', 'Receta'), ('INDICACION', 'Indicación')], max_length=20)),
                ('titulo', models.CharField(max_length=200)),
                ('contenido', models.TextField(blank=True, null=True)),
                ('archivo', models.FileField(blank=True, null=True, upload_to='documentos_clinicos/')),
                ('estado', models.CharField(choices=[('ACTIVO', 'Activo'), ('REVOCADO', 'Revocado'), ('VENCIDO', 'Vencido')], default='ACTIVO', max_length=20)),
                ('fecha_emision', models.DateTimeField(default=django.utils.timezone.now)),
                ('fecha_vencimiento', models.DateField(blank=True, null=True)),
                ('origen_modulo', models.CharField(blank=True, max_length=80, null=True)),
                ('origen_registro_id', models.BigIntegerField(blank=True, null=True)),
                ('observaciones', models.TextField(blank=True, null=True)),
                ('creado_por', models.ForeignKey(blank=True, db_column='id_creado_por', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='documentos_clinicos_emitidos', to=settings.AUTH_USER_MODEL)),
                ('id_historia_clinica', models.ForeignKey(db_column='id_historia_clinica', on_delete=django.db.models.deletion.CASCADE, related_name='documentos_clinicos', to='historial_clinico.historiaclinica')),
            ],
            options={
                'db_table': 'documentos_clinicos_autorizados',
                'ordering': ['-fecha_emision', '-id_documento_clinico'],
                'verbose_name': 'Documento Clínico Autorizado',
                'verbose_name_plural': 'Documentos Clínicos Autorizados',
            },
        ),
    ]
