import pytest
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.pacientes.pacientes.models import Paciente
from apps.pacientes.pacientes.views import PacienteViewSet
from apps.tenant.models import Tenant
from apps.usuarios.users.models import TipoUsuario, Usuario


@pytest.fixture
def factory():
    return APIRequestFactory()


@pytest.fixture
def tenant_uno(db):
    return Tenant.objects.create(slug='tenant-uno', nombre='Tenant Uno', activo=True)


@pytest.fixture
def tenant_dos(db):
    return Tenant.objects.create(slug='tenant-dos', nombre='Tenant Dos', activo=True)


@pytest.fixture
def admin_uno(db, tenant_uno):
    return Usuario.objects.create_user(
        username='admin_uno',
        email='admin_uno@test.local',
        password='Password123!',
        nombres='Admin',
        apellidos='Uno',
        tipo_usuario=TipoUsuario.ADMINISTRATIVO,
        tenant=tenant_uno,
    )


@pytest.fixture
def admin_dos(db, tenant_dos):
    return Usuario.objects.create_user(
        username='admin_dos',
        email='admin_dos@test.local',
        password='Password123!',
        nombres='Admin',
        apellidos='Dos',
        tipo_usuario=TipoUsuario.ADMINISTRATIVO,
        tenant=tenant_dos,
    )


@pytest.fixture
def paciente_tenant_dos(db, tenant_dos):
    return Paciente.objects.create(
        tenant=tenant_dos,
        numero_historia='HC-TENANT-002',
        tipo_documento='DNI',
        numero_documento='DOC-TENANT-002',
        nombres='Paciente',
        apellidos='Dos',
    )


@pytest.mark.django_db
def test_paciente_create_asigna_tenant_y_lista_aislada(factory, tenant_uno, tenant_dos, admin_uno, admin_dos, paciente_tenant_dos):
    create_request = factory.post(
        '/api/pacientes/',
        {
            'tipo_documento': 'DNI',
            'numero_documento': 'DOC-TENANT-001',
            'nombres': 'Paciente',
            'apellidos': 'Uno',
        },
        format='json',
    )
    create_request.tenant = tenant_uno
    force_authenticate(create_request, user=admin_uno)

    create_response = PacienteViewSet.as_view({'post': 'create'})(create_request)

    assert create_response.status_code == 201
    paciente_creado = Paciente.objects.get(pk=create_response.data['id_paciente'])
    assert paciente_creado.tenant == tenant_uno

    list_request = factory.get('/api/pacientes/')
    list_request.tenant = tenant_uno
    force_authenticate(list_request, user=admin_uno)

    list_response = PacienteViewSet.as_view({'get': 'list'})(list_request)
    assert list_response.status_code == 200
    assert list_response.data['count'] == 1
    assert list_response.data['results'][0]['id_paciente'] == paciente_creado.id_paciente

    retrieve_request = factory.get(f'/api/pacientes/{paciente_tenant_dos.id_paciente}/')
    retrieve_request.tenant = tenant_uno
    force_authenticate(retrieve_request, user=admin_uno)

    retrieve_response = PacienteViewSet.as_view({'get': 'retrieve'})(retrieve_request, pk=paciente_tenant_dos.id_paciente)
    assert retrieve_response.status_code == 404
