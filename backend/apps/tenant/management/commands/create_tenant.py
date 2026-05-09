from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.tenant.models import (
    Domain,
    EstadoSuscripcion,
    PlanCodigo,
    SubscriptionPlan,
    Tenant,
    TenantSettings,
    TenantSubscription,
    TenantUsage,
)


DEFAULT_PLANS = {
    PlanCodigo.FREE: {
        'nombre': 'Free',
        'descripcion': 'Plan gratuito para pruebas o uso básico.',
        'precio_mensual': 0,
        'max_usuarios': 3,
        'max_pacientes': 100,
        'max_citas_mes': 100,
        'max_almacenamiento_mb': 500,
        'permite_crm': False,
        'permite_notificaciones': False,
        'permite_reportes_avanzados': False,
        'permite_soporte_prioritario': False,
    },
    PlanCodigo.PLUS: {
        'nombre': 'Plus',
        'descripcion': 'Plan para clínicas pequeñas o medianas.',
        'precio_mensual': 149,
        'max_usuarios': 15,
        'max_pacientes': 2000,
        'max_citas_mes': 1500,
        'max_almacenamiento_mb': 5000,
        'permite_crm': True,
        'permite_notificaciones': True,
        'permite_reportes_avanzados': False,
        'permite_soporte_prioritario': False,
    },
    PlanCodigo.PRO: {
        'nombre': 'Pro',
        'descripcion': 'Plan completo para organizaciones con alto volumen.',
        'precio_mensual': 299,
        'max_usuarios': 50,
        'max_pacientes': 10000,
        'max_citas_mes': 10000,
        'max_almacenamiento_mb': 20000,
        'permite_crm': True,
        'permite_notificaciones': True,
        'permite_reportes_avanzados': True,
        'permite_soporte_prioritario': True,
    },
}


def ensure_default_plans():
    for code, data in DEFAULT_PLANS.items():
        SubscriptionPlan.objects.update_or_create(codigo=code, defaults=data)


def normalizar_schema(slug: str) -> str:
    return slug.strip().lower().replace('-', '_')


class Command(BaseCommand):
    help = 'Crea una organización tenant accesible por /t/<slug>/api/...'

    def add_arguments(self, parser):
        parser.add_argument('--slug', required=True, help='Slug URL. Ej: clinica-demo')
        parser.add_argument('--nombre', required=True, help='Nombre de la organización')
        parser.add_argument('--schema', required=False, help='Opcional. Si no se da, se genera desde slug.')
        parser.add_argument(
            '--plan',
            default=PlanCodigo.FREE,
            choices=[choice[0] for choice in PlanCodigo.choices],
            help='Plan de suscripción',
        )
        parser.add_argument('--trial-days', type=int, default=14)
        parser.add_argument('--email-contacto', default='')
        parser.add_argument('--telefono-contacto', default='')
        parser.add_argument('--razon-social', default='')
        parser.add_argument('--nit', default='')

    @transaction.atomic
    def handle(self, *args, **options):
        ensure_default_plans()

        slug = options['slug'].strip().lower()
        schema_name = (options.get('schema') or normalizar_schema(slug)).strip().lower().replace('-', '_')
        plan_code = options['plan']

        if slug == 'public' or schema_name == 'public':
            raise CommandError('Usa bootstrap_public_tenant para crear public, no create_tenant.')

        if Tenant.objects.filter(schema_name=schema_name).exists():
            raise CommandError(f'Ya existe un tenant con schema {schema_name}.')

        if Tenant.objects.filter(slug=slug).exists():
            raise CommandError(f'Ya existe un tenant con slug {slug}.')

        if Domain.objects.filter(domain=slug).exists():
            raise CommandError(f'Ya existe un subfolder/domain {slug}.')

        plan = SubscriptionPlan.objects.get(codigo=plan_code)

        tenant = Tenant.objects.create(
            schema_name=schema_name,
            slug=slug,
            nombre=options['nombre'],
            razon_social=options['razon_social'],
            nit=options['nit'],
            email_contacto=options['email_contacto'],
            telefono_contacto=options['telefono_contacto'],
            dominio_base=slug,
            activo=True,
        )

        Domain.objects.create(domain=slug, tenant=tenant, is_primary=True)

        TenantSettings.objects.create(
            tenant=tenant,
            branding_nombre=tenant.nombre,
        )

        TenantSubscription.objects.create(
            tenant=tenant,
            plan=plan,
            estado=EstadoSuscripcion.TRIAL if options['trial_days'] else EstadoSuscripcion.ACTIVA,
            trial_fin=timezone.now() + timedelta(days=options['trial_days']) if options['trial_days'] else None,
        )

        TenantUsage.objects.create(tenant=tenant)

        self.stdout.write(
            self.style.SUCCESS(
                f'Tenant creado: {tenant.nombre} | schema={tenant.schema_name} | url=/t/{tenant.slug}/ | plan={plan.codigo}'
            )
        )
