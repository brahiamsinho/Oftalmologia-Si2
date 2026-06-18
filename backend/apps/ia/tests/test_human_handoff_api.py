from uuid import uuid4

import pytest
from django_tenants.utils import get_public_schema_name, schema_context
from rest_framework.test import APIClient

from apps.bitacora.models import Bitacora
from apps.ia.models import (
    ChatbotUrgencyClassification,
    CriticalHumanHandoff,
    EstadoDerivacionHumana,
    NivelUrgenciaChatbot,
)
from apps.pacientes.pacientes.models import Paciente
from apps.tenant.models import Domain, Tenant
from apps.usuarios.users.models import TipoUsuario, Usuario

HANDOFF_PATH = '/api/ia/human-handoffs/'


def tenant_handoff_path(tenant):
    return f'/t/{tenant.slug}{HANDOFF_PATH}'


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def tenant_cu25(db):
    suffix = uuid4().hex[:8]
    with schema_context(get_public_schema_name()):
        tenant = Tenant.objects.create(
            schema_name=f'tenant_cu25_{suffix}',
            slug=f'tenant_cu25_{suffix}',
            nombre='Tenant CU25',
            activo=True,
        )
        Domain.objects.create(
            tenant=tenant,
            domain=tenant.slug,
            is_primary=True,
        )
        return tenant


@pytest.fixture
def paciente_user(db, tenant_cu25):
    with schema_context(tenant_cu25.schema_name):
        return Usuario.objects.create_user(
            username='paciente_cu25',
            email='paciente_cu25@test.local',
            password='Password123!',
            nombres='Paciente',
            apellidos='CU25',
            tipo_usuario=TipoUsuario.PACIENTE,
        )


@pytest.fixture
def paciente(db, tenant_cu25, paciente_user):
    with schema_context(tenant_cu25.schema_name):
        return Paciente.objects.create(
            usuario=paciente_user,
            numero_historia='HC-CU25-001',
            tipo_documento='DNI',
            numero_documento='DOC-CU25-001',
            nombres='Paciente',
            apellidos='CU25',
            email='paciente_cu25@test.local',
        )


@pytest.fixture
def staff_user(db, tenant_cu25):
    with schema_context(tenant_cu25.schema_name):
        return Usuario.objects.create_user(
            username='staff_cu25',
            email='staff_cu25@test.local',
            password='Password123!',
            nombres='Staff',
            apellidos='CU25',
            tipo_usuario=TipoUsuario.ADMINISTRATIVO,
        )


@pytest.fixture
def medico_user(db, tenant_cu25):
    with schema_context(tenant_cu25.schema_name):
        return Usuario.objects.create_user(
            username='medico_cu25',
            email='medico_cu25@test.local',
            password='Password123!',
            nombres='Medico',
            apellidos='CU25',
            tipo_usuario=TipoUsuario.MEDICO,
        )


@pytest.fixture
def critical_classification(db, tenant_cu25, paciente_user, paciente):
    with schema_context(tenant_cu25.schema_name):
        return ChatbotUrgencyClassification.objects.create(
            usuario=paciente_user,
            paciente=paciente,
            mensaje_usuario='Perdi la vision subitamente',
            nivel=NivelUrgenciaChatbot.CRITICO,
            confianza=0.95,
            criterios_detectados=[
                {'code': 'sudden_vision_loss', 'level': 'CRITICO'},
            ],
            orientacion='Buscar atencion medica inmediata.',
            requiere_atencion_humana=True,
            estado_derivacion='PENDIENTE',
        )


@pytest.fixture
def non_critical_classification(db, tenant_cu25, paciente_user, paciente):
    with schema_context(tenant_cu25.schema_name):
        return ChatbotUrgencyClassification.objects.create(
            usuario=paciente_user,
            paciente=paciente,
            mensaje_usuario='Tengo sequedad ocular',
            nivel=NivelUrgenciaChatbot.BAJO,
            confianza=0.64,
            criterios_detectados=[
                {'code': 'dryness', 'level': 'BAJO'},
            ],
            orientacion='Sintomas de baja urgencia.',
            requiere_atencion_humana=False,
            estado_derivacion='NO_REQUERIDA',
        )


# --- CREATE from classification ---


