from django.http import JsonResponse
from rest_framework import status

from apps.tenant.models import Tenant

from .tenant_context import get_current_tenant, reset_current_tenant, set_current_tenant


class TenantMiddleware:
    public_path_prefixes = (
        '/api/health/',
        '/api/auth/',
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        previous_token = set_current_tenant(None)
        request.tenant = None

        try:
            if not self._requires_tenant(request.path):
                return self.get_response(request)

            tenant_slug = (request.META.get('HTTP_X_TENANT_SLUG') or '').strip()
            if not tenant_slug:
                return self._json_error('Falta el header X-Tenant-Slug.', status.HTTP_400_BAD_REQUEST)

            tenant = (
                Tenant.objects.select_related('settings')
                .filter(slug=tenant_slug, activo=True)
                .first()
            )
            if tenant is None:
                return self._json_error('Tenant no encontrado o inactivo.', status.HTTP_403_FORBIDDEN)

            request.tenant = tenant
            set_current_tenant(tenant)
            return self.get_response(request)
        finally:
            reset_current_tenant(previous_token)

    def _json_error(self, detail, status_code):
        return JsonResponse({'detail': detail}, status=status_code)

    def _requires_tenant(self, path):
        if not path.startswith('/api/'):
            return False
        return not any(path.startswith(prefix) for prefix in self.public_path_prefixes)
