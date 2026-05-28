from django.core.management.base import BaseCommand

from seeders.seed_platform_admin import ensure_platform_admin_credentials


class Command(BaseCommand):
    help = (
        'Crea un PlatformAdministrator inicial en schema public usando '
        'credenciales demo definidas en seeders.seed_platform_admin.'
    )

    def handle(self, *args, **options):
        status = ensure_platform_admin_credentials()
        kind, detail = status[0], status[1]

        if kind == 'skipped' and detail == 'wrong_schema':
            self.stdout.write(
                self.style.WARNING(
                    'Seeder de plataforma: el schema actual no es public. '
                    'Ejecutá desde public o: python manage.py seed --schema public --only platform_admin',
                ),
            )
            return

        if kind == 'exists':
            self.stdout.write(f'PlatformAdministrator ya existe para ese correo ({detail}).')
            return

        if kind == 'created':
            self.stdout.write(
                self.style.SUCCESS(f'Administrador plataforma creado: {detail}'),
            )
