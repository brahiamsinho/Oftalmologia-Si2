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
from seeders.demo_password_sync import should_sync_demo_passwords

# Credenciales demo (seeders)
PLATFORM_ADMIN_EMAIL = 'platform@oftalmologia.local'
PLATFORM_ADMIN_PASSWORD = 'platform123'


def _resolve_credentials():
    return PLATFORM_ADMIN_EMAIL.lower(), PLATFORM_ADMIN_PASSWORD


def ensure_platform_admin_credentials():
    """
    Idempotente: crea el admin de plataforma si no existe.

    Returns:
        ('created', email) | ('synced', email) | ('exists', email) | ('skipped', reason)
    """
    if connection.schema_name != get_public_schema_name():
        return ('skipped', 'wrong_schema')

    email, password = _resolve_credentials()
    existing = PlatformAdministrator.objects.filter(email__iexact=email).first()
    if existing is not None:
        synced = False
        if should_sync_demo_passwords():
            existing.set_password(password)
            existing.is_active = True
            existing.is_staff = True
            existing.save(update_fields=['password', 'is_active', 'is_staff', 'updated_at'])
            synced = True
        return ('synced', email) if synced else ('exists', email)

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
        row = PlatformAdministrator.objects.filter(email__iexact=email).first()
        if row is not None and should_sync_demo_passwords():
            row.set_password(password)
            row.is_active = True
            row.is_staff = True
            row.save(update_fields=['password', 'is_active', 'is_staff', 'updated_at'])
            return ('synced', email)
        return ('exists', email)

    return ('created', email)


def run():
    """
    Ejecutable desde `manage.py seed --schema public --only platform_admin`.

    Returns:
        (creados, existentes, passwords_synced) — si no es schema public, (0, 0, 0).
    """
    status = ensure_platform_admin_credentials()
    if status[0] == 'created':
        return 1, 0, 0
    if status[0] == 'synced':
        return 0, 0, 1
    if status[0] == 'exists':
        return 0, 1, 0
    return 0, 0, 0
