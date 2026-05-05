import json

import pytest
from django.http import HttpResponse, JsonResponse
from django.test import RequestFactory

from apps.core.tenant_context import get_current_tenant
from apps.core.tenant_middleware import TenantMiddleware
from apps.tenant.models import Tenant, TenantSettings


@pytest.fixture
def request_factory():
    return RequestFactory()


@pytest.fixture
def tenant(db):
    return Tenant.objects.create(
        slug='clínica-demo',
        nombre='Clínica Demo',
        activo=True,
    )


@pytest.fixture
def tenant_inactivo(db):
    return Tenant.objects.create(
        slug='inactivo',
        nombre='Tenant Inactivo',
        activo=False,
    )


@pytest.mark.django_db
def test_resuelve_tenant_activo_por_header_sin_settings(request_factory, tenant):
    assert not TenantSettings.objects.filter(tenant=tenant).exists()

    captured = {}

    def get_response(request):
        captured['tenant'] = request.tenant
        captured['context_tenant'] = get_current_tenant()
        return HttpResponse('ok')

    request = request_factory.get('/api/users/', HTTP_X_TENANT_SLUG=tenant.slug)
    response = TenantMiddleware(get_response)(request)

    assert response.status_code == 200
    assert captured['tenant'] == tenant
    assert captured['context_tenant'] == tenant
    assert request.tenant == tenant
    assert get_current_tenant() is None


@pytest.mark.django_db
@pytest.mark.parametrize('slug', ['missing', 'inactivo'])
def test_tenant_inexistente_o_inactivo_retorna_403(request_factory, tenant_inactivo, slug):
    request = request_factory.get('/api/users/', HTTP_X_TENANT_SLUG=slug)

    def get_response(_request):
        return HttpResponse('no debería ejecutarse')

    response = TenantMiddleware(get_response)(request)

    assert isinstance(response, JsonResponse)
    assert response.status_code == 403
    assert json.loads(response.content.decode())['detail'] == 'Tenant no encontrado o inactivo.'
    assert get_current_tenant() is None


@pytest.mark.django_db
def test_sin_tenant_en_endpoint_requerido_retorna_400(request_factory):
    request = request_factory.get('/api/users/')

    def get_response(_request):
        return HttpResponse('no debería ejecutarse')

    response = TenantMiddleware(get_response)(request)

    assert isinstance(response, JsonResponse)
    assert response.status_code == 400
    assert json.loads(response.content.decode())['detail'] == 'Falta el header X-Tenant-Slug.'
    assert get_current_tenant() is None


@pytest.mark.django_db
def test_auth_endpoint_bypasa_tenant(request_factory):
    captured = {}

    def get_response(request):
        captured['tenant'] = request.tenant
        captured['context_tenant'] = get_current_tenant()
        return HttpResponse('ok')

    request = request_factory.get('/api/auth/login/')
    response = TenantMiddleware(get_response)(request)

    assert response.status_code == 200
    assert captured['tenant'] is None
    assert captured['context_tenant'] is None
    assert get_current_tenant() is None


@pytest.mark.django_db
def test_health_endpoint_no_requiere_tenant(request_factory):
    captured = {}

    def get_response(request):
        captured['tenant'] = request.tenant
        captured['context_tenant'] = get_current_tenant()
        return HttpResponse('ok')

    request = request_factory.get('/api/health/')
    response = TenantMiddleware(get_response)(request)

    assert response.status_code == 200
    assert captured['tenant'] is None
    assert captured['context_tenant'] is None
    assert get_current_tenant() is None


@pytest.mark.django_db
def test_contexto_se_limpia_entre_requests(request_factory, tenant):
    first_captured = {}

    def first_response(request):
        first_captured['tenant'] = request.tenant
        first_captured['context_tenant'] = get_current_tenant()
        return HttpResponse('primero')

    first_request = request_factory.get('/api/users/', HTTP_X_TENANT_SLUG=tenant.slug)
    first_response_result = TenantMiddleware(first_response)(first_request)

    assert first_response_result.status_code == 200
    assert first_captured['tenant'] == tenant
    assert first_captured['context_tenant'] == tenant
    assert get_current_tenant() is None

    second_captured = {}

    def second_response(request):
        second_captured['tenant'] = request.tenant
        second_captured['context_tenant'] = get_current_tenant()
        return HttpResponse('segundo')

    second_request = request_factory.get('/api/health/')
    second_response_result = TenantMiddleware(second_response)(second_request)

    assert second_response_result.status_code == 200
    assert second_captured['tenant'] is None
    assert second_captured['context_tenant'] is None
    assert get_current_tenant() is None


@pytest.mark.django_db
def test_excepcion_en_get_response_no_deja_tenant_pegado(request_factory, tenant):
    def get_response(request):
        assert request.tenant == tenant
        assert get_current_tenant() == tenant
        raise RuntimeError('boom')

    request = request_factory.get('/api/users/', HTTP_X_TENANT_SLUG=tenant.slug)

    with pytest.raises(RuntimeError):
        TenantMiddleware(get_response)(request)

    assert get_current_tenant() is None
