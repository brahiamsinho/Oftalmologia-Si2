"""
seeders/seed_platform_admin.py

Crea el PlatformAdministrator en el schema public (SHARED_APPS).

Credenciales:
  - Preferencia: PLATFORM_ADMIN_EMAIL / PLATFORM_ADMIN_PASSWORD (settings → .env).
  - Solo si DEBUG=True y faltan ambas variables: fallback de desarrollo documentado
    en README (no usar en producción sin .env).
"""
from django.conf import settings
from django.db import IntegrityError, connection
from django_tenants.utils import get_public_schema_name

from apps.platform_admin.models import PlatformAdministrator

# Solo desarrollo cuando DEBUG=True y no hay variables en .env
DEV_FALLBACK_EMAIL = 'platform@oftalmologia.local'
DEV_FALLBACK_PASSWORD = 'platform123'


def _resolve_credentials():
    email = (getattr(settings, 'PLATFORM_ADMIN_EMAIL', '') or '').strip().lower()
    password = getattr(settings, 'PLATFORM_ADMIN_PASSWORD', '') or ''
    if email and password:
        return email, password
    if getattr(settings, 'DEBUG', False):
        return DEV_FALLBACK_EMAIL.lower(), DEV_FALLBACK_PASSWORD
    return None, None


def ensure_platform_admin_credentials():
    """
    Idempotente: crea el admin de plataforma si no existe.

    Returns:
        ('created', email) | ('exists', email) | ('skipped', reason)
    """
    if connection.schema_name != get_public_schema_name():
        return ('skipped', 'wrong_schema')

    email, password = _resolve_credentials()
    if not email or not password:
        return ('skipped', 'no_credentials')

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
