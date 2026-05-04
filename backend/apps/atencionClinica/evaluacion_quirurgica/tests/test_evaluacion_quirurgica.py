import pytest
from rest_framework.test import APIClient

from apps.atencionClinica.consultas.models import Consulta
from apps.atencionClinica.evaluacion_quirurgica.models import EvaluacionQuirurgica
from apps.pacientes.historial_clinico.models import HistoriaClinica
from apps.pacientes.pacientes.models import Paciente
from apps.usuarios.users.models import TipoUsuario, Usuario
from apps.bitacora.models import Bitacora


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def medico(db):
    return Usuario.objects.create_user(
        username='medico_eval',
        email='medico_eval@test.local',
        password='Password123!',
        nombres='Medico',
        apellidos='Eval',
        tipo_usuario=TipoUsuario.MEDICO,
    )


@pytest.fixture
def admin(db):
    return Usuario.objects.create_user(
        username='admin_eval',
        email='admin_eval@test.local',
        password='Password123!',
        nombres='Admin',
        apellidos='Eval',
        tipo_usuario=TipoUsuario.ADMIN,
    )


@pytest.fixture
def paciente_user(db):
    return Usuario.objects.create_user(
        username='paciente_eval',
        email='paciente_eval@test.local',
        password='Password123!',
        nombres='Paciente',
        apellidos='Eval',
        tipo_usuario=TipoUsuario.PACIENTE,
    )


@pytest.fixture
def paciente(db, paciente_user):
    return Paciente.objects.create(
        usuario=paciente_user,
        numero_historia='HC-CU12-001',
        tipo_documento='DNI',
        numero_documento='DOC-CU12-001',
        nombres='Paciente',
        apellidos='Eval',
        email='paciente_eval@test.local',
    )


@pytest.fixture
def paciente_otro(db):
    return Paciente.objects.create(
        numero_historia='HC-CU12-002',
        tipo_documento='DNI',
        numero_documento='DOC-CU12-002',
        nombres='Otro',
        apellidos='Paciente',
    )


@pytest.fixture
def historia(db, paciente):
    return HistoriaClinica.objects.create(
        id_paciente=paciente,
        motivo_apertura='Historia prueba CU12',
    )


@pytest.fixture
def consulta(db, paciente, medico):
    return Consulta.objects.create(
        paciente=paciente,
        especialista=medico,
        motivo='Motivo consulta CU12',
        sintomas='Sintomas',
    )


@pytest.mark.django_db
def test_paciente_no_puede_crear_evaluacion(api_client, paciente_user, paciente, historia, consulta):
    api_client.force_authenticate(user=paciente_user)
    payload = {
        'id_paciente': paciente.id_paciente,
        'id_historia_clinica': historia.id_historia_clinica,
        'id_consulta': consulta.id,
        'estado_prequirurgico': 'PENDIENTE',
    }
    response = api_client.post('/api/evaluaciones-quirurgicas/', payload, format='json')
    assert response.status_code == 403


@pytest.mark.django_db
def test_valida_historia_no_corresponde_paciente(api_client, medico, paciente, paciente_otro, consulta):
    historia_otro = HistoriaClinica.objects.create(
        id_paciente=paciente_otro,
        motivo_apertura='Historia paciente otro',
    )
    api_client.force_authenticate(user=medico)
    payload = {
        'id_paciente': paciente.id_paciente,
        'id_historia_clinica': historia_otro.id_historia_clinica,
        'id_consulta': consulta.id,
        'estado_prequirurgico': 'PENDIENTE',
    }
    response = api_client.post('/api/evaluaciones-quirurgicas/', payload, format='json')
    assert response.status_code == 400
    assert 'id_historia_clinica' in response.data


@pytest.mark.django_db
def test_crud_base_medico_y_bitacora(api_client, medico, paciente, historia, consulta):
    api_client.force_authenticate(user=medico)
    payload = {
        'id_paciente': paciente.id_paciente,
        'id_historia_clinica': historia.id_historia_clinica,
        'id_consulta': consulta.id,
        'estado_prequirurgico': 'APTO_CON_OBSERVACIONES',
        'riesgo_quirurgico': 'Moderado',
        'hallazgos': 'Hallazgos base',
        'plan_quirurgico': 'Plan base',
    }

    create_response = api_client.post('/api/evaluaciones-quirurgicas/', payload, format='json')
    assert create_response.status_code == 201
    object_id = create_response.data['id_evaluacion_quirurgica']

    list_response = api_client.get('/api/evaluaciones-quirurgicas/')
    assert list_response.status_code == 200
    assert list_response.data['count'] >= 1

    patch_response = api_client.patch(
        f'/api/evaluaciones-quirurgicas/{object_id}/',
        {'estado_prequirurgico': 'APTO'},
        format='json',
    )
    assert patch_response.status_code == 200
    assert patch_response.data['estado_prequirurgico'] == 'APTO'

    delete_response = api_client.delete(f'/api/evaluaciones-quirurgicas/{object_id}/')
    assert delete_response.status_code == 204

    assert not EvaluacionQuirurgica.objects.filter(pk=object_id).exists()
    assert Bitacora.objects.filter(modulo='evaluacion_quirurgica').count() >= 3


@pytest.mark.django_db
def test_admin_puede_listar(api_client, admin, medico, paciente, historia, consulta):
    EvaluacionQuirurgica.objects.create(
        id_paciente=paciente,
        id_historia_clinica=historia,
        id_consulta=consulta,
        evaluado_por=medico,
        estado_prequirurgico='PENDIENTE',
    )

    api_client.force_authenticate(user=admin)
    response = api_client.get('/api/evaluaciones-quirurgicas/')
    assert response.status_code == 200
    assert response.data['count'] >= 1

