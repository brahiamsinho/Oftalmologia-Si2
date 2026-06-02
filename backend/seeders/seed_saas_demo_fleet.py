"""
seeders/seed_saas_demo_fleet.py

Provisiona una flota demo SaaS de 5 clínicas:
- 2 FREE
- 2 PLUS
- 1 PRO

Para cada clínica:
- crea/actualiza tenant + domain + settings + suscripción + usage
- asegura schema
- crea/actualiza admin tenant
- ejecuta seed_tipos_cita
- ejecuta seed_reporting_6months

Ejecutar en schema public:
    python manage.py seed --schema public --only saas_demo_fleet
"""
from dataclasses import dataclass
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import connection, transaction
from django.utils import timezone
from django_tenants.utils import get_public_schema_name, schema_context, schema_exists

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

from seeders.tenant_seeders import run_tenant_seeders


@dataclass(frozen=True)
class DemoClinic:
    slug: str
    nombre: str
    plan: str
    admin_email: str
    admin_password: str
    admin_nombres: str
    admin_apellidos: str


CLINICS = [
    DemoClinic(
        slug='clinica-norte',
        nombre='Clínica Norte Visión',
        plan=PlanCodigo.FREE,
        admin_email='admin.norte@oftalmologia.local',
        admin_password='AdminNorte123!',
        admin_nombres='Valeria',
        admin_apellidos='Paz',
    ),
    DemoClinic(
        slug='clinica-sur',
        nombre='Centro Oftalmológico Sur',
        plan=PlanCodigo.FREE,
        admin_email='admin.sur@oftalmologia.local',
        admin_password='AdminSur123!',
        admin_nombres='Mauricio',
        admin_apellidos='Luna',
    ),
    DemoClinic(
        slug='clinica-andina',
        nombre='Clínica Andina de Ojos',
        plan=PlanCodigo.PLUS,
        admin_email='admin.andina@oftalmologia.local',
        admin_password='AdminAndina123!',
        admin_nombres='Paola',
        admin_apellidos='Rivas',
    ),
    DemoClinic(
        slug='clinica-pacifico',
        nombre='Instituto Ocular Pacífico',
        plan=PlanCodigo.PLUS,
        admin_email='admin.pacifico@oftalmologia.local',
        admin_password='AdminPacifico123!',
        admin_nombres='Diego',
        admin_apellidos='Salvatierra',
    ),
    DemoClinic(
        slug='clinica-prime',
        nombre='Prime Eye Center',
        plan=PlanCodigo.PRO,
        admin_email='admin.prime@oftalmologia.local',
        admin_password='AdminPrime123!',
        admin_nombres='Camila',
        admin_apellidos='Mendoza',
    ),
]


def _schema_name(slug: str) -> str:
    return slug.replace('-', '_')


def _ensure_plan(plan_code: str):
    plan = SubscriptionPlan.objects.filter(codigo=plan_code, activo=True).first()
    if plan:
        return plan
    raise RuntimeError(
        f'No existe plan activo "{plan_code}". Ejecuta bootstrap de planes primero.'
    )


@transaction.atomic
def _ensure_tenant_row(clinic: DemoClinic):
    plan = _ensure_plan(clinic.plan)
    schema_name = _schema_name(clinic.slug)

    tenant, created = Tenant.objects.get_or_create(
        slug=clinic.slug,
        defaults={
            'schema_name': schema_name,
            'nombre': clinic.nombre,
            'razon_social': clinic.nombre,
            'email_contacto': clinic.admin_email,
            'telefono_contacto': '',
            'activo': True,
            'dominio_base': clinic.slug,
        },
    )

    if not created:
        tenant.nombre = clinic.nombre
        tenant.razon_social = clinic.nombre
        tenant.email_contacto = clinic.admin_email
        tenant.activo = True
        tenant.dominio_base = clinic.slug
        tenant.save(
            update_fields=[
                'nombre',
                'razon_social',
                'email_contacto',
                'activo',
                'dominio_base',
                'updated_at',
            ]
        )

    Domain.objects.update_or_create(
        domain=clinic.slug,
        defaults={'tenant': tenant, 'is_primary': True},
    )

    TenantSettings.objects.update_or_create(
        tenant=tenant,
        defaults={
            'branding_nombre': clinic.nombre,
            'branding_color_primario': '#2563eb',
            'branding_color_secundario': '#0f172a',
            'branding_logo_url': '',
            'flags': {},
        },
    )

    trial_days = 14 if clinic.plan == PlanCodigo.FREE else 0
    TenantSubscription.objects.update_or_create(
        tenant=tenant,
        defaults={
            'plan': plan,
            'estado': EstadoSuscripcion.TRIAL if trial_days else EstadoSuscripcion.ACTIVA,
            'trial_fin': timezone.now() + timedelta(days=trial_days) if trial_days else None,
        },
    )

    TenantUsage.objects.get_or_create(tenant=tenant)
    return tenant, created


def _ensure_schema(tenant: Tenant):
    if not schema_exists(tenant.schema_name):
        tenant.create_schema(check_if_exists=True, sync_schema=True)


def _ensure_admin_in_tenant(clinic: DemoClinic):
    User = get_user_model()
    username = clinic.admin_email.split('@')[0].replace('-', '.')

    user, created = User.objects.get_or_create(
        email=clinic.admin_email.lower(),
        defaults={
            'username': username[:50],
            'nombres': clinic.admin_nombres,
            'apellidos': clinic.admin_apellidos,
            'tipo_usuario': 'ADMIN',
            'estado': 'ACTIVO',
            'is_active': True,
            'is_staff': True,
            'is_superuser': True,
        },
    )

    if not created:
        user.username = user.username or username[:50]
        user.nombres = clinic.admin_nombres
        user.apellidos = clinic.admin_apellidos
        user.tipo_usuario = 'ADMIN'
        user.estado = 'ACTIVO'
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True

    user.set_password(clinic.admin_password)
    user.save()
    return created


def run():
    if connection.schema_name != get_public_schema_name():
        raise RuntimeError(
            'seed_saas_demo_fleet solo se ejecuta en schema public '
            '(usar --schema public).'
        )

    created_count = 0
    existing_count = 0
    credentials = []

    for clinic in CLINICS:
        tenant, tenant_created = _ensure_tenant_row(clinic)
        _ensure_schema(tenant)

        with schema_context(tenant.schema_name):
            admin_created = _ensure_admin_in_tenant(clinic)
            seed_created, seed_existing = run_tenant_seeders()

        if tenant_created:
            created_count += 1
        else:
            existing_count += 1

        if admin_created:
            created_count += 1
        else:
            existing_count += 1

        created_count += seed_created
        existing_count += seed_existing

        credentials.append(
            (
                clinic.nombre,
                clinic.slug,
                clinic.plan,
                clinic.admin_email,
                clinic.admin_password,
            )
        )

    print('\n🏥 SaaS demo fleet lista:\n')
    for name, slug, plan, email, password in credentials:
        print(f'  - {name}')
        print(f'      slug:     {slug}')
        print(f'      plan:     {plan}')
        print(f'      login:    /t/{slug}/login')
        print(f'      email:    {email}')
        print(f'      password: {password}')
        print()

    return created_count, existing_count
