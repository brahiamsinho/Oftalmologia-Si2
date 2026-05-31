"""Aplicación de montos cobrados a la factura."""
from __future__ import annotations

from decimal import Decimal

from ..models import EstadoFactura, FacturaClinica


def _q(value: Decimal) -> Decimal:
    return value.quantize(Decimal('0.01'))


def aplicar_cobro_confirmado_a_factura(factura: FacturaClinica, monto: Decimal) -> None:
    monto = _q(monto)
    factura.saldo_pendiente = _q(factura.saldo_pendiente - monto)
    if factura.saldo_pendiente <= 0:
        factura.saldo_pendiente = Decimal('0.00')
        factura.estado = EstadoFactura.PAGADA
    else:
        factura.estado = EstadoFactura.PAGADA_PARCIAL
    factura.save(update_fields=['saldo_pendiente', 'estado', 'updated_at'])
