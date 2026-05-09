#!/bin/sh
set -e

echo "🚀 Starting Oftalmologia backend..."

# -------------------------------------------------------------------
# 1. Esperar PostgreSQL
# -------------------------------------------------------------------
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

if [ -n "${POSTGRES_HOST:-}" ]; then
  echo "⏳ Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."

  while ! nc -z "${POSTGRES_HOST}" "${POSTGRES_PORT}"; do
    sleep 1
  done

  echo "✅ PostgreSQL is ready!"
else
  echo "⚠️ POSTGRES_HOST is not set. Skipping PostgreSQL wait."
fi


# -------------------------------------------------------------------
# 2. Asegurar schema public antes de cualquier migración
# -------------------------------------------------------------------
if [ "${BOOTSTRAP_PUBLIC_SCHEMA:-1}" = "1" ]; then
  echo "🏗️ Ensuring PostgreSQL schema public exists..."

  python manage.py shell <<'PY'
from django.db import connection
z
with connection.cursor() as cursor:
    cursor.execute("CREATE SCHEMA IF NOT EXISTS public;")
    cursor.execute("GRANT USAGE, CREATE ON SCHEMA public TO CURRENT_USER;")
    cursor.execute("ALTER SCHEMA public OWNER TO CURRENT_USER;")

print("✅ Schema public exists.")
PY
fi


# -------------------------------------------------------------------
# 3. Migraciones shared/public
# -------------------------------------------------------------------
if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "📦 Applying public/shared schema migrations..."
  python manage.py migrate_schemas --shared --noinput
fi


# -------------------------------------------------------------------
# 4. Bootstrap de planes, tenant public y tenant demo
# -------------------------------------------------------------------
if [ "${BOOTSTRAP_TENANTS:-1}" = "1" ]; then
  echo "🏥 Bootstrapping tenants and subscription plans..."

  python manage.py shell <<'PY'
import os
from datetime import timedelta

from django.utils import timezone
from django_tenants.utils import schema_exists

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


PUBLIC_DOMAIN = os.environ.get("PUBLIC_DOMAIN", "localhost")

DEMO_SCHEMA = os.environ.get("DEMO_TENANT_SCHEMA", "clinica_demo")
DEMO_SLUG = os.environ.get("DEMO_TENANT_SLUG", "clinica-demo")
DEMO_NAME = os.environ.get("DEMO_TENANT_NAME", "Clínica Demo")
DEMO_EMAIL = os.environ.get("DEMO_TENANT_EMAIL", "demo@oftalmologia.local")
DEMO_DOMAIN = os.environ.get("DEMO_TENANT_DOMAIN", DEMO_SLUG)


# -------------------------------------------------------------------
# Planes base
# -------------------------------------------------------------------
planes = [
    {
        "codigo": PlanCodigo.FREE,
        "nombre": "Free",
        "descripcion": "Plan gratuito para pruebas iniciales.",
        "precio_mensual": 0,
        "moneda": "BOB",
        "max_usuarios": 3,
        "max_pacientes": 100,
        "max_citas_mes": 100,
        "max_almacenamiento_mb": 500,
        "permite_crm": False,
        "permite_notificaciones": False,
        "permite_reportes_avanzados": False,
        "permite_soporte_prioritario": False,
        "activo": True,
    },
    {
        "codigo": PlanCodigo.PLUS,
        "nombre": "Plus",
        "descripcion": "Plan intermedio para clínicas pequeñas.",
        "precio_mensual": 99,
        "moneda": "BOB",
        "max_usuarios": 10,
        "max_pacientes": 1000,
        "max_citas_mes": 1000,
        "max_almacenamiento_mb": 5000,
        "permite_crm": True,
        "permite_notificaciones": True,
        "permite_reportes_avanzados": False,
        "permite_soporte_prioritario": False,
        "activo": True,
    },
    {
        "codigo": PlanCodigo.PRO,
        "nombre": "Pro",
        "descripcion": "Plan avanzado para clínicas con operación completa.",
        "precio_mensual": 199,
        "moneda": "BOB",
        "max_usuarios": 50,
        "max_pacientes": 10000,
        "max_citas_mes": 10000,
        "max_almacenamiento_mb": 50000,
        "permite_crm": True,
        "permite_notificaciones": True,
        "permite_reportes_avanzados": True,
        "permite_soporte_prioritario": True,
        "activo": True,
    },
]

for data in planes:
    codigo = data.pop("codigo")
    plan, created = SubscriptionPlan.objects.update_or_create(
        codigo=codigo,
        defaults=data,
    )
    print(f"{'✅ Created' if created else '🔁 Updated'} plan {plan.codigo}")


# -------------------------------------------------------------------
# Tenant public
# -------------------------------------------------------------------
public_tenant, created = Tenant.objects.get_or_create(
    schema_name="public",
    defaults={
        "slug": "public",
        "nombre": "Sistema",
        "razon_social": "Sistema",
        "nit": "",
        "email_contacto": "",
        "telefono_contacto": "",
        "activo": True,
        "dominio_base": PUBLIC_DOMAIN,
    },
)

