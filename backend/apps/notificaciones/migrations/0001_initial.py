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
            name='DispositivoFcm',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.CharField(db_index=True, max_length=512, unique=True)),
                (
                    'plataforma',
                    models.CharField(
                        choices=[('android', 'Android'), ('ios', 'iOS'), ('web', 'Web')],
                        default='android',
                        max_length=16,
                    ),
                ),
                ('creado_en', models.DateTimeField(auto_now_add=True)),
                ('actualizado_en', models.DateTimeField(auto_now=True)),
                (
                    'usuario',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='dispositivos_fcm',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'verbose_name': 'Dispositivo FCM',
                'verbose_name_plural': 'Dispositivos FCM',
                'db_table': 'notificaciones_dispositivos_fcm',
            },
        ),
    ]
