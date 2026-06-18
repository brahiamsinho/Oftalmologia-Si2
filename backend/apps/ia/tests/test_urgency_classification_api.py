from uuid import uuid4

import pytest
from django_tenants.utils import get_public_schema_name, schema_context
from rest_framework.test import APIClient

from apps.bitacora.models import Bitacora
from apps.ia.models import (
    ChatbotUrgencyClassification,
    CriticalHumanHandoff,
    EstadoDerivacionChatbot,
    NivelUrgenciaChatbot,
)
from apps.pacientes.pacientes.models import Paciente
from apps.tenant.models import Domain, Tenant
from apps.usuarios.users.models import TipoUsuario, Usuario


URGENCY_PATH = '/api/ia/urgency-classification/'


def tenant_urgency_path(tenant):
    return f'/t/{tenant.slug}{URGENCY_PATH}'


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def tenant_cu24(db):
    suffix = uuid4().hex[:8]
    with schema_context(get_public_schema_name()):
        tenant = Tenant.objects.create(
            schema_name=f'tenant_cu24_{suffix}',
            slug=f'tenant_cu24_{suffix}',
            nombre='Tenant CU24',
            activo=True,
        )
        Domain.objects.create(
            tenant=tenant,
            domain=tenant.slug,
            is_primary=True,
        )
        return tenant


@pytest.fixture
def paciente_user(db, tenant_cu24):
    with schema_context(tenant_cu24.schema_name):
        return Usuario.objects.create_user(
            username='paciente_cu24',
            email='paciente_cu24@test.local',
            password='Password123!',
            nombres='Paciente',
            apellidos='CU24',
            tipo_usuario=TipoUsuario.PACIENTE,
        )


@pytest.fixture
def paciente(db, tenant_cu24, paciente_user):
    with schema_context(tenant_cu24.schema_name):
        return Paciente.objects.create(
            usuario=paciente_user,
            numero_historia='HC-CU24-001',
            tipo_documento='DNI',
            numero_documento='DOC-CU24-001',
            nombres='Paciente',
            apellidos='CU24',
            email='paciente_cu24@test.local',
        )


@pytest.fixture
def medico_user(db, tenant_cu24):
    with schema_context(tenant_cu24.schema_name):
        return Usuario.objects.create_user(
            username='medico_cu24',
            email='medico_cu24@test.local',
            password='Password123!',
            nombres='Medico',
            apellidos='CU24',
            tipo_usuario=TipoUsuario.MEDICO,
        )


@pytest.mark.django_db
def test_endpoint_paciente_clasifica_persiste_y_audita(
    api_client,
    tenant_cu24,
    paciente_user,
    paciente,
):
    api_client.force_authenticate(user=paciente_user)

    response = api_client.post(
        tenant_urgency_path(tenant_cu24),
        {'message': 'Tengo una cortina negra y no veo bien desde hace unos minutos'},
        format='json',
    )

    assert response.status_code == 201
    assert response.data['level'] == NivelUrgenciaChatbot.CRITICO
    assert response.data['requires_human_attention'] is True
    assert response.data['derivation_status'] == EstadoDerivacionChatbot.PENDIENTE
    assert response.data['handoff_status'] == EstadoDerivacionChatbot.PENDIENTE
    assert response.data['critical_handoff_id'] is not None
    assert response.data['critical_handoff_state'] == 'PENDIENTE'
    assert response.data['classification_id']

    with schema_context(tenant_cu24.schema_name):
        classification = ChatbotUrgencyClassification.objects.get(pk=response.data['classification_id'])
        handoff = CriticalHumanHandoff.objects.get(classification=classification)
        assert classification.paciente_id == paciente.pk
        assert classification.usuario_id == paciente_user.pk
        assert classification.nivel == NivelUrgenciaChatbot.CRITICO
        assert handoff.paciente_id == paciente.pk
        assert handoff.nivel_urgencia == NivelUrgenciaChatbot.CRITICO

        audit = Bitacora.objects.get(
            modulo='ia',
            tabla_afectada='ia_chatbot_urgency_classifications',
            id_registro_afectado=classification.pk,
        )
        assert 'cortina negra' not in (audit.descripcion or '').lower()


@pytest.mark.django_db
def test_endpoint_rechaza_usuario_no_paciente(api_client, tenant_cu24, medico_user):
    api_client.force_authenticate(user=medico_user)

    response = api_client.post(
        tenant_urgency_path(tenant_cu24),
        {'message': 'Tengo ojo rojo y dolor'},
        format='json',
    )

    assert response.status_code == 403


@pytest.mark.django_db
def test_endpoint_error_controlado_si_paciente_sin_ficha(api_client, tenant_cu24, paciente_user):
    api_client.force_authenticate(user=paciente_user)

    response = api_client.post(
        tenant_urgency_path(tenant_cu24),
        {'message': 'Tengo ojo rojo y dolor'},
        format='json',
    )

    assert response.status_code == 400
    assert 'ficha de paciente' in response.data['detail']


@pytest.mark.django_db
def test_endpoint_no_acepta_mensaje_vacio(api_client, tenant_cu24, paciente_user, paciente):
    api_client.force_authenticate(user=paciente_user)

    response = api_client.post(
        tenant_urgency_path(tenant_cu24),
        {'message': '   '},
        format='json',
    )

    assert response.status_code == 400
    assert 'message' in response.data


@pytest.mark.django_db
def test_endpoint_rechaza_campos_spoofing(api_client, tenant_cu24, paciente_user, paciente):
    api_client.force_authenticate(user=paciente_user)

    response = api_client.post(
        tenant_urgency_path(tenant_cu24),
        {
            'message': 'Tengo sequedad ocular leve',
            'paciente_id': 999,
            'nivel': NivelUrgenciaChatbot.CRITICO,
        },
        format='json',
    )

    assert response.status_code == 400
    assert 'Campos no permitidos' in str(response.data)


@pytest.mark.django_db
def test_endpoint_persiste_solo_en_schema_tenant_canonical(
    api_client,
    tenant_cu24,
    paciente_user,
    paciente,
):
    suffix = uuid4().hex[:8]
    with schema_context(get_public_schema_name()):
        other_tenant = Tenant.objects.create(
            schema_name=f'tenant_cu24_other_{suffix}',
            slug=f'tenant_cu24_other_{suffix}',
            nombre='Tenant CU24 Other',
            activo=True,
        )
        Domain.objects.create(
            tenant=other_tenant,
            domain=other_tenant.slug,
            is_primary=True,
        )

    api_client.force_authenticate(user=paciente_user)
    response = api_client.post(
        tenant_urgency_path(tenant_cu24),
        {'message': 'Tengo ojo rojo y dolor desde ayer'},
        format='json',
    )

    assert response.status_code == 201

    with schema_context(tenant_cu24.schema_name):
        assert ChatbotUrgencyClassification.objects.count() == 1

    with schema_context(other_tenant.schema_name):
        assert ChatbotUrgencyClassification.objects.count() == 0
