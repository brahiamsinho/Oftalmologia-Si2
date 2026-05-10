"""
apps/core/management/commands/seed.py

Comando de management Django que ejecuta todos los seeders del proyecto.

Con django-tenants:
    # Poblar un tenant por slug
    python manage.py seed --tenant clinica-demo

    # Poblar un tenant por schema
    python manage.py seed --schema clinica_demo

    # Poblar solo un seeder dentro de un tenant
    python manage.py seed --tenant clinica-demo --only admin
    python manage.py seed --tenant clinica-demo --only tipos_cita
    python manage.py seed --tenant clinica-demo --only roles
    python manage.py seed --tenant clinica-demo --only permisos
    python manage.py seed --tenant clinica-demo --only demo_paciente

    # Superadmin plataforma (solo schema public)
    python manage.py seed --schema public --only platform_admin
"""
import importlib
import os
import sys

from django.apps import apps
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django_tenants.utils import get_public_schema_name, schema_context


ROOT_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.dirname(
                os.path.dirname(
                    os.path.abspath(__file__)
                )
            )
        )
    )
)

if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)


SEEDERS = {
    'admin': (
        'seeders.seed_admin',
        'Superusuario Administrador',
    ),
    'tipos_cita': (
        'seeders.seed_tipos_cita',
        'Tipos de Cita',
    ),
    'roles': (
        'seeders.seed_roles',
        'Roles del Sistema',
    ),
    'permisos': (
        'seeders.seed_permisos',
        'Permisos Granulares',
    ),
    'demo_paciente': (
        'seeders.seed_demo_paciente',
        'Demo paciente + citas',
    ),
    'platform_admin': (
        'seeders.seed_platform_admin',
        'Superadmin plataforma (schema public)',
    ),
}


class Command(BaseCommand):
    help = (
        'Ejecuta los seeders de datos iniciales dentro del schema actual '
        'o dentro del tenant indicado con --tenant/--schema.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--only',
            type=str,
            choices=sorted(SEEDERS.keys()),
            help=f'Ejecuta solo un seeder. Opciones: {", ".join(sorted(SEEDERS.keys()))}',
        )
        parser.add_argument(
            '--tenant',
            type=str,
            help='Slug del tenant. Ej: clinica-demo',
        )
        parser.add_argument(
            '--schema',
            type=str,
            help='Nombre del schema. Ej: clinica_demo',
        )

    def _get_tenant_model(self):
        app_label, model_name = settings.TENANT_MODEL.split('.')
        return apps.get_model(app_label, model_name)

    def _resolve_schema(self, tenant_slug=None, schema_name=None):
        if tenant_slug and schema_name:
            raise CommandError('Usa solo --tenant o solo --schema, no ambos.')

        if schema_name:
            return schema_name.strip()

        if tenant_slug:
            tenant_slug = tenant_slug.strip()

            Tenant = self._get_tenant_model()

            with schema_context(get_public_schema_name()):
                tenant = Tenant.objects.filter(slug=tenant_slug).first()

            if tenant is None:
                raise CommandError(f'No existe un tenant con slug "{tenant_slug}".')

            return tenant.schema_name

        return None

    def _get_targets(self, only):
        if only:
            return {only: SEEDERS[only]}
        return SEEDERS

    def _run_seeders(self, targets, only=None):
        total_creados = 0
        total_existentes = 0

        schema_actual = getattr(
            connection,
            'schema_name',
            get_public_schema_name(),
        )

        if schema_actual != get_public_schema_name():
            targets = {
                k: v for k, v in targets.items() if k != 'platform_admin'
            }
            if only == 'platform_admin' or (only is None and not targets):
                raise CommandError(
                    'El seeder platform_admin solo se ejecuta en schema public. '
                    'Usá: python manage.py seed --schema public --only platform_admin'
                )
        if not targets:
            raise CommandError(
                'No hay seeders para ejecutar en este schema con los filtros actuales.'
            )

        self.stdout.write(
            self.style.MIGRATE_HEADING(
                f'\n🌱 Ejecutando seeders en schema: {schema_actual}\n'
            )
        )

        for key, (module_path, label) in targets.items():
            self.stdout.write(f'  → {label}... ', ending='')

            try:
                module = importlib.import_module(module_path)
                creados, existentes = module.run()

                total_creados += creados
                total_existentes += existentes

                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ {creados} creados, {existentes} ya existían'
                    )
                )

            except Exception as exc:
                self.stdout.write(self.style.ERROR(f'✗ ERROR: {exc}'))
                raise

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Seeding completado en schema "{schema_actual}": '
                f'{total_creados} registros creados, '
                f'{total_existentes} ya existían.\n'
            )
        )

    def handle(self, *args, **options):
        only = options.get('only')
        tenant_slug = options.get('tenant')
        schema_name = options.get('schema')

        if only == 'platform_admin' and tenant_slug:
            raise CommandError(
                'El seeder platform_admin es solo para schema public. '
                'Quitá --tenant o usá: python manage.py seed --schema public --only platform_admin'
            )

        targets = self._get_targets(only)
        resolved_schema = self._resolve_schema(
            tenant_slug=tenant_slug,
            schema_name=schema_name,
        )

        if resolved_schema:
            if resolved_schema == get_public_schema_name():
                if not only:
                    raise CommandError(
                        'En schema public solo tiene sentido un seeder explícito '
                        '(no hay usuarios de clínica aquí). Ejemplo:\n'
                        '  python manage.py seed --schema public --only platform_admin'
                    )
                self.stdout.write(
                    self.style.WARNING(
                        '⚠️ Schema public: típicamente solo platform_admin; '
                        'los seeders de clínica viven en el schema del tenant.'
                    )
                )

            with schema_context(resolved_schema):
                self._run_seeders(targets, only=only)
            return

        schema_actual = getattr(
            connection,
            'schema_name',
            get_public_schema_name(),
        )

        self.stdout.write(
            self.style.WARNING(
                f'⚠️ No se indicó --tenant ni --schema. '
                f'Los seeders correrán en el schema actual: "{schema_actual}". '
                f'En django-tenants normalmente debes usar: '
                f'python manage.py seed --tenant <slug>'
            )
        )

        self._run_seeders(targets, only=only)