"""
seeders/seed_platform_admin.py

Crea el PlatformAdministrator en el schema public (SHARED_APPS).

Importante:
- Este seeder NO depende de variables .env para credenciales.
- Usa credenciales demo fijas e idempotentes para entornos de desarrollo/demo.
"""
from django.db import IntegrityError, connection
from django_tenants.utils import get_public_schema_name

from apps.platform_admin.models import PlatformAdministrator

# Credenciales demo (seeders)
PLATFORM_ADMIN_EMAIL = 'platform@oftalmologia.local'
PLATFORM_ADMIN_PASSWORD = 'platform123'


def _resolve_credentials():
    return PLATFORM_ADMIN_EMAIL.lower(), PLATFORM_ADMIN_PASSWORD


def ensure_platform_admin_credentials():
    """
    Idempotente: crea el admin de plataforma si no existe.

    Returns:
        ('created', email) | ('exists', email) | ('skipped', reason)
    """
    if connection.schema_name != get_public_schema_name():
        return ('skipped', 'wrong_schema')

    email, password = _resolve_credentials()
    existing = PlatformAdministrator.objects.filter(email__iexact=email).first()
    if existing is not None:
        return ('exists', email)

    try:
        row = PlatformAdministrator(
            email=email.lower(),
            nombre='Superadmin inicial',
            is_active=True,
            is_staff=True,
        )
        row.set_password(password)
        row.save(force_insert=True)
    except IntegrityError:
        return ('exists', email)

    return ('created', email)


def run():
    """
    Ejecutable desde `manage.py seed --schema public --only platform_admin`.

    Returns:
        (creados, existentes) — si no es schema public, (0, 0).
    """
    status = ensure_platform_admin_credentials()
    if status[0] == 'created':
        return 1, 0
    if status[0] == 'exists':
        return 0, 1
    return 0, 0
