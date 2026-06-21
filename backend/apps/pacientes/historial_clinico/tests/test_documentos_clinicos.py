import pytest
from django.utils import timezone
from django_tenants.utils import get_public_schema_name, schema_context
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.pacientes.historial_clinico.models import (
    DocumentoClinicoAutorizado,
    EstadoDocumentoClinico,
    HistoriaClinica,
    TipoDocumentoClinico,
)
from apps.pacientes.historial_clinico.views import (
    DocumentoClinicoAutorizadoViewSet,
    HistoriaClinicaViewSet,
)
from apps.pacientes.pacientes.models import Paciente
from apps.tenant.models import Tenant
from apps.usuarios.users.models import TipoUsuario, Usuario


@pytest.fixture
def factory():
    return APIRequestFactory()


@pytest.fixture
def tenant_a(db):
    with schema_context(get_public_schema_name()):
        return Tenant.objects.create(
            schema_name='tenant-cu26-a',
            slug='tenant-cu26-a',
            nombre='Tenant CU26 A',
            activo=True,
        )


@pytest.fixture
def tenant_b(db):
    with schema_context(get_public_schema_name()):
        return Tenant.objects.create(
            schema_name='tenant-cu26-b',
            slug='tenant-cu26-b',
            nombre='Tenant CU26 B',
            activo=True,
        )


def _seed_clinical_context(tenant: Tenant, suffix: str):
    with schema_context(tenant.schema_name):
        medico = Usuario.objects.create_user(
            username=f'medico_{suffix}',
            email=f'medico_{suffix}@test.local',
            password='Password123!',
            nombres='Medico',
            apellidos=suffix.upper(),
            tipo_usuario=TipoUsuario.MEDICO,
        )
        paciente_user = Usuario.objects.create_user(
            username=f'paciente_{suffix}',
            email=f'paciente_{suffix}@test.local',
            password='Password123!',
            nombres='Paciente',
            apellidos=suffix.upper(),
            tipo_usuario=TipoUsuario.PACIENTE,
        )
        paciente = Paciente.objects.create(
            usuario=paciente_user,
            numero_historia=f'HC-CU26-{suffix}-001',
            tipo_documento='DNI',
            numero_documento=f'DOC-CU26-{suffix}-001',
            nombres='Paciente',
            apellidos=suffix.upper(),
        )
        historia = HistoriaClinica.objects.create(id_paciente=paciente)
        return {
            'medico': medico,
            'paciente_user': paciente_user,
            'paciente': paciente,
            'historia': historia,
        }


@pytest.mark.django_db
def test_medico_crea_autoriza_y_descarga_documento_pdf(factory, tenant_a):
    contexto = _seed_clinical_context(tenant_a, 'a')

    with schema_context(tenant_a.schema_name):
        create_request = factory.post(
            '/api/historias-clinicas/documentos-clinicos/',
            {
                'tipo_documento': TipoDocumentoClinico.RECETA,
                'titulo': 'Receta control visual',
                'contenido': 'Usar gotas lubricantes cada 8 horas.\nRevisar en 7 días.',
                'nombre_archivo_descarga': 'receta-control-visual',
            },
            format='json',
        )
        force_authenticate(create_request, user=contexto['medico'])
        create_response = DocumentoClinicoAutorizadoViewSet.as_view({'post': 'create'})(
            create_request,
            id_historia_clinica=contexto['historia'].id_historia_clinica,
        )
        assert create_response.status_code == 201
        assert create_response.data['estado'] == EstadoDocumentoClinico.BORRADOR

        documento_id = create_response.data['id_documento_clinico']

        authorize_request = factory.post('/api/historias-clinicas/documentos-clinicos/autorizar/')
        force_authenticate(authorize_request, user=contexto['medico'])
        authorize_response = DocumentoClinicoAutorizadoViewSet.as_view({'post': 'autorizar'})(
            authorize_request,
            id_historia_clinica=contexto['historia'].id_historia_clinica,
            pk=documento_id,
        )
        assert authorize_response.status_code == 200
        assert authorize_response.data['estado'] == EstadoDocumentoClinico.AUTORIZADO
        assert authorize_response.data['autorizado_por_nombre'] == contexto['medico'].get_full_name()

        detail_request = factory.get('/api/historias-clinicas/1/')
        force_authenticate(detail_request, user=contexto['medico'])
        detail_response = HistoriaClinicaViewSet.as_view({'get': 'retrieve'})(
            detail_request,
            pk=contexto['historia'].id_historia_clinica,
        )
        assert detail_response.status_code == 200
        assert len(detail_response.data['recetas']) == 1
        assert detail_response.data['recetas'][0]['titulo'] == 'Receta control visual'

        download_request = factory.get('/api/historias-clinicas/documentos-clinicos/download/')
        force_authenticate(download_request, user=contexto['medico'])
        download_response = DocumentoClinicoAutorizadoViewSet.as_view({'get': 'download'})(
            download_request,
            id_historia_clinica=contexto['historia'].id_historia_clinica,
            pk=documento_id,
        )
        assert download_response.status_code == 200
        assert download_response['Content-Type'] == 'application/pdf'
        assert download_response['Content-Disposition'].startswith('attachment; filename="receta-control-visual')
        assert download_response.content.startswith(b'%PDF')