@pytest.mark.django_db
def test_staff_crea_handoff_desde_clasificacion_critica(
    api_client,
    tenant_cu25,
    staff_user,
    critical_classification,
):
    api_client.force_authenticate(user=staff_user)

    response = api_client.post(
        f'{tenant_handoff_path(tenant_cu25)}from-classification/{critical_classification.pk}/',
        format='json',
    )

    assert response.status_code == 201
    assert response.data['handoff_id']
    assert response.data['paciente'] == critical_classification.paciente_id
    assert response.data['nivel_urgencia'] == NivelUrgenciaChatbot.CRITICO
    assert response.data['estado'] in ('PENDIENTE', 'NOTIFICADA')

    with schema_context(tenant_cu25.schema_name):
        handoff = CriticalHumanHandoff.objects.get(pk=response.data['handoff_id'])
        assert handoff.classification_id == critical_classification.pk
        assert handoff.paciente_id == critical_classification.paciente_id


@pytest.mark.django_db
def test_staff_no_puede_crear_handoff_desde_no_critica(
    api_client,
    tenant_cu25,
    staff_user,
    non_critical_classification,
):
    api_client.force_authenticate(user=staff_user)

    response = api_client.post(
        f'{tenant_handoff_path(tenant_cu25)}from-classification/{non_critical_classification.pk}/',
        format='json',
    )

    assert response.status_code == 400
    assert 'no es crítica' in str(response.data)


@pytest.mark.django_db
def test_no_duplica_handoff(
    api_client,
    tenant_cu25,
    staff_user,
    critical_classification,
):
    api_client.force_authenticate(user=staff_user)

    path = f'{tenant_handoff_path(tenant_cu25)}from-classification/{critical_classification.pk}/'
    response1 = api_client.post(path, format='json')
    assert response1.status_code == 201

    response2 = api_client.post(path, format='json')
    assert response2.status_code == 400
    assert 'Ya existe una derivación' in str(response2.data)


@pytest.mark.django_db
def test_clasificacion_inexistente_404(
    api_client,
    tenant_cu25,
    staff_user,
):
    api_client.force_authenticate(user=staff_user)

    response = api_client.post(
        f'{tenant_handoff_path(tenant_cu25)}from-classification/99999/',
        format='json',
    )

    assert response.status_code == 404
    assert 'Clasificación no encontrada' in str(response.data)


@pytest.mark.django_db
def test_paciente_no_puede_crear_handoff(
    api_client,
    tenant_cu25,
    paciente_user,
    critical_classification,
):
    api_client.force_authenticate(user=paciente_user)

    response = api_client.post(
        f'{tenant_handoff_path(tenant_cu25)}from-classification/{critical_classification.pk}/',
        format='json',
    )

    assert response.status_code == 403


# --- LIST ---


@pytest.mark.django_db
def test_staff_lista_handoffs(
    api_client,
    tenant_cu25,
    staff_user,
    critical_classification,
):
    with schema_context(tenant_cu25.schema_name):
        CriticalHumanHandoff.objects.create(
            classification=critical_classification,
            paciente=critical_classification.paciente,
            mensaje_original=critical_classification.mensaje_usuario,
            nivel_urgencia=critical_classification.nivel,
            estado=EstadoDerivacionHumana.PENDIENTE,
        )

    api_client.force_authenticate(user=staff_user)
    response = api_client.get(tenant_handoff_path(tenant_cu25))

    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]['nivel_urgencia'] == NivelUrgenciaChatbot.CRITICO


# --- DETAIL ---


@pytest.mark.django_db
def test_staff_ve_detalle_handoff(
    api_client,
    tenant_cu25,
    staff_user,
    critical_classification,
):
    with schema_context(tenant_cu25.schema_name):
        handoff = CriticalHumanHandoff.objects.create(
            classification=critical_classification,
            paciente=critical_classification.paciente,
            mensaje_original=critical_classification.mensaje_usuario,
            nivel_urgencia=critical_classification.nivel,
            estado=EstadoDerivacionHumana.PENDIENTE,
        )

    api_client.force_authenticate(user=staff_user)
    response = api_client.get(
        f'{tenant_handoff_path(tenant_cu25)}{handoff.pk}/',
    )

    assert response.status_code == 200
    assert response.data['handoff_id'] == handoff.pk
    assert response.data['paciente_nombre'] == str(handoff.paciente)
    assert response.data['mensaje_original']


@pytest.mark.django_db
def test_detalle_handoff_404(
    api_client,
    tenant_cu25,
    staff_user,
):
    api_client.force_authenticate(user=staff_user)

    response = api_client.get(
        f'{tenant_handoff_path(tenant_cu25)}99999/',
    )

    assert response.status_code == 404


