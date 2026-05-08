from django.db import models

from apps.core.tenant_context import get_current_tenant


class TenantQuerySet(models.QuerySet):
    def for_tenant(self, tenant=None):
        tenant = tenant or get_current_tenant()
        if tenant is None:
            return self.none()
        return self.filter(tenant=tenant)

    def for_current_tenant(self):
        return self.for_tenant()

    def for_legacy(self):
        from .utils import get_legacy_tenant

        legacy = get_legacy_tenant()
        if legacy is None:
            return self.none()
        return self.for_tenant(legacy)


class TenantManager(models.Manager.from_queryset(TenantQuerySet)):
    pass
