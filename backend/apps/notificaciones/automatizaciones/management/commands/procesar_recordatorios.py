"""
Procesa recordatorios pendientes en todos los tenants activos (CU17, cron-friendly).

Uso:
    python manage.py procesar_recordatorios
    python manage.py procesar_recordatorios --tenant-slug clinica-demo --limit 50
"""
from django.core.management.base import BaseCommand
from django_tenants.utils import get_tenant_model, tenant_context

from apps.notificaciones.automatizaciones.services.processing import procesar_recordatorios_pendientes


class Command(BaseCommand):
    help = 'Procesa tareas pendientes de recordatorios automáticos en cada tenant activo.'

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=100, help='Máximo por tenant.')
        parser.add_argument(
            '--tenant-slug',
            type=str,
            default=None,
            help='Solo este tenant (slug). Si se omite, recorre todos los activos.',
        )

    def handle(self, *args, **options):
        limit = max(1, int(options['limit']))
        tenant_slug = options.get('tenant_slug')

        Tenant = get_tenant_model()
        tenants = Tenant.objects.filter(activo=True)

        if tenant_slug:
            tenants = tenants.filter(slug=tenant_slug)
            if not tenants.exists():
                self.stderr.write(self.style.ERROR(f'Tenant "{tenant_slug}" no encontrado o inactivo.'))
                return

        total_global = 0

        for tenant in tenants:
            if tenant.schema_name == 'public':
                continue

            with tenant_context(tenant):
                procesadas = procesar_recordatorios_pendientes(limit=limit)
                total_global += procesadas
                self.stdout.write(
                    f'  {tenant.slug} ({tenant.schema_name}): {procesadas} tarea(s) procesada(s)',
                )

        self.stdout.write(self.style.SUCCESS(f'Total procesadas: {total_global}'))
