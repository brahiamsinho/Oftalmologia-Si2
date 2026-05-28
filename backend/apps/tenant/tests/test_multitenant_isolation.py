from datetime import timedelta

import pytest
from django.utils import timezone
from django_tenants.utils import get_public_schema_name, schema_context

from apps.atencionClinica.citas.models import Cita, EstadoCita, TipoCita, TipoCitaNombre
from apps.atencionClinica.consultas.models import Consulta
from apps.atencionClinica.especialistas.models import Especialista
from apps.pacientes.pacientes.models import Paciente
from apps.tenant.models import Domain, Tenant
from apps.usuarios.users.models import TipoUsuario, Usuario


@pytest.fixture
def tenant_a(db):
    with schema_context(get_public_schema_name()):
        tenant = Tenant.objects.create(
            schema_name='tenant_iso_a',
            slug='tenant-iso-a',
            nombre='Tenant ISO A',
            activo=True,
        )
        Domain.objects.create(tenant=tenant, domain='tenant-iso-a.localhost', is_primary=True)
        return tenant


@pytest.fixture
def tenant_b(db):
    with schema_context(get_public_schema_name()):
        tenant = Tenant.objects.create(
            schema_name='tenant_iso_b',
            slug='tenant-iso-b',
            nombre='Tenant ISO B',
            activo=True,
        )
        Domain.objects.create(tenant=tenant, domain='tenant-iso-b.localhost', is_primary=True)
        return tenant


def _seed_tenant_data(tenant: Tenant, suffix: str) -> dict[str, str]:
    now = timezone.now()

    with schema_context(tenant.schema_name):
        admin = Usuario.objects.create_user(
            username=f'admin_{suffix}',
            email=f'admin_{suffix}@test.local',
            password='Password123!',
            nombres='Admin',
            apellidos=suffix.upper(),
            tipo_usuario=TipoUsuario.ADMIN,
        )
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
        especialista = Especialista.objects.create(
            usuario=medico,
            codigo_profesional=f'COD-{suffix}',
            especialidad='Oftalmologia',
            activo=True,
        )
        tipo_cita = TipoCita.objects.create(
            nombre=TipoCitaNombre.CONSULTA,
            descripcion='Consulta general',
        )
        paciente = Paciente.objects.create(
            usuario=paciente_user,
            numero_historia=f'HC-{suffix}-001',
            tipo_documento='DNI',
            numero_documento=f'DOC-{suffix}-001',
            nombres='Paciente',
            apellidos=suffix.upper(),
            email=f'paciente_{suffix}@test.local',
        )
        cita = Cita.objects.create(
            id_paciente=paciente,
            id_especialista=especialista,
            id_tipo_cita=tipo_cita,
            fecha_hora_inicio=now + timedelta(days=1),
            fecha_hora_fin=now + timedelta(days=1, hours=1),
            estado=EstadoCita.PROGRAMADA,
            motivo='Control',
            creado_por=admin,
        )
        consulta = Consulta.objects.create(
            paciente=paciente,
            cita=cita,
            especialista=medico,
            motivo=f'Vision borrosa {suffix}',
            sintomas='Ardor ocular',
            notas_clinicas='Sin hallazgos graves',
        )
        return {
            'numero_documento': paciente.numero_documento,
            'paciente_nombre': f'{paciente.nombres} {paciente.apellidos}',
            'consulta_motivo': consulta.motivo,
        }


@pytest.mark.django_db
def test_pacientes_list_is_isolated_per_tenant(tenant_a, tenant_b):
    data_a = _seed_tenant_data(tenant_a, 'a')
    data_b = _seed_tenant_data(tenant_b, 'b')

    with schema_context(tenant_a.schema_name):
        documentos_a = set(Paciente.objects.values_list('numero_documento', flat=True))

    assert data_a['numero_documento'] in documentos_a
    assert data_b['numero_documento'] not in documentos_a


@pytest.mark.django_db
def test_citas_list_is_isolated_per_tenant(tenant_a, tenant_b):
    data_a = _seed_tenant_data(tenant_a, 'a')
    data_b = _seed_tenant_data(tenant_b, 'b')

    with schema_context(tenant_a.schema_name):
        pacientes_en_citas_a = {cita.id_paciente.get_full_name() for cita in Cita.objects.select_related('id_paciente')}

    assert data_a['paciente_nombre'] in pacientes_en_citas_a
    assert data_b['paciente_nombre'] not in pacientes_en_citas_a


@pytest.mark.django_db
def test_consultas_list_is_isolated_per_tenant(tenant_a, tenant_b):
    data_a = _seed_tenant_data(tenant_a, 'a')
    data_b = _seed_tenant_data(tenant_b, 'b')

    with schema_context(tenant_a.schema_name):
        motivos_consulta_a = set(Consulta.objects.values_list('motivo', flat=True))

    assert data_a['consulta_motivo'] in motivos_consulta_a
    assert data_b['consulta_motivo'] not in motivos_consulta_a