# --- ACCEPT ---


@pytest.mark.django_db
def test_staff_acepta_handoff(
    api_client,
    tenant_cu25,
    staff_user,
    critical_classification,
):
    with schema_context(tenant_cu25.schema_name):
        handoff = CriticalHumanHandoff.objects.create(
            classification=critical_classification,
            paciente=critical_classification.paciente,
            mensaje_original=critical_classification.mensaje_usuario,
            nivel_urgencia=critical_classification.nivel,
            estado=EstadoDerivacionHumana.NOTIFICADA,
        )

    api_client.force_authenticate(user=staff_user)
    response = api_client.post(
        f'{tenant_handoff_path(tenant_cu25)}{handoff.pk}/accept/',
        format='json',
    )

    assert response.status_code == 200
    assert response.data['estado'] == EstadoDerivacionHumana.ACEPTADA
    assert response.data['aceptado_por'] == staff_user.pk

    with schema_context(tenant_cu25.schema_name):
        handoff.refresh_from_db()
        assert handoff.aceptado_por_id == staff_user.pk
        assert handoff.aceptado_en is not None

        bitacora = Bitacora.objects.filter(
            modulo='IA',
            id_registro_afectado=handoff.pk,
            accion='CONFIRMAR',
        )
        assert bitacora.exists()


# --- RESOLVE ---


@pytest.mark.django_db
def test_staff_resuelve_handoff(
    api_client,
    tenant_cu25,
    staff_user,
    critical_classification,
):
    with schema_context(tenant_cu25.schema_name):
        handoff = CriticalHumanHandoff.objects.create(
            classification=critical_classification,
            paciente=critical_classification.paciente,
            mensaje_original=critical_classification.mensaje_usuario,
            nivel_urgencia=critical_classification.nivel,
            estado=EstadoDerivacionHumana.ACEPTADA,
        )

    api_client.force_authenticate(user=staff_user)
    response = api_client.post(
        f'{tenant_handoff_path(tenant_cu25)}{handoff.pk}/resolve/',
        format='json',
    )

    assert response.status_code == 200
    assert response.data['estado'] == EstadoDerivacionHumana.RESUELTA
    assert response.data['resuelto_en'] is not None


@pytest.mark.django_db
def test_estado_terminal_rechaza_accept(
    api_client,
    tenant_cu25,
    staff_user,
    critical_classification,
):
    with schema_context(tenant_cu25.schema_name):
        handoff = CriticalHumanHandoff.objects.create(
            classification=critical_classification,
            paciente=critical_classification.paciente,
            mensaje_original=critical_classification.mensaje_usuario,
            nivel_urgencia=critical_classification.nivel,
            estado=EstadoDerivacionHumana.RESUELTA,
        )

    api_client.force_authenticate(user=staff_user)
    response = api_client.post(
        f'{tenant_handoff_path(tenant_cu25)}{handoff.pk}/accept/',
        format='json',
    )

    assert response.status_code == 400


# --- TENANT ISOLATION ---


@pytest.mark.django_db
def test_tenant_isolation(
    api_client,
    tenant_cu25,
    staff_user,
    critical_classification,
):
    suffix = uuid4().hex[:8]
    with schema_context(get_public_schema_name()):
        other_tenant = Tenant.objects.create(
            schema_name=f'tenant_cu25_other_{suffix}',
            slug=f'tenant_cu25_other_{suffix}',
            nombre='Tenant CU25 Other',
            activo=True,
        )
        Domain.objects.create(
            tenant=other_tenant,
            domain=other_tenant.slug,
            is_primary=True,
        )

    with schema_context(tenant_cu25.schema_name):
        CriticalHumanHandoff.objects.create(
            classification=critical_classification,
            paciente=critical_classification.paciente,
            mensaje_original=critical_classification.mensaje_usuario,
            nivel_urgencia=critical_classification.nivel,
            estado=EstadoDerivacionHumana.PENDIENTE,
        )

    api_client.force_authenticate(user=staff_user)
    response = api_client.get(tenant_handoff_path(tenant_cu25))

    assert response.status_code == 200
    assert len(response.data) == 1

    with schema_context(tenant_cu25.schema_name):
        assert CriticalHumanHandoff.objects.count() == 1

    with schema_context(other_tenant.schema_name):
        assert CriticalHumanHandoff.objects.count() == 0
