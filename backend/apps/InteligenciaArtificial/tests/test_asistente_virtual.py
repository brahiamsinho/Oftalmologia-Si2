import uuid

import pytest
from rest_framework.test import APIClient

from apps.InteligenciaArtificial.models import (
    EstadoRespuestaAsistente,
    CriticalHumanHandoff,
    InteraccionAsistenteVirtual,
    IntencionAsistente,
    NivelPrioridadUrgencia,
)
from apps.InteligenciaArtificial.services.asistente_virtual import AsistenteVirtualService
from apps.bitacora.models import Bitacora
from apps.pacientes.pacientes.models import Paciente
from apps.ia.services.chatbot import GeminiChatbotError
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


@pytest.fixture
def paciente(db, paciente_user):
    return Paciente.objects.create(
        usuario=paciente_user,
        numero_historia='HC-IA-001',
        tipo_documento='DNI',
        numero_documento='DOC-IA-001',
        nombres='Paciente',
        apellidos='IA',
        email='paciente_ia@test.local',
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
def test_consulta_con_sintomas_activa_cu24(api_client, paciente_user, paciente):
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
    assert response.data['clasificacion_urgencia']['critical_handoff_id'] is not None
    assert response.data['clasificacion_urgencia']['critical_handoff_state'] == 'PENDIENTE'

    handoff = CriticalHumanHandoff.objects.get(classification__mensaje_usuario='Tengo perdida subita de vision y dolor intenso')
    assert handoff.paciente_id == paciente.id_paciente


@pytest.mark.django_db
def test_consulta_no_urgente_reformula_con_gemini(monkeypatch):
    monkeypatch.setenv('GEMINI_API_KEY', 'test-key')
    captured = {}

    def fake_generate_reply(self, *, message, history):
        captured['message'] = message
        captured['history'] = history
        return {'reply': 'Podemos orientarte sobre horarios para agendar una cita.', 'model': 'gemini-2.5-flash'}

    monkeypatch.setattr(
        'apps.InteligenciaArtificial.services.asistente_virtual.GeminiChatbotAssistant.generate_reply',
        fake_generate_reply,
    )

    result = AsistenteVirtualService.responder(
        'Necesito saber el horario para agendar una cita',
        history=[
            {'role': 'user', 'content': 'Hola'},
            {'role': 'assistant', 'content': 'Hola, en que te ayudo?'},
        ],
    )

    assert result.intencion == IntencionAsistente.CITAS_HORARIOS
    assert result.estado == EstadoRespuestaAsistente.RESPONDIDA
    assert result.respuesta == 'Podemos orientarte sobre horarios para agendar una cita.'
    assert result.metadata['gemini_usado'] is True
    assert result.metadata['gemini_modelo'] == 'gemini-2.5-flash'
    assert result.metadata['historial_utilizado'] == 2
    assert 'Respuesta base segura' in captured['message']
    assert captured['history'][0]['content'] == 'Hola'


@pytest.mark.django_db
def test_consulta_no_urgente_falla_sin_romper_respuesta_base(monkeypatch):
    monkeypatch.setenv('GEMINI_API_KEY', 'test-key')

    def fake_generate_reply(self, *, message, history):
        raise GeminiChatbotError('gemini caido')

    monkeypatch.setattr(
        'apps.InteligenciaArtificial.services.asistente_virtual.GeminiChatbotAssistant.generate_reply',
        fake_generate_reply,
    )

    result = AsistenteVirtualService.responder('Quiero consultar horarios de citas')

    assert result.intencion == IntencionAsistente.CITAS_HORARIOS
    assert result.estado == EstadoRespuestaAsistente.RESPONDIDA
    assert 'Puedo orientarte sobre citas y horarios' in result.respuesta
    assert result.metadata['gemini_usado'] is False
    assert result.metadata['gemini_error'] == 'gemini caido'


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


@pytest.mark.django_db
def test_post_reutiliza_historial_de_conversacion(api_client, paciente_user, monkeypatch):
    monkeypatch.setenv('GEMINI_API_KEY', 'test-key')
    conversation_id = uuid.uuid4()
    InteraccionAsistenteVirtual.objects.create(
        id_usuario=paciente_user,
        id_conversacion=conversation_id,
        mensaje='Hola',
        respuesta='Hola, te ayudo con tu consulta.',
        intencion=IntencionAsistente.SALUDO,
    )

    captured = {}

    def fake_generate_reply(self, *, message, history):
        captured['history'] = history
        return {'reply': 'Podemos orientarte sobre horarios para agendar una cita.', 'model': 'gemini-2.5-flash'}

    monkeypatch.setattr(
        'apps.InteligenciaArtificial.services.asistente_virtual.GeminiChatbotAssistant.generate_reply',
        fake_generate_reply,
    )

    api_client.force_authenticate(user=paciente_user)
    response = api_client.post(
        '/api/inteligencia-artificial/asistente-virtual/',
        {
            'mensaje': 'Necesito saber horarios para una cita',
            'id_conversacion': str(conversation_id),
        },
        format='json',
    )

    assert response.status_code == 201
    assert response.data['metadata']['historial_utilizado'] == 2
    assert captured['history'][0]['role'] == 'user'
    assert captured['history'][0]['content'] == 'Hola'
    assert captured['history'][1]['role'] == 'assistant'
    assert captured['history'][1]['content'] == 'Hola, te ayudo con tu consulta.'