@pytest.mark.django_db
def test_paciente_no_puede_crear_documentos(factory, tenant_a):
    contexto = _seed_clinical_context(tenant_a, 'a')

    with schema_context(tenant_a.schema_name):
        request = factory.post(
            '/api/historias-clinicas/documentos-clinicos/',
            {
                'tipo_documento': TipoDocumentoClinico.INDICACION,
                'titulo': 'Indicaciones de cuidado',
                'contenido': 'Evitar frotar el ojo.',
            },
            format='json',
        )
        force_authenticate(request, user=contexto['paciente_user'])
        response = DocumentoClinicoAutorizadoViewSet.as_view({'post': 'create'})(
            request,
            id_historia_clinica=contexto['historia'].id_historia_clinica,
        )
        assert response.status_code == 403


@pytest.mark.django_db
def test_paciente_solo_ve_documentos_autorizados_de_su_tenant(factory, tenant_a, tenant_b):
    contexto_a = _seed_clinical_context(tenant_a, 'a')
    contexto_b = _seed_clinical_context(tenant_b, 'b')

    with schema_context(tenant_a.schema_name):
        DocumentoClinicoAutorizado.objects.create(
            id_historia_clinica=contexto_a['historia'],
            id_paciente=contexto_a['paciente'],
            tipo_documento=TipoDocumentoClinico.RECETA,
            estado=EstadoDocumentoClinico.AUTORIZADO,
            titulo='Receta A',
            contenido='Contenido A',
            nombre_archivo_descarga='receta-a',
            autorizado_por=contexto_a['medico'],
            autorizado_en=timezone.now(),
        )

    with schema_context(tenant_b.schema_name):
        DocumentoClinicoAutorizado.objects.create(
            id_historia_clinica=contexto_b['historia'],
            id_paciente=contexto_b['paciente'],
            tipo_documento=TipoDocumentoClinico.INDICACION,
            estado=EstadoDocumentoClinico.AUTORIZADO,
            titulo='Indicacion B',
            contenido='Contenido B',
            nombre_archivo_descarga='indicacion-b',
            autorizado_por=contexto_b['medico'],
            autorizado_en=timezone.now(),
        )

    with schema_context(tenant_a.schema_name):
        request = factory.get('/api/mis-documentos-clinicos/')
        force_authenticate(request, user=contexto_a['paciente_user'])
        response = DocumentoClinicoAutorizadoViewSet.as_view({'get': 'list'})(request)

    assert response.status_code == 200
    assert response.data['count'] == 1
    assert response.data['results'][0]['titulo'] == 'Receta A'
    assert response.data['results'][0]['estado'] == EstadoDocumentoClinico.AUTORIZADO
    assert all(item['titulo'] != 'Indicacion B' for item in response.data['results'])
