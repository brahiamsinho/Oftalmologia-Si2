from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.atencionClinica.cirugias.models import Cirugia
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
        username='medico_cx',
        email='medico_cx@test.local',
        password='Password123!',
        nombres='Medico',
        apellidos='Cx',
        tipo_usuario=TipoUsuario.MEDICO,
    )


@pytest.fixture
def admin(db):
    return Usuario.objects.create_user(
        username='admin_cx',
        email='admin_cx@test.local',
        password='Password123!',
        nombres='Admin',
        apellidos='Cx',
        tipo_usuario=TipoUsuario.ADMIN,
    )


@pytest.fixture
def paciente_user(db):
    return Usuario.objects.create_user(
        username='paciente_cx',
        email='paciente_cx@test.local',
        password='Password123!',
        nombres='Paciente',
        apellidos='Cx',
        tipo_usuario=TipoUsuario.PACIENTE,
    )


@pytest.fixture
def paciente(db, paciente_user):
    return Paciente.objects.create(
        usuario=paciente_user,
        numero_historia='HC-CU14-001',
        tipo_documento='DNI',
        numero_documento='DOC-CU14-001',
        nombres='Paciente',
        apellidos='Cirugia',
    )


@pytest.fixture
def otro_paciente(db):
    return Paciente.objects.create(
        numero_historia='HC-CU14-002',
        tipo_documento='DNI',
        numero_documento='DOC-CU14-002',
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
        motivo='Consulta base CU14',
    )


@pytest.fixture
def preoperatorio(db, paciente, historia):
    return Preoperatorio.objects.create(
        id_paciente=paciente,
        id_historia_clinica=historia,
        estado_preoperatorio='APROBADO',
        checklist_completado=True,
        apto_anestesia=True,
    )


@pytest.mark.django_db
def test_paciente_no_puede_crear_cirugia(api_client, paciente_user, paciente, historia):
    api_client.force_authenticate(user=paciente_user)
    payload = {
        'id_paciente': paciente.id_paciente,
        'id_historia_clinica': historia.id_historia_clinica,
        'fecha_programada': timezone.now().isoformat(),
        'procedimiento': 'Facoemulsificacion',
    }
    response = api_client.post('/api/cirugias/', payload, format='json')
    assert response.status_code == 403


@pytest.mark.django_db
def test_validacion_preoperatorio_debe_corresponder_a_paciente(
    api_client, medico, paciente, otro_paciente, historia
):
    preoperatorio_otro = Preoperatorio.objects.create(
        id_paciente=otro_paciente,
        id_historia_clinica=HistoriaClinica.objects.create(id_paciente=otro_paciente),
    )
    api_client.force_authenticate(user=medico)
    payload = {
        'id_paciente': paciente.id_paciente,
        'id_historia_clinica': historia.id_historia_clinica,
        'id_preoperatorio': preoperatorio_otro.id_preoperatorio,
        'fecha_programada': timezone.now().isoformat(),
        'procedimiento': 'Facoemulsificacion',
    }
    response = api_client.post('/api/cirugias/', payload, format='json')
    assert response.status_code == 400
    assert 'id_preoperatorio' in response.data


@pytest.mark.django_db
def test_finalizada_exige_fechas_reales(api_client, medico, paciente, historia, preoperatorio):
    api_client.force_authenticate(user=medico)
    payload = {
        'id_paciente': paciente.id_paciente,
        'id_historia_clinica': historia.id_historia_clinica,
        'id_preoperatorio': preoperatorio.id_preoperatorio,
        'estado_cirugia': 'FINALIZADA',
        'fecha_programada': timezone.now().isoformat(),
        'procedimiento': 'Facoemulsificacion',
    }
    response = api_client.post('/api/cirugias/', payload, format='json')
    assert response.status_code == 400
    assert 'estado_cirugia' in response.data


@pytest.mark.django_db
def test_crud_base_y_reprogramacion(api_client, medico, paciente, historia, preoperatorio):
    api_client.force_authenticate(user=medico)
    payload = {
        'id_paciente': paciente.id_paciente,
        'id_historia_clinica': historia.id_historia_clinica,
        'id_preoperatorio': preoperatorio.id_preoperatorio,
        'fecha_programada': timezone.now().isoformat(),
        'procedimiento': 'Facoemulsificacion',
    }
    create_response = api_client.post('/api/cirugias/', payload, format='json')
    assert create_response.status_code == 201
    object_id = create_response.data['id_cirugia']

    reprog_response = api_client.post(
        f'/api/cirugias/{object_id}/reprogramar/',
        {
            'fecha_programada': (timezone.now() + timedelta(days=3)).isoformat(),
            'motivo_reprogramacion': 'Ajuste de agenda',
        },
        format='json',
    )
    assert reprog_response.status_code == 200
    assert reprog_response.data['estado_cirugia'] == 'REPROGRAMADA'

    delete_response = api_client.delete(f'/api/cirugias/{object_id}/')
    assert delete_response.status_code == 204
    assert not Cirugia.objects.filter(pk=object_id).exists()
    assert Bitacora.objects.filter(modulo='cirugias').count() >= 3


@pytest.mark.django_db
def test_admin_puede_listar(api_client, admin, medico, paciente, historia, preoperatorio):
    Cirugia.objects.create(
        id_paciente=paciente,
        id_historia_clinica=historia,
        id_preoperatorio=preoperatorio,
        cirujano=medico,
        fecha_programada=timezone.now(),
        procedimiento='Facoemulsificacion',
    )
    api_client.force_authenticate(user=admin)
    response = api_client.get('/api/cirugias/')
    assert response.status_code == 200
    assert response.data['count'] >= 1