if not created:
    public_tenant.slug = "public"
    public_tenant.nombre = public_tenant.nombre or "Sistema"
    public_tenant.activo = True
    public_tenant.dominio_base = public_tenant.dominio_base or PUBLIC_DOMAIN
    public_tenant.save(update_fields=[
        "slug",
        "nombre",
        "activo",
        "dominio_base",
        "updated_at",
    ])

Domain.objects.update_or_create(
    domain=PUBLIC_DOMAIN,
    defaults={
        "tenant": public_tenant,
        "is_primary": True,
    },
)

print(f"{'✅ Created' if created else '🔁 Verified'} public tenant.")


# -------------------------------------------------------------------
# Tenant demo
# -------------------------------------------------------------------
demo_tenant, created = Tenant.objects.get_or_create(
    schema_name=DEMO_SCHEMA,
    defaults={
        "slug": DEMO_SLUG,
        "nombre": DEMO_NAME,
        "razon_social": DEMO_NAME,
        "nit": "",
        "email_contacto": DEMO_EMAIL,
        "telefono_contacto": "",
        "activo": True,
        "dominio_base": DEMO_DOMAIN,
    },
)

if not created:
    demo_tenant.slug = DEMO_SLUG
    demo_tenant.nombre = DEMO_NAME
    demo_tenant.razon_social = demo_tenant.razon_social or DEMO_NAME
    demo_tenant.email_contacto = demo_tenant.email_contacto or DEMO_EMAIL
    demo_tenant.dominio_base = demo_tenant.dominio_base or DEMO_DOMAIN
    demo_tenant.activo = True
    demo_tenant.save(update_fields=[
        "slug",
        "nombre",
        "razon_social",
        "email_contacto",
        "dominio_base",
        "activo",
        "updated_at",
    ])

if not schema_exists(DEMO_SCHEMA):
    demo_tenant.create_schema(check_if_exists=True, sync_schema=False)
    print(f"✅ Created schema {DEMO_SCHEMA}.")
else:
    print(f"🔁 Schema {DEMO_SCHEMA} already exists.")

Domain.objects.update_or_create(
    domain=DEMO_DOMAIN,
    defaults={
        "tenant": demo_tenant,
        "is_primary": True,
    },
)

TenantSettings.objects.get_or_create(
    tenant=demo_tenant,
    defaults={
        "branding_nombre": demo_tenant.nombre,
        "branding_color_primario": "#2563eb",
        "branding_color_secundario": "#0f172a",
        "branding_logo_url": "",
        "flags": {},
    },
)

free_plan = SubscriptionPlan.objects.get(codigo=PlanCodigo.FREE)

TenantSubscription.objects.get_or_create(
    tenant=demo_tenant,
    defaults={
        "plan": free_plan,
        "estado": EstadoSuscripcion.TRIAL,
        "trial_fin": timezone.now() + timedelta(days=14),
    },
)

TenantUsage.objects.get_or_create(tenant=demo_tenant)

print(f"{'✅ Created' if created else '🔁 Verified'} demo tenant {DEMO_NAME} ({DEMO_SCHEMA}).")
PY
fi


# -------------------------------------------------------------------
# 5. Migraciones tenant
# -------------------------------------------------------------------
if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "📦 Applying tenant schema migrations..."
  python manage.py migrate_schemas --tenant --noinput
fi


# -------------------------------------------------------------------
# 6. Seeders opcionales
# -------------------------------------------------------------------
if [ "${RUN_SEEDERS:-1}" = "1" ]; then
  echo "🌱 Running seeders..."

  python manage.py shell <<'PY'
import importlib
import os

from django.db import connection
from django_tenants.utils import schema_context


DEMO_SCHEMA = os.environ.get("DEMO_TENANT_SCHEMA", "clinica_demo")


def run_seed(module_path):
    try:
        module = importlib.import_module(module_path)
    except ModuleNotFoundError:
        print(f"⚠️ Seeder not found: {module_path}")
        return

    if not hasattr(module, "run"):
        print(f"⚠️ Seeder {module_path} does not have run().")
        return

    result = module.run()

    if isinstance(result, tuple) and len(result) == 2:
        creados, existentes = result
        print(f"✅ {module_path}: creados={creados}, existentes={existentes}")
    else:
        print(f"✅ {module_path}: executed.")


public_seeders = [
    "seeders.seed_admin",
]

tenant_seeders = [
    "seeders.seed_admin",
    "seeders.seed_permisos",
    "seeders.seed_roles",
    "seeders.seed_tipos_cita",
    "seeders.seed_demo_paciente",
]


print("🌱 Running public seeders...")
connection.set_schema_to_public()

for seeder in public_seeders:
    run_seed(seeder)


print(f"🌱 Running tenant seeders in schema {DEMO_SCHEMA}...")

with schema_context(DEMO_SCHEMA):
    for seeder in tenant_seeders:
        run_seed(seeder)

print("✅ Seeders completed.")
PY
fi


# -------------------------------------------------------------------
# 7. Collect static
# -------------------------------------------------------------------
if [ "${RUN_COLLECTSTATIC:-1}" = "1" ]; then
  echo "📁 Collecting static files..."
  python manage.py collectstatic --noinput 2>/dev/null || true
fi


echo "✅ Entrypoint completed."
echo "▶️ Running command: $*"

exec "$@"