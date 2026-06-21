from unittest.mock import patch

import pytest
from django_tenants.utils import get_public_schema_name, schema_context
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.bitacora.models import AccionBitacora, Bitacora
from apps.crm.notificaciones.models import Notificacion
from apps.tenant.models import Domain, Tenant
from apps.ia.views import ChatbotMessageView
from apps.usuarios.users.models import TipoUsuario, Usuario


@pytest.fixture
def api_factory():
    return APIRequestFactory()


@pytest.fixture
def tenant(db):
    with schema_context(get_public_schema_name()):
        tenant = Tenant.objects.create(
            schema_name='tenant_ia_derivation',
            slug='tenant-ia-derivation',
            nombre='Tenant IA Derivation',
            activo=True,
        )
        Domain.objects.create(tenant=tenant, domain='tenant-ia-derivation.localhost', is_primary=True)
        return tenant


@pytest.fixture
def medico_solicitante(db, tenant):
    with schema_context(tenant.schema_name):
        return Usuario.objects.create_user(
            username='med-solicitante',
            email='med-solicitante@test.local',
            password='Password123!',
            nombres='Médico',
            apellidos='Solicitante',
            tipo_usuario=TipoUsuario.MEDICO,
            estado='ACTIVO',
            is_active=True,
        )


@pytest.fixture
def staff_destinatarios(db, tenant):
    with schema_context(tenant.schema_name):
        return [
            Usuario.objects.create_user(
                username='adm-deriva',
                email='adm-deriva@test.local',
                password='Password123!',
                nombres='Admin',
                apellidos='Deriva',
                tipo_usuario=TipoUsuario.ADMINISTRATIVO,
                estado='ACTIVO',
                is_active=True,
            ),
            Usuario.objects.create_user(
                username='esp-deriva',
                email='esp-deriva@test.local',
                password='Password123!',
                nombres='Especialista',
                apellidos='Deriva',
                tipo_usuario=TipoUsuario.ESPECIALISTA,
                estado='ACTIVO',
                is_active=True,
            ),
            Usuario.objects.create_user(
                username='admin-sistema',
                email='admin-sistema@test.local',
                password='Password123!',
                nombres='Admin',
                apellidos='Sistema',
                tipo_usuario=TipoUsuario.ADMIN,
                estado='ACTIVO',
                is_active=True,
            ),
        ]


@pytest.mark.django_db
def test_chatbot_deriva_caso_urgente_a_staff(api_factory, medico_solicitante, staff_destinatarios, tenant):
    request = api_factory.post(
        '/api/ia/chatbot/',
        {
            'message': 'Tengo dolor ocular intenso y pérdida súbita de visión.',
            'history': [],
        },
        format='json',
    )
    force_authenticate(request, user=medico_solicitante)

    with schema_context(tenant.schema_name), patch(
        'apps.ia.views.GeminiChatbotAssistant.generate_reply',
        return_value={'reply': 'Debe acudir a urgencias de inmediato.', 'model': 'gemini-2.5-flash'},
    ):
        response = ChatbotMessageView.as_view()(request)

    assert response.status_code == 200
    assert response.data['derivacion']['derivada'] is True
    assert response.data['derivacion']['es_urgente'] is True
    assert response.data['derivacion']['destinatarios'] == len(staff_destinatarios)
    assert response.data['derivacion']['tipo_notificacion'] == 'derivacion_urgente'

    with schema_context(tenant.schema_name):
        assert Notificacion.objects.filter(tipo='derivacion_urgente').count() == len(staff_destinatarios)
        assert Bitacora.objects.filter(modulo='ia', accion=AccionBitacora.DERIVAR).exists()


@pytest.mark.django_db
def test_chatbot_no_deriva_mensaje_no_critico(api_factory, medico_solicitante, tenant):
    request = api_factory.post(
        '/api/ia/chatbot/',
        {
            'message': 'Necesito consultar el horario de atención de mañana.',
            'history': [],
        },
        format='json',
    )
    force_authenticate(request, user=medico_solicitante)

    with schema_context(tenant.schema_name), patch(
        'apps.ia.views.GeminiChatbotAssistant.generate_reply',
        return_value={'reply': 'Puedo ayudarte con la agenda o la cobertura.', 'model': 'gemini-2.5-flash'},
    ):
        response = ChatbotMessageView.as_view()(request)

    assert response.status_code == 200
    assert response.data['derivacion']['derivada'] is False
    assert response.data['derivacion']['destinatarios'] == 0
    with schema_context(tenant.schema_name):
        assert Notificacion.objects.count() == 0
        assert not Bitacora.objects.filter(modulo='ia', accion=AccionBitacora.DERIVAR).exists()
