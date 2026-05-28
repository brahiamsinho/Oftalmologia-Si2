from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.administracionFinanciera.descuentos.models import (
    BeneficioPaciente,
    EstadoPromocion,
    PromocionDescuento,
    TipoBeneficio,
)
from apps.pacientes.pacientes.models import Paciente


@pytest.fixture
def paciente(db):
    token = timezone.now().strftime('%Y%m%d%H%M%S%f')
    return Paciente.objects.create(
        numero_historia=f'HC-DESC-{token}',
        tipo_documento='DNI',
        numero_documento=f'DESC-{token}',
        nombres='Paciente',
        apellidos='Descuento',
    )


@pytest.mark.django_db
def test_vigente_hoy_promocion_y_beneficio_soporta_datetime_en_memoria(paciente):
    promo = PromocionDescuento.objects.create(
        codigo='PROMO-DT-2026',
        nombre='Promo datetime',
        tipo_beneficio=TipoBeneficio.PORCENTAJE,
        valor=Decimal('15.00'),
        estado=EstadoPromocion.ACTIVA,
        fecha_inicio=timezone.localdate() - timedelta(days=1),
    )
    promo.fecha_inicio = timezone.now()
    assert promo.vigente_hoy is True

    beneficio = BeneficioPaciente.objects.create(
        id_paciente=paciente,
        id_promocion=promo,
        activo=True,
    )
    beneficio.fecha_asignacion = timezone.now()
    assert beneficio.vigente_hoy is True
