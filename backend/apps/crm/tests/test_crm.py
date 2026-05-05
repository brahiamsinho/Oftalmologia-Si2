from datetime import date, timedelta

import pytest
from rest_framework.test import APIClient

from apps.bitacora.models import Bitacora
from apps.crm.models import CampanaCRM, HistorialContacto, SegmentacionPaciente
from apps.pacientes.pacientes.models import Paciente
from apps.usuarios.users.models import TipoUsuario, Usuario
from apps.tenant.models import Tenant


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def tenant_uno(db):
    return Tenant.objects.create(slug='tenant-crm-uno', nombre='Tenant CRM Uno', activo=True)


@pytest.fixture
def tenant_dos(db):
    return Tenant.objects.create(slug='tenant-crm-dos', nombre='Tenant CRM Dos', activo=True)


@pytest.fixture
def admin(db, tenant_uno):
    return Usuario.objects.create_user(
        username='admin_crm',
        email='admin_crm@test.local',
        password='Password123!',
        nombres='Admin',
        apellidos='CRM',
        tipo_usuario=TipoUsuario.ADMIN,
        tenant=tenant_uno,
    )


@pytest.fixture
def administrativo(db, tenant_uno):
    return Usuario.objects.create_user(
        username='admvo_crm',
        email='admvo_crm@test.local',
        password='Password123!',
        nombres='Admvo',
        apellidos='CRM',
        tipo_usuario=TipoUsuario.ADMINISTRATIVO,
        tenant=tenant_uno,
    )


@pytest.fixture
def paciente_user(db, tenant_uno):
    return Usuario.objects.create_user(
        username='paciente_crm',
        email='paciente_crm@test.local',
        password='Password123!',
        nombres='Paciente',
        apellidos='CRM',
        tipo_usuario=TipoUsuario.PACIENTE,
        tenant=tenant_uno,
    )


@pytest.fixture
def paciente(db, paciente_user, tenant_uno):
    return Paciente.objects.create(
        tenant=tenant_uno,
        usuario=paciente_user,
        numero_historia='HC-CRM-001',
        tipo_documento='DNI',
        numero_documento='DOC-CRM-001',
        nombres='Paciente',
        apellidos='CRM',
    )


@pytest.mark.django_db
def test_paciente_no_puede_crear_segmentacion(api_client, paciente_user, tenant_uno):
    api_client.force_authenticate(user=paciente_user)
    response = api_client.post(
        '/api/crm-segmentaciones/',
        {'nombre': 'Seguimiento cataratas', 'descripcion': 'Casos para contacto'},
        format='json',
        HTTP_X_TENANT_SLUG=tenant_uno.slug,
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_valida_fecha_fin_campana(api_client, administrativo, tenant_uno):
    segmentacion = SegmentacionPaciente.objects.create(tenant=tenant_uno, nombre='Segmento base')
    api_client.force_authenticate(user=administrativo)
    payload = {
        'nombre': 'Campana invalida',
        'id_segmentacion': segmentacion.id_segmentacion,
        'estado': 'ACTIVA',
        'fecha_inicio': date.today(),
        'fecha_fin': date.today() - timedelta(days=1),
    }
    response = api_client.post('/api/crm-campanas/', payload, format='json', HTTP_X_TENANT_SLUG=tenant_uno.slug)
    assert response.status_code == 400
    assert 'fecha_fin' in response.data


@pytest.mark.django_db
def test_crud_basico_crm_y_bitacora(api_client, administrativo, paciente, tenant_uno):
    api_client.force_authenticate(user=administrativo)

    create_segmentacion = api_client.post(
        '/api/crm-segmentaciones/',
        {'nombre': 'Pacientes post-op', 'descripcion': 'Seguimiento a 7 dias'},
        format='json',
        HTTP_X_TENANT_SLUG=tenant_uno.slug,
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
        HTTP_X_TENANT_SLUG=tenant_uno.slug,
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
        HTTP_X_TENANT_SLUG=tenant_uno.slug,
    )
    assert create_contacto.status_code == 201
    contacto_id = create_contacto.data['id_historial_contacto']

    patch_campana = api_client.patch(
        f'/api/crm-campanas/{campana_id}/',
        {'estado': 'PAUSADA'},
        format='json',
        HTTP_X_TENANT_SLUG=tenant_uno.slug,
    )
    assert patch_campana.status_code == 200
    assert patch_campana.data['estado'] == 'PAUSADA'

    delete_contacto = api_client.delete(f'/api/crm-contactos/{contacto_id}/', HTTP_X_TENANT_SLUG=tenant_uno.slug)
    assert delete_contacto.status_code == 204

    assert SegmentacionPaciente.objects.filter(id_segmentacion=segmentacion_id).exists()
    assert CampanaCRM.objects.filter(id_campana=campana_id).exists()
    assert not HistorialContacto.objects.filter(id_historial_contacto=contacto_id).exists()
    assert Bitacora.objects.filter(modulo='crm').count() >= 5


@pytest.mark.django_db
def test_admin_puede_listar_contactos(api_client, admin, paciente, tenant_uno):
    segmentacion = SegmentacionPaciente.objects.create(tenant=tenant_uno, nombre='Segmento listar')
    campana = CampanaCRM.objects.create(
        tenant=tenant_uno,
        nombre='Campana listar',
        id_segmentacion=segmentacion,
        estado='ACTIVA',
        fecha_inicio=date.today(),
    )
    HistorialContacto.objects.create(
        tenant=tenant_uno,
        id_paciente=paciente,
        id_campana=campana,
        canal='LLAMADA',
        resultado='Sin respuesta',
    )

    api_client.force_authenticate(user=admin)
    response = api_client.get('/api/crm-contactos/', HTTP_X_TENANT_SLUG=tenant_uno.slug)
    assert response.status_code == 200
    assert response.data['count'] >= 1


@pytest.mark.django_db
def test_aislamiento_cross_tenant_segmentacion(api_client, admin, tenant_uno, tenant_dos):
    segmentacion_tenant_dos = SegmentacionPaciente.objects.create(tenant=tenant_dos, nombre='Segmento ajeno')

    api_client.force_authenticate(user=admin)
    list_response = api_client.get('/api/crm-segmentaciones/', HTTP_X_TENANT_SLUG=tenant_uno.slug)
    assert list_response.status_code == 200
    resultados = list_response.data.get('results', list_response.data) if isinstance(list_response.data, dict) else list_response.data
    assert all(item['id_segmentacion'] != segmentacion_tenant_dos.id_segmentacion for item in resultados)

    retrieve_response = api_client.get(
        f'/api/crm-segmentaciones/{segmentacion_tenant_dos.id_segmentacion}/',
        HTTP_X_TENANT_SLUG=tenant_uno.slug,
    )
    assert retrieve_response.status_code == 404
