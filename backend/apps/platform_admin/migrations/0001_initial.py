from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='PlatformAdministrator',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('email', models.EmailField(db_index=True, max_length=254, unique=True)),
                ('password', models.CharField(max_length=128)),
                ('nombre', models.CharField(blank=True, default='', max_length=150)),
                ('is_active', models.BooleanField(default=True)),
                ('is_staff', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Administrador de plataforma',
                'verbose_name_plural': 'Administradores de plataforma',
                'db_table': 'platform_administrator',
            },
        ),
    ]
