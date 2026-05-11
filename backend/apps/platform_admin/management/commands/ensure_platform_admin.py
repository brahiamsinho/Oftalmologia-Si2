from django.core.management.base import BaseCommand

from seeders.seed_platform_admin import ensure_platform_admin_credentials


class Command(BaseCommand):
    help = (
        'Crea un PlatformAdministrator inicial en schema public usando '
        'PLATFORM_ADMIN_EMAIL y PLATFORM_ADMIN_PASSWORD, o en DEBUG los '
        'valores por defecto del seeder (ver seed_platform_admin / README).'
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

        if kind == 'skipped' and detail == 'no_credentials':
            self.stdout.write(
                self.style.WARNING(
                    'PLATFORM_ADMIN_EMAIL o PLATFORM_ADMIN_PASSWORD no definidas (y DEBUG=False); omitiendo.',
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
