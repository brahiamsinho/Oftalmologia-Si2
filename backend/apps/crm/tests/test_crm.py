from datetime import date, timedelta

import pytest
from rest_framework.test import APIClient

from apps.bitacora.models import Bitacora
from apps.crm.models import CampanaCRM, HistorialContacto, SegmentacionPaciente
from apps.pacientes.pacientes.models import Paciente
from apps.usuarios.users.models import TipoUsuario, Usuario


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin(db):
    return Usuario.objects.create_user(
        username='admin_crm',
        email='admin_crm@test.local',
        password='Password123!',
        nombres='Admin',
        apellidos='CRM',
        tipo_usuario=TipoUsuario.ADMIN,
    )


@pytest.fixture
def administrativo(db):
    return Usuario.objects.create_user(
        username='admvo_crm',
        email='admvo_crm@test.local',
        password='Password123!',
        nombres='Admvo',
        apellidos='CRM',
        tipo_usuario=TipoUsuario.ADMINISTRATIVO,
    )


@pytest.fixture
def paciente_user(db):
    return Usuario.objects.create_user(
        username='paciente_crm',
        email='paciente_crm@test.local',
        password='Password123!',
        nombres='Paciente',
        apellidos='CRM',
        tipo_usuario=TipoUsuario.PACIENTE,
    )


@pytest.fixture
def paciente(db, paciente_user):
    return Paciente.objects.create(
        usuario=paciente_user,
        numero_historia='HC-CRM-001',
        tipo_documento='DNI',
        numero_documento='DOC-CRM-001',
        nombres='Paciente',
        apellidos='CRM',
    )


@pytest.mark.django_db
def test_paciente_no_puede_crear_segmentacion(api_client, paciente_user):
    api_client.force_authenticate(user=paciente_user)
    response = api_client.post(
        '/api/crm-segmentaciones/',
        {'nombre': 'Seguimiento cataratas', 'descripcion': 'Casos para contacto'},
        format='json',
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_valida_fecha_fin_campana(api_client, administrativo):
    segmentacion = SegmentacionPaciente.objects.create(nombre='Segmento base')
    api_client.force_authenticate(user=administrativo)
    payload = {
        'nombre': 'Campana invalida',
        'id_segmentacion': segmentacion.id_segmentacion,
        'estado': 'ACTIVA',
        'fecha_inicio': date.today(),
        'fecha_fin': date.today() - timedelta(days=1),
    }
    response = api_client.post('/api/crm-campanas/', payload, format='json')
    assert response.status_code == 400
    assert 'fecha_fin' in response.data


@pytest.mark.django_db
def test_crud_basico_crm_y_bitacora(api_client, administrativo, paciente):
    api_client.force_authenticate(user=administrativo)

    create_segmentacion = api_client.post(
        '/api/crm-segmentaciones/',
        {'nombre': 'Pacientes post-op', 'descripcion': 'Seguimiento a 7 dias'},
        format='json',
    )
    assert create_segmentacion.status_code == 201
    segmentacion_id = create_segmentacion.data['id_segmentacion']

    create_campana = api_client.post(
        '/api/crm-campanas/',
        {
            'nombre': 'Recordatorio control',
            'id_segmentacion': segmentacion_id,
            'estado': 'ACTIVA',
            'fecha_inicio': date.today(),
        },
        format='json',
    )
    assert create_campana.status_code == 201
    campana_id = create_campana.data['id_campana']

    create_contacto = api_client.post(
        '/api/crm-contactos/',
        {
            'id_paciente': paciente.id_paciente,
            'id_campana': campana_id,
            'canal': 'WHATSAPP',
            'resultado': 'Confirmo asistencia',
        },
        format='json',
    )
    assert create_contacto.status_code == 201
    contacto_id = create_contacto.data['id_historial_contacto']

    patch_campana = api_client.patch(
        f'/api/crm-campanas/{campana_id}/',
        {'estado': 'PAUSADA'},
        format='json',
    )
    assert patch_campana.status_code == 200
    assert patch_campana.data['estado'] == 'PAUSADA'

    delete_contacto = api_client.delete(f'/api/crm-contactos/{contacto_id}/')
    assert delete_contacto.status_code == 204

    assert SegmentacionPaciente.objects.filter(id_segmentacion=segmentacion_id).exists()
    assert CampanaCRM.objects.filter(id_campana=campana_id).exists()
    assert not HistorialContacto.objects.filter(id_historial_contacto=contacto_id).exists()
    assert Bitacora.objects.filter(modulo='crm').count() >= 5


@pytest.mark.django_db
def test_admin_puede_listar_contactos(api_client, admin, paciente):
    segmentacion = SegmentacionPaciente.objects.create(nombre='Segmento listar')
    campana = CampanaCRM.objects.create(
        nombre='Campana listar',
        id_segmentacion=segmentacion,
        estado='ACTIVA',
        fecha_inicio=date.today(),
    )
    HistorialContacto.objects.create(
        id_paciente=paciente,
        id_campana=campana,
        canal='LLAMADA',
        resultado='Sin respuesta',
    )

    api_client.force_authenticate(user=admin)
    response = api_client.get('/api/crm-contactos/')
    assert response.status_code == 200
    assert response.data['count'] >= 1
