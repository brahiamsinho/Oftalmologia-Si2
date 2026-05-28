from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.pacientes.pacientes.models import Paciente
from apps.administracionFinanciera.seguros.models import AfiliacionSeguroPaciente, Aseguradora, Convenio
from apps.administracionFinanciera.seguros.services import verificar_cobertura_paciente


@pytest.fixture
def aseguradora(db):
    return Aseguradora.objects.create(
        codigo='NSS',
        nombre='Nacional Seguros Salud',
        activo=True,
    )


@pytest.fixture
def convenio(db, aseguradora):
    return Convenio.objects.create(
        id_aseguradora=aseguradora,
        codigo='CONV-OFT-2026',
        nombre='Plan oftalmológico empresarial',
        porcentaje_cobertura=Decimal('85.00'),
        copago_monto=Decimal('50.00'),
        fecha_inicio=date.today() - timedelta(days=30),
        activo=True,
    )


@pytest.fixture
def paciente(db):
    return Paciente.objects.create(
        numero_historia='HC-CU19-001',
        tipo_documento='DNI',
        numero_documento='DOC-CU19-001',
        nombres='Ana',
        apellidos='Prueba',
    )


@pytest.mark.django_db
def test_verificar_cobertura_sin_afiliacion(paciente):
    result = verificar_cobertura_paciente(paciente.pk)
    assert result['tiene_cobertura'] is False


@pytest.mark.django_db
def test_verificar_cobertura_con_afiliacion_principal(paciente, convenio):
    AfiliacionSeguroPaciente.objects.create(
        id_paciente=paciente,
        id_convenio=convenio,
        numero_afiliado='AF-12345',
        es_principal=True,
        activo=True,
    )

    result = verificar_cobertura_paciente(paciente.pk)
    assert result['tiene_cobertura'] is True
    assert result['convenio']['codigo'] == 'CONV-OFT-2026'
    assert result['aseguradora']['codigo'] == 'NSS'
    assert Decimal(result['convenio']['porcentaje_cobertura']) == Decimal('85.00')


@pytest.mark.django_db
def test_convenio_fecha_fin_invalida_en_serializer(aseguradora):
    from apps.administracionFinanciera.seguros.serializers import ConvenioSerializer

    ser = ConvenioSerializer(
        data={
            'id_aseguradora': aseguradora.pk,
            'codigo': 'X',
            'nombre': 'Test',
            'fecha_inicio': '2026-06-01',
            'fecha_fin': '2026-05-01',
            'porcentaje_cobertura': '80',
            'copago_monto': '0',
            'activo': True,
        },
    )
    assert not ser.is_valid()
    assert 'fecha_fin' in ser.errors


@pytest.mark.django_db
def test_vigente_hoy_soporta_datetime_en_memoria(aseguradora, paciente):
    convenio = Convenio.objects.create(
        id_aseguradora=aseguradora,
        codigo='CONV-DT-2026',
        nombre='Convenio datetime',
        porcentaje_cobertura=Decimal('80.00'),
        copago_monto=Decimal('10.00'),
        activo=True,
    )
    # Simula valor datetime transitorio antes de coerción completa de DateField.
    convenio.fecha_inicio = timezone.now()
    assert convenio.vigente_hoy is True

    afiliacion = AfiliacionSeguroPaciente.objects.create(
        id_paciente=paciente,
        id_convenio=convenio,
        numero_afiliado='AF-DT-001',
        es_principal=True,
        activo=True,
    )
    afiliacion.fecha_inicio = timezone.now()
    assert afiliacion.vigente_hoy is True
