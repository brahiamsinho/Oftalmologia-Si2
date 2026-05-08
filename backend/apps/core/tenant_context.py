from contextvars import ContextVar

from django.db import connection


_current_tenant = ContextVar('current_tenant', default=None)


def set_current_tenant(tenant):
    return _current_tenant.set(tenant)


def get_current_tenant():
    tenant = _current_tenant.get()
    if tenant is not None:
        return tenant
    return getattr(connection, 'tenant', None)


def reset_current_tenant(token):
    _current_tenant.reset(token)
