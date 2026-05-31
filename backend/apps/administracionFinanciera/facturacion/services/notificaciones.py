"""
CU20 — Notificación al paciente (push + registro en BD vía apps.notificaciones).
"""
from __future__ import annotations

import logging

from apps.crm.notificaciones.services import enviar_push_a_usuario

from ..models import FacturaClinica

_logger = logging.getLogger(__name__)

_EVENTOS = {
    'EMITIDA': (
        'Factura emitida',
        'Tiene un comprobante pendiente de pago en la clínica.',
    ),
    'PAGO_CONFIRMADO': (
        'Pago registrado',
        'Su pago fue confirmado correctamente.',
    ),
    'PAGO_PENDIENTE': (
        'Pago en línea iniciado',
        'Complete el pago en la pasarela para confirmar su factura.',
    ),
    'PAGO_RECHAZADO': (
        'Pago rechazado',
        'El pago en línea no pudo completarse. Puede reintentar o pagar en recepción.',
    ),
}


def notificar_paciente_factura(factura: FacturaClinica, evento: str) -> dict:
    """
    Notifica al usuario vinculado al paciente si existe cuenta PACIENTE.
    Si no hay usuario o no hay contacto, no falla el flujo de facturación.
    """
    paciente = factura.id_paciente
    usuario = getattr(paciente, 'usuario', None)
    if not usuario or not usuario.pk:
        return {'enviado': False, 'motivo': 'Paciente sin usuario de app.'}

    titulo_cuerpo = _EVENTOS.get(evento)
    if not titulo_cuerpo:
        return {'enviado': False, 'motivo': f'Evento desconocido: {evento}'}

    titulo, cuerpo = titulo_cuerpo
    cuerpo = f'{cuerpo} Ref: {factura.numero_factura}. Saldo: {factura.saldo_pendiente}.'

    try:
        resultado = enviar_push_a_usuario(
            usuario_id=usuario.pk,
            titulo=titulo,
            cuerpo=cuerpo,
            data={
                'tipo': 'facturacion',
                'evento': evento,
                'id_factura': str(factura.pk),
                'numero_factura': factura.numero_factura or '',
            },
            tipo='facturacion',
        )
        return {'enviado': True, 'resultado': resultado}
    except Exception as exc:  # noqa: BLE001
        _logger.warning('notificar_paciente_factura: %s', exc)
        return {'enviado': False, 'motivo': str(exc)}
