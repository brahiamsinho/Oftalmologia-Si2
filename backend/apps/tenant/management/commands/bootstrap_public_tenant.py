from django.core.management.base import BaseCommand
from django.db import transaction

from apps.tenant.management.commands.create_tenant import ensure_default_plans
from apps.tenant.models import Domain, Tenant, TenantSettings


class Command(BaseCommand):
    help = 'Crea/actualiza el tenant public requerido por django-tenants y los planes base.'

    def add_arguments(self, parser):
        parser.add_argument('--domain', default='localhost', help='Dominio principal del schema public. Ej: localhost')

    @transaction.atomic
    def handle(self, *args, **options):
        ensure_default_plans()

        tenant, created = Tenant.objects.update_or_create(
            schema_name='public',
            defaults={
                'slug': 'public',
                'nombre': 'Public',
                'razon_social': 'Public',
                'activo': True,
                'dominio_base': options['domain'],
            },
        )

        Domain.objects.update_or_create(
            domain=options['domain'],
            defaults={
                'tenant': tenant,
                'is_primary': True,
            },
        )

        TenantSettings.objects.update_or_create(
            tenant=tenant,
            defaults={
                'timezone': 'America/La_Paz',
                'idioma': 'es',
                'branding_nombre': 'Oftalmología Si2',
                'flags': {'public_schema': True},
            },
        )

        msg = 'creado' if created else 'actualizado'
        self.stdout.write(self.style.SUCCESS(f'Tenant public {msg}: schema=public domain={options["domain"]}'))
