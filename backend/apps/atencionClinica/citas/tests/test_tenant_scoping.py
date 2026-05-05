import pytest
from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.atencionClinica.citas.models import Cita, TipoCita
from apps.atencionClinica.citas.views import CitaViewSet
from apps.atencionClinica.especialistas.models import Especialista
from apps.pacientes.pacientes.models import Paciente
from apps.tenant.models import Tenant
from apps.usuarios.users.models import TipoUsuario, Usuario


@pytest.fixture
def factory():
    return APIRequestFactory()


@pytest.fixture
def tenant_uno(db):
    return Tenant.objects.create(slug='tenant-citas-uno', nombre='Tenant Citas Uno', activo=True)


@pytest.fixture
def tenant_dos(db):
    return Tenant.objects.create(slug='tenant-citas-dos', nombre='Tenant Citas Dos', activo=True)


@pytest.fixture
def admin_uno(db, tenant_uno):
    return Usuario.objects.create_user(
        username='admin_citas_uno',
        email='admin_citas_uno@test.local',
        password='Password123!',
        nombres='Admin',
        apellidos='CitasUno',
        tipo_usuario=TipoUsuario.ADMINISTRATIVO,
        tenant=tenant_uno,
    )


@pytest.fixture
def paciente_dos(db, tenant_dos):
    user = Usuario.objects.create_user(
        username='pac_citas_dos',
        email='pac_citas_dos@test.local',
        password='Password123!',
        nombres='Paciente',
        apellidos='Dos',
        tipo_usuario=TipoUsuario.PACIENTE,
        tenant=tenant_dos,
    )
    return Paciente.objects.create(
        tenant=tenant_dos,
        usuario=user,
        numero_historia='HC-CITAS-002',
        tipo_documento='DNI',
        numero_documento='DOC-CITAS-002',
        nombres='Paciente',
        apellidos='Dos',
    )


@pytest.fixture
def especialista_dos(db, tenant_dos):
    user = Usuario.objects.create_user(
        username='med_citas_dos',
        email='med_citas_dos@test.local',
        password='Password123!',
        nombres='Medico',
        apellidos='Dos',
        tipo_usuario=TipoUsuario.MEDICO,
        tenant=tenant_dos,
    )
    return Especialista.objects.create(usuario=user, especialidad='Oftalmología')


@pytest.fixture
def cita_dos(db, tenant_dos, paciente_dos, especialista_dos):
    tipo_cita = TipoCita.objects.create(nombre='CONSULTA', descripcion='Consulta general')
    return Cita.objects.create(
        tenant=tenant_dos,
        id_paciente=paciente_dos,
        id_especialista=especialista_dos,
        id_tipo_cita=tipo_cita,
        fecha_hora_inicio=timezone.now(),
        fecha_hora_fin=timezone.now() + timedelta(minutes=30),
        motivo='Control',
    )


@pytest.mark.django_db
def test_citas_aislamiento_cross_tenant(factory, admin_uno, tenant_uno, cita_dos):
    list_request = factory.get('/api/citas/')
    list_request.tenant = tenant_uno
    force_authenticate(list_request, user=admin_uno)

    list_response = CitaViewSet.as_view({'get': 'list'})(list_request)
    assert list_response.status_code == 200
    assert list_response.data['count'] == 0

    retrieve_request = factory.get(f'/api/citas/{cita_dos.id_cita}/')
    retrieve_request.tenant = tenant_uno
    force_authenticate(retrieve_request, user=admin_uno)

    retrieve_response = CitaViewSet.as_view({'get': 'retrieve'})(retrieve_request, pk=cita_dos.id_cita)
    assert retrieve_response.status_code == 404
