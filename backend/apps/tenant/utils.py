from django.apps import apps

from apps.core.tenant_context import get_current_tenant


def get_legacy_tenant():
    Tenant = apps.get_model('tenant', 'Tenant')
    return Tenant.objects.filter(slug='legacy').first()


def resolve_tenant_for_write(*, explicit_tenant=None, related_tenant=None):
    if explicit_tenant is not None:
        return explicit_tenant

    current_tenant = get_current_tenant()
    if current_tenant is not None and getattr(current_tenant, 'schema_name', None) != 'public':
        return current_tenant

    if related_tenant is not None:
        return related_tenant

    return get_legacy_tenant()
