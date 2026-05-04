import pytest
from rest_framework.test import APIClient

from apps.atencionClinica.consultas.models import Consulta
from apps.atencionClinica.evaluacion_quirurgica.models import EvaluacionQuirurgica
from apps.atencionClinica.preoperatorio.models import Preoperatorio
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
        username='medico_preop',
        email='medico_preop@test.local',
        password='Password123!',
        nombres='Medico',
        apellidos='Preop',
        tipo_usuario=TipoUsuario.MEDICO,
    )


@pytest.fixture
def admin(db):
    return Usuario.objects.create_user(
        username='admin_preop',
        email='admin_preop@test.local',
        password='Password123!',
        nombres='Admin',
        apellidos='Preop',
        tipo_usuario=TipoUsuario.ADMIN,
    )


@pytest.fixture
def paciente_user(db):
    return Usuario.objects.create_user(
        username='paciente_preop',
        email='paciente_preop@test.local',
        password='Password123!',
        nombres='Paciente',
        apellidos='Preop',
        tipo_usuario=TipoUsuario.PACIENTE,
    )


@pytest.fixture
def paciente(db, paciente_user):
    return Paciente.objects.create(
        usuario=paciente_user,
        numero_historia='HC-CU13-001',
        tipo_documento='DNI',
        numero_documento='DOC-CU13-001',
        nombres='Paciente',
        apellidos='Preop',
    )


@pytest.fixture
def otro_paciente(db):
    return Paciente.objects.create(
        numero_historia='HC-CU13-002',
        tipo_documento='DNI',
        numero_documento='DOC-CU13-002',
        nombres='Otro',
        apellidos='Paciente',
    )


@pytest.fixture
def historia(db, paciente):
    return HistoriaClinica.objects.create(id_paciente=paciente)


@pytest.fixture
def consulta(db, paciente, medico):
    return Consulta.objects.create(
        paciente=paciente,
        especialista=medico,
        motivo='Consulta base CU13',
    )


@pytest.fixture
def evaluacion(db, paciente, historia, consulta, medico):
    return EvaluacionQuirurgica.objects.create(
        id_paciente=paciente,
        id_historia_clinica=historia,
        id_consulta=consulta,
        evaluado_por=medico,
        estado_prequirurgico='APTO',
    )


@pytest.mark.django_db
def test_paciente_no_puede_crear_preoperatorio(api_client, paciente_user, paciente, historia):
    api_client.force_authenticate(user=paciente_user)
    payload = {
        'id_paciente': paciente.id_paciente,
        'id_historia_clinica': historia.id_historia_clinica,
        'estado_preoperatorio': 'PENDIENTE',
    }
    response = api_client.post('/api/preoperatorios/', payload, format='json')
    assert response.status_code == 403


@pytest.mark.django_db
def test_validacion_evaluacion_debe_corresponder_a_paciente(
    api_client, medico, paciente, otro_paciente, historia, consulta
):
    evaluacion_otro = EvaluacionQuirurgica.objects.create(
        id_paciente=otro_paciente,
        id_historia_clinica=HistoriaClinica.objects.create(id_paciente=otro_paciente),
        id_consulta=None,
        evaluado_por=medico,
    )
    api_client.force_authenticate(user=medico)
    payload = {
        'id_paciente': paciente.id_paciente,
        'id_historia_clinica': historia.id_historia_clinica,
        'id_consulta': consulta.id,
        'id_evaluacion_quirurgica': evaluacion_otro.id_evaluacion_quirurgica,
        'estado_preoperatorio': 'PENDIENTE',
    }
    response = api_client.post('/api/preoperatorios/', payload, format='json')
    assert response.status_code == 400
    assert 'id_evaluacion_quirurgica' in response.data


@pytest.mark.django_db
def test_validacion_estado_aprobado_exige_checklist_y_anestesia(
    api_client, medico, paciente, historia, evaluacion
):
    api_client.force_authenticate(user=medico)
    payload = {
        'id_paciente': paciente.id_paciente,
        'id_historia_clinica': historia.id_historia_clinica,
        'id_evaluacion_quirurgica': evaluacion.id_evaluacion_quirurgica,
        'estado_preoperatorio': 'APROBADO',
        'checklist_completado': False,
        'apto_anestesia': True,
    }
    response = api_client.post('/api/preoperatorios/', payload, format='json')
    assert response.status_code == 400
    assert 'estado_preoperatorio' in response.data


@pytest.mark.django_db
def test_crud_base_medico_y_bitacora(api_client, medico, paciente, historia, consulta, evaluacion):
    api_client.force_authenticate(user=medico)
    payload = {
        'id_paciente': paciente.id_paciente,
        'id_historia_clinica': historia.id_historia_clinica,
        'id_consulta': consulta.id,
        'id_evaluacion_quirurgica': evaluacion.id_evaluacion_quirurgica,
        'estado_preoperatorio': 'APROBADO',
        'checklist_completado': True,
        'apto_anestesia': True,
        'checklist_detalle': 'Checklist completo',
        'examenes_requeridos': 'Hemograma',
        'examenes_completados': 'Hemograma',
    }

    create_response = api_client.post('/api/preoperatorios/', payload, format='json')
    assert create_response.status_code == 201
    object_id = create_response.data['id_preoperatorio']

    patch_response = api_client.patch(
        f'/api/preoperatorios/{object_id}/',
        {'estado_preoperatorio': 'OBSERVADO', 'observaciones': 'Control en 48h'},
        format='json',
    )
    assert patch_response.status_code == 200
    assert patch_response.data['estado_preoperatorio'] == 'OBSERVADO'

    delete_response = api_client.delete(f'/api/preoperatorios/{object_id}/')
    assert delete_response.status_code == 204

    assert not Preoperatorio.objects.filter(pk=object_id).exists()
    assert Bitacora.objects.filter(modulo='preoperatorio').count() >= 3


@pytest.mark.django_db
def test_admin_puede_listar(api_client, admin, paciente, historia, evaluacion):
    Preoperatorio.objects.create(
        id_paciente=paciente,
        id_historia_clinica=historia,
        id_evaluacion_quirurgica=evaluacion,
        estado_preoperatorio='PENDIENTE',
    )
    api_client.force_authenticate(user=admin)
    response = api_client.get('/api/preoperatorios/')
    assert response.status_code == 200
    assert response.data['count'] >= 1

