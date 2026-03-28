from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Creates a default superuser if none exists'

    def handle(self, *args, **options):
        User = get_user_model()
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@oftalmologia.com',
                password='admin',
                nombres='Administrador',
                apellidos='Sistema',
                tipo_usuario='ADMIN'
            )
            self.stdout.write(self.style.SUCCESS('Superusuario creado automáticamente: admin / admin'))
        else:
            self.stdout.write(self.style.WARNING('El superusuario admin ya existe.'))
