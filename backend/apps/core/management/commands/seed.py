"""
apps/core/management/commands/seed.py
Comando de management Django que ejecuta todos los seeders del proyecto.

Uso:
    # Todos los seeders (admin + datos base)
    python manage.py seed

    # Solo un seeder específico
    python manage.py seed --only admin       # superusuario
    python manage.py seed --only tipos_cita  # tipos de cita
    python manage.py seed --only roles       # roles del sistema
    python manage.py seed --only permisos    # permisos granulares
    python manage.py seed --only demo_paciente  # paciente + médicos + citas (dev)

    # Dentro de Docker
    docker-compose exec backend python manage.py seed

Variables de entorno para el admin (opcionales, con defaults seguros para dev):
    ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOMBRES, ADMIN_APELLIDOS
"""
import sys
import os

from django.core.management.base import BaseCommand

# Asegura que el directorio raíz del proyecto esté en sys.path
# para poder importar desde /backend/seeders/
ROOT_DIR = os.path.dirname(
    os.path.dirname(  # commands/
        os.path.dirname(  # management/
            os.path.dirname(  # core/
                os.path.dirname(  # apps/
                    os.path.abspath(__file__)
                )
            )
        )
    )
)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)


SEEDERS = {
    'admin':         ('seeders.seed_admin',           'Superusuario Administrador'),
    'tipos_cita':    ('seeders.seed_tipos_cita',       'Tipos de Cita'),
    'roles':         ('seeders.seed_roles',            'Roles del Sistema'),
    'permisos':      ('seeders.seed_permisos',         'Permisos Granulares'),
    'demo_paciente': ('seeders.seed_demo_paciente',    'Demo paciente + citas (dev)'),
}


class Command(BaseCommand):
    help = (
        'Ejecuta los seeders de datos iniciales. '
        'Usa --only <nombre> para ejecutar solo uno.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--only',
            type=str,
            choices=list(SEEDERS.keys()),
            help=f'Ejecuta solo el seeder indicado. Opciones: {", ".join(SEEDERS.keys())}',
        )

    def handle(self, *args, **options):
        only = options.get('only')
        targets = {only: SEEDERS[only]} if only else SEEDERS

        self.stdout.write(self.style.MIGRATE_HEADING('\n🌱 Iniciando seeders...\n'))

        total_creados = 0
        total_existentes = 0

        for key, (module_path, label) in targets.items():
            self.stdout.write(f'  → {label}... ', ending='')
            try:
                import importlib
                module = importlib.import_module(module_path)
                creados, existentes = module.run()
                total_creados += creados
                total_existentes += existentes
                self.stdout.write(
                    self.style.SUCCESS(f'✓ {creados} creados, {existentes} ya existían')
                )
            except Exception as exc:
                self.stdout.write(self.style.ERROR(f'✗ ERROR: {exc}'))
                raise

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Seeding completado: '
                f'{total_creados} registros creados, '
                f'{total_existentes} ya existían.\n'
            )
        )
