"""
CU20 — Pasarela de pago simulada (desarrollo / demo).

En producción reemplazar checkout_url por URL real del proveedor y validar firma del webhook.
"""
from __future__ import annotations

import uuid
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError

from ..models import CobroClinico, EstadoCobro, EstadoFactura, MetodoPagoClinico
from .cobros import aplicar_cobro_confirmado_a_factura
from .notificaciones import notificar_paciente_factura

try:
    import stripe
except ImportError:  # pragma: no cover - entorno sin stripe instalado
    stripe = None


def _stripe_habilitado() -> bool:
    return bool(
        stripe is not None
        and getattr(settings, 'STRIPE_SECRET_KEY', '').strip()
    )


def _build_stripe_urls(*, tenant_slug: str | None, factura_id: int) -> tuple[str, str]:
    frontend_url = getattr(settings, 'FRONTEND_URL', '').strip()
    if not frontend_url:
        raise ValidationError('FRONTEND_URL no está configurado para redirecciones de Stripe.')
    base = frontend_url.rstrip('/')
    tenant_q = f'&tenant={tenant_slug}' if tenant_slug else ''
    success_url = (
        f'{base}/facturacion/pago'
        f'?status=success&factura_id={factura_id}{tenant_q}&session_id={{CHECKOUT_SESSION_ID}}'
    )
    cancel_url = (
        f'{base}/facturacion/pago'
        f'?status=cancel&factura_id={factura_id}{tenant_q}'
    )
    return success_url, cancel_url


def _crear_o_reusar_checkout_stripe(*, factura, cobro: CobroClinico, tenant_slug: str | None) -> dict:
    stripe.api_key = settings.STRIPE_SECRET_KEY
    success_url, cancel_url = _build_stripe_urls(tenant_slug=tenant_slug, factura_id=factura.pk)

    session = None
    referencia_actual = (cobro.referencia_pasarela or '').strip()
    if referencia_actual.startswith('cs_'):
        try:
            session = stripe.checkout.Session.retrieve(referencia_actual)
            if session and session.get('payment_status') == 'paid':
                confirmar_pago_pasarela(referencia_actual, exito=True)
                factura.refresh_from_db()
                raise ValidationError('Este pago ya fue confirmado. Refresque la factura.')
        except stripe.error.StripeError:
            session = None

    if not session or not session.get('url'):
        try:
            session = stripe.checkout.Session.create(
                mode='payment',
                payment_method_types=['card', 'link'],
                line_items=[
                    {
                        'price_data': {
                            'currency': settings.STRIPE_CURRENCY,
                            'product_data': {
                                'name': f'Factura clínica {factura.numero_factura or factura.pk}',
                                'description': f'Pago en línea factura {factura.numero_factura or factura.pk}',
                            },
                            'unit_amount': int(Decimal(cobro.monto) * 100),
                        },
                        'quantity': 1,
                    }
                ],
                metadata={
                    'factura_id': str(factura.pk),
                    'cobro_id': str(cobro.pk),
                    'tenant_slug': tenant_slug or '',
                    'flujo': 'facturacion_clinica',
                },
                success_url=success_url,
                cancel_url=cancel_url,
            )
        except Exception as exc:
            raise ValidationError(f'Error Stripe al iniciar checkout: {exc}') from exc

        cobro.referencia_pasarela = session.id
        cobro.observaciones = 'Inicio de pago en línea (Stripe Checkout).'
        cobro.save(update_fields=['referencia_pasarela', 'observaciones', 'updated_at'])

    return {
        'id_cobro': cobro.pk,
        'id_factura': factura.pk,
        'referencia_pasarela': cobro.referencia_pasarela,
        'monto': str(cobro.monto),
        'checkout_url': session.get('url') or '',
        'instrucciones': (
            'Complete el pago en Stripe Checkout. '
            'Luego refresque "Mis facturas" para ver el estado actualizado.'
        ),
    }


def iniciar_pago_en_linea(factura, tenant_slug: str | None = None) -> dict:
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
    ).order_by('-created_at').first()
    if pendiente:
        # Idempotencia UX: si ya existe un intento pendiente, se reutiliza.
        # Evita bloquear al paciente cuando toca "Pagar en línea" más de una vez.
        if _stripe_habilitado():
            return _crear_o_reusar_checkout_stripe(
                factura=factura,
                cobro=pendiente,
                tenant_slug=tenant_slug,
            )
        return {
            'id_cobro': pendiente.pk,
            'id_factura': factura.pk,
            'referencia_pasarela': pendiente.referencia_pasarela,
            'monto': str(pendiente.monto),
            'checkout_url': f'/api/facturacion/pasarela/mock-checkout/{pendiente.referencia_pasarela}/',
            'instrucciones': (
                'Ya existe un intento pendiente. Reutilice esta referencia o '
                'confirme con POST /api/facturacion/cobros/confirmar-pasarela/ '
                'y header X-Pasarela-Secret.'
            ),
        }

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

    if _stripe_habilitado():
        return _crear_o_reusar_checkout_stripe(
            factura=factura,
            cobro=cobro,
            tenant_slug=tenant_slug,
        )

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

    # Aceptar tanto EN_LINEA como QR (ambos flujos usan referencia_pasarela)
    try:
        cobro = CobroClinico.objects.select_related(
            'id_factura',
            'id_factura__id_paciente',
        ).get(
            referencia_pasarela=referencia,
            metodo_pago__in=[MetodoPagoClinico.EN_LINEA, MetodoPagoClinico.QR],
            estado=EstadoCobro.PENDIENTE,
        )
    except CobroClinico.DoesNotExist as exc:
        raise ValidationError('No hay cobro pendiente (QR o en línea) con esa referencia.') from exc

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
