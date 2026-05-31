"""
CU20 — Pasarela de pago simulada (desarrollo / demo).

En producción reemplazar checkout_url por URL real del proveedor y validar firma del webhook.
"""
from __future__ import annotations

import uuid
from decimal import Decimal

from django.core.exceptions import ValidationError

from ..models import CobroClinico, EstadoCobro, EstadoFactura, MetodoPagoClinico
from .cobros import aplicar_cobro_confirmado_a_factura
from .notificaciones import notificar_paciente_factura


def iniciar_pago_en_linea(factura) -> dict:
    """Crea cobro PENDIENTE y devuelve referencia para la pasarela mock."""
    if factura.estado == EstadoFactura.ANULADA:
        raise ValidationError('La factura está anulada.')
    if factura.estado == EstadoFactura.PAGADA:
        raise ValidationError('La factura ya está pagada.')
    if factura.saldo_pendiente <= 0:
        raise ValidationError('No hay saldo pendiente.')

    pendiente = factura.cobros.filter(
        estado=EstadoCobro.PENDIENTE,
        metodo_pago=MetodoPagoClinico.EN_LINEA,
    ).exists()
    if pendiente:
        raise ValidationError('Ya existe un pago en línea pendiente para esta factura.')

    referencia = str(uuid.uuid4())
    cobro = CobroClinico.objects.create(
        id_factura=factura,
        monto=factura.saldo_pendiente,
        metodo_pago=MetodoPagoClinico.EN_LINEA,
        estado=EstadoCobro.PENDIENTE,
        referencia_pasarela=referencia,
        observaciones='Inicio de pago en línea (pasarela simulada).',
    )

    notificar_paciente_factura(factura, 'PAGO_PENDIENTE')

    return {
        'id_cobro': cobro.pk,
        'id_factura': factura.pk,
        'referencia_pasarela': referencia,
        'monto': str(cobro.monto),
        'checkout_url': f'/api/facturacion/pasarela/mock-checkout/{referencia}/',
        'instrucciones': (
            'En desarrollo: simular confirmación con '
            'POST /api/facturacion/cobros/confirmar-pasarela/ '
            'y header X-Pasarela-Secret.'
        ),
    }


def confirmar_pago_pasarela(referencia: str, *, exito: bool) -> CobroClinico:
    """Webhook simulado: confirma o rechaza un cobro EN_LINEA pendiente."""
    referencia = (referencia or '').strip()
    if not referencia:
        raise ValidationError('referencia_pasarela es obligatoria.')

    try:
        cobro = CobroClinico.objects.select_related(
            'id_factura',
            'id_factura__id_paciente',
        ).get(
            referencia_pasarela=referencia,
            metodo_pago=MetodoPagoClinico.EN_LINEA,
            estado=EstadoCobro.PENDIENTE,
        )
    except CobroClinico.DoesNotExist as exc:
        raise ValidationError('No hay cobro pendiente con esa referencia.') from exc

    factura = cobro.id_factura

    if exito:
        cobro.estado = EstadoCobro.CONFIRMADO
        cobro.save(update_fields=['estado', 'updated_at'])
        aplicar_cobro_confirmado_a_factura(factura, cobro.monto)
        factura.refresh_from_db()
        notificar_paciente_factura(factura, 'PAGO_CONFIRMADO')
    else:
        cobro.estado = EstadoCobro.RECHAZADO
        cobro.save(update_fields=['estado', 'updated_at'])
        notificar_paciente_factura(factura, 'PAGO_RECHAZADO')

    return cobro
