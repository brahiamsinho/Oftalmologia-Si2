import pytest
from rest_framework.test import APIClient

from apps.InteligenciaArtificial.models import (
    EstadoRespuestaAsistente,
    InteraccionAsistenteVirtual,
    IntencionAsistente,
    NivelPrioridadUrgencia,
)
from apps.bitacora.models import Bitacora
from apps.usuarios.users.models import TipoUsuario, Usuario


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def paciente_user(db):
    return Usuario.objects.create_user(
        username='paciente_ia',
        email='paciente_ia@test.local',
        password='Password123!',
        nombres='Paciente',
        apellidos='IA',
        tipo_usuario=TipoUsuario.PACIENTE,
    )


@pytest.fixture
def medico_user(db):
    return Usuario.objects.create_user(
        username='medico_ia',
        email='medico_ia@test.local',
        password='Password123!',
        nombres='Medico',
        apellidos='IA',
        tipo_usuario=TipoUsuario.MEDICO,
    )


@pytest.mark.django_db
def test_paciente_puede_consultar_asistente_y_registra_bitacora(api_client, paciente_user):
    api_client.force_authenticate(user=paciente_user)
    response = api_client.post(
        '/api/inteligencia-artificial/asistente-virtual/',
        {'mensaje': 'Necesito saber el horario para agendar una cita'},
        format='json',
    )

    assert response.status_code == 201
    assert response.data['intencion'] == IntencionAsistente.CITAS_HORARIOS
    assert response.data['estado'] == EstadoRespuestaAsistente.RESPONDIDA
    assert response.data['requiere_clasificacion_urgencia'] is False
    assert InteraccionAsistenteVirtual.objects.filter(id_usuario=paciente_user).count() == 1
    assert Bitacora.objects.filter(modulo='inteligencia_artificial').count() == 1


@pytest.mark.django_db
def test_consulta_con_sintomas_activa_cu24(api_client, paciente_user):
    api_client.force_authenticate(user=paciente_user)
    response = api_client.post(
        '/api/inteligencia-artificial/asistente-virtual/',
        {'mensaje': 'Tengo perdida subita de vision y dolor intenso'},
        format='json',
    )

    assert response.status_code == 201
    assert response.data['intencion'] == IntencionAsistente.URGENCIA
    assert response.data['estado'] == EstadoRespuestaAsistente.REQUIERE_CU24
    assert response.data['requiere_clasificacion_urgencia'] is True
    assert response.data['nivel_prioridad'] == NivelPrioridadUrgencia.ALTA
    assert response.data['metadata']['cu24_activado'] is True


@pytest.mark.django_db
def test_solo_paciente_puede_usar_endpoint_cu23(api_client, medico_user):
    api_client.force_authenticate(user=medico_user)
    response = api_client.post(
        '/api/inteligencia-artificial/asistente-virtual/',
        {'mensaje': 'Quiero consultar horarios'},
        format='json',
    )

    assert response.status_code == 403


@pytest.mark.django_db
def test_listado_solo_devuelve_interacciones_del_paciente(api_client, paciente_user):
    otro = Usuario.objects.create_user(
        username='otro_paciente_ia',
        email='otro_paciente_ia@test.local',
        password='Password123!',
        nombres='Otro',
        apellidos='Paciente',
        tipo_usuario=TipoUsuario.PACIENTE,
    )
    InteraccionAsistenteVirtual.objects.create(
        id_usuario=paciente_user,
        mensaje='Quiero una cita',
        respuesta='Respuesta',
        intencion=IntencionAsistente.CITAS_HORARIOS,
    )
    InteraccionAsistenteVirtual.objects.create(
        id_usuario=otro,
        mensaje='Quiero una factura',
        respuesta='Respuesta',
        intencion=IntencionAsistente.SEGUROS_FACTURACION,
    )

    api_client.force_authenticate(user=paciente_user)
    response = api_client.get('/api/inteligencia-artificial/interacciones-asistente/')

    assert response.status_code == 200
    assert response.data['count'] == 1
    assert response.data['results'][0]['id_usuario'] == paciente_user.id
