from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.atencionClinica.cirugias.models import Cirugia
from apps.atencionClinica.postoperatorio.models import Postoperatorio
from apps.bitacora.models import Bitacora
from apps.pacientes.historial_clinico.models import HistoriaClinica
from apps.pacientes.pacientes.models import Paciente
from apps.usuarios.users.models import TipoUsuario, Usuario


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def medico(db):
    return Usuario.objects.create_user(
        username='medico_postop',
        email='medico_postop@test.local',
        password='Password123!',
        nombres='Medico',
        apellidos='Postop',
        tipo_usuario=TipoUsuario.MEDICO,
    )


@pytest.fixture
def admin(db):
    return Usuario.objects.create_user(
        username='admin_postop',
        email='admin_postop@test.local',
        password='Password123!',
        nombres='Admin',
        apellidos='Postop',
        tipo_usuario=TipoUsuario.ADMIN,
    )


@pytest.fixture
def paciente_user(db):
    return Usuario.objects.create_user(
        username='paciente_postop',
        email='paciente_postop@test.local',
        password='Password123!',
        nombres='Paciente',
        apellidos='Postop',
        tipo_usuario=TipoUsuario.PACIENTE,
    )


@pytest.fixture
def paciente(db, paciente_user):
    return Paciente.objects.create(
        usuario=paciente_user,
        numero_historia='HC-CU15-001',
        tipo_documento='DNI',
        numero_documento='DOC-CU15-001',
        nombres='Paciente',
        apellidos='Postop',
    )


@pytest.fixture
def otro_paciente(db):
    return Paciente.objects.create(
        numero_historia='HC-CU15-002',
        tipo_documento='DNI',
        numero_documento='DOC-CU15-002',
        nombres='Otro',
        apellidos='Paciente',
    )


@pytest.fixture
def historia(db, paciente):
    return HistoriaClinica.objects.create(id_paciente=paciente)


@pytest.fixture
def cirugia(db, paciente, historia, medico):
    return Cirugia.objects.create(
        id_paciente=paciente,
        id_historia_clinica=historia,
        cirujano=medico,
        fecha_programada=timezone.now(),
        procedimiento='Facoemulsificacion',
    )


@pytest.mark.django_db
def test_paciente_no_puede_crear_postoperatorio(api_client, paciente_user, paciente, historia):
    api_client.force_authenticate(user=paciente_user)
    payload = {
        'id_paciente': paciente.id_paciente,
        'id_historia_clinica': historia.id_historia_clinica,
        'fecha_control': timezone.now().isoformat(),
        'estado_postoperatorio': 'EN_OBSERVACION',
    }
    response = api_client.post('/api/postoperatorios/', payload, format='json')
    assert response.status_code == 403


@pytest.mark.django_db
def test_validacion_cirugia_debe_corresponder_a_paciente(
    api_client, medico, paciente, otro_paciente, historia
):
    cirugia_otro = Cirugia.objects.create(
        id_paciente=otro_paciente,
        id_historia_clinica=HistoriaClinica.objects.create(id_paciente=otro_paciente),
        cirujano=medico,
        fecha_programada=timezone.now(),
        procedimiento='Otra cirugia',
    )
    api_client.force_authenticate(user=medico)
    payload = {
        'id_paciente': paciente.id_paciente,
        'id_historia_clinica': historia.id_historia_clinica,
        'id_cirugia': cirugia_otro.id_cirugia,
        'fecha_control': timezone.now().isoformat(),
    }
    response = api_client.post('/api/postoperatorios/', payload, format='json')
    assert response.status_code == 400
    assert 'id_cirugia' in response.data


@pytest.mark.django_db
def test_crud_base_filtros_y_bitacora(api_client, medico, admin, paciente, historia, cirugia):
    api_client.force_authenticate(user=medico)
    payload = {
        'id_paciente': paciente.id_paciente,
        'id_historia_clinica': historia.id_historia_clinica,
        'id_cirugia': cirugia.id_cirugia,
        'estado_postoperatorio': 'EN_OBSERVACION',
        'fecha_control': timezone.now().isoformat(),
        'proximo_control': (timezone.now() + timedelta(days=7)).isoformat(),
        'alertas': 'Molestia leve',
        'observaciones': 'Control inicial',
    }
    create_response = api_client.post('/api/postoperatorios/', payload, format='json')
    assert create_response.status_code == 201
    object_id = create_response.data['id_postoperatorio']

    patch_response = api_client.patch(
        f'/api/postoperatorios/{object_id}/',
        {'estado_postoperatorio': 'ESTABLE'},
        format='json',
    )
    assert patch_response.status_code == 200
    assert patch_response.data['estado_postoperatorio'] == 'ESTABLE'

    api_client.force_authenticate(user=admin)
    lista_response = api_client.get(
        f'/api/postoperatorios/?id_paciente={paciente.id_paciente}&id_cirugia={cirugia.id_cirugia}&estado_postoperatorio=ESTABLE'
    )
    assert lista_response.status_code == 200
    assert lista_response.data['count'] >= 1

    fecha = timezone.now().date().isoformat()
    fecha_response = api_client.get(f'/api/postoperatorios/?fecha={fecha}')
    assert fecha_response.status_code == 200
    assert fecha_response.data['count'] >= 1

    delete_response = api_client.delete(f'/api/postoperatorios/{object_id}/')
    assert delete_response.status_code == 204
    assert not Postoperatorio.objects.filter(pk=object_id).exists()
    assert Bitacora.objects.filter(modulo='postoperatorio').count() >= 3
