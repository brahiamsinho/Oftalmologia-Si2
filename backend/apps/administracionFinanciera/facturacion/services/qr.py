"""
CU21 — Generación de QR para pago presencial en clínica.

El QR codifica los datos de la factura (monto, número, referencia UUID, clínica)
para que el paciente escanee con su app bancaria y realice la transferencia.

Flujo:
  1. Administrador genera QR → POST /facturacion/facturas/{id}/generar-qr/
  2. Backend crea CobroClinico PENDIENTE con metodo=QR y guarda referencia UUID
  3. Frontend muestra imagen PNG del QR en modal
  4. Paciente escanea y transfiere
  5. Administrador confirma → POST /facturacion/cobros/confirmar-pasarela/
     con referencia_pasarela=<uuid> y exito=true
  6. Cobro pasa a CONFIRMADO y saldo de factura se actualiza

NOTA ACADÉMICA:
  En producción real se integraría con el servicio QR del banco o pasarela
  local (ej. Simple, Tigo Money, QR Bolivia). En esta versión se genera un
  QR estático con la información del pago codificada como texto estructurado.
"""
from __future__ import annotations

import base64
import io
import uuid

from django.core.exceptions import ValidationError

from ..models import CobroClinico, EstadoCobro, EstadoFactura, FacturaClinica, MetodoPagoClinico

# Datos ficticios de cuenta bancaria de la clínica (reemplazar en producción)
CUENTA_CLINICA = {
    'banco':   'Banco Unión',
    'cuenta':  '1-6123456-1-8',
    'titular': 'Clínica OftalmoCRM S.R.L.',
    'moneda':  'Bs.',
}


def generar_qr_pago(factura: FacturaClinica) -> dict:
    """
    Genera un QR de pago para la factura indicada.

    Crea un CobroClinico PENDIENTE con metodo=QR y devuelve:
      - qr_base64: imagen PNG del QR codificada en base64
      - referencia_pasarela: UUID único para confirmar después
      - monto: monto a cobrar
      - datos_pago: dict con la info codificada en el QR

    Raises:
        ValidationError: si la factura no puede cobrarse (anulada, pagada, ya tiene QR pendiente)
    """
    if factura.estado == EstadoFactura.ANULADA:
        raise ValidationError('No se puede generar QR para una factura anulada.')
    if factura.estado == EstadoFactura.PAGADA:
        raise ValidationError('La factura ya está totalmente pagada.')
    if factura.saldo_pendiente <= 0:
        raise ValidationError('No hay saldo pendiente en esta factura.')

    # Evitar QR duplicados activos
    qr_pendiente = factura.cobros.filter(
        estado=EstadoCobro.PENDIENTE,
        metodo_pago=MetodoPagoClinico.QR,
    ).first()
    if qr_pendiente:
        # Reutilizar QR existente (mismo UUID) si ya hay uno pendiente
        referencia = qr_pendiente.referencia_pasarela
    else:
        referencia = str(uuid.uuid4())
        CobroClinico.objects.create(
            id_factura=factura,
            monto=factura.saldo_pendiente,
            metodo_pago=MetodoPagoClinico.QR,
            estado=EstadoCobro.PENDIENTE,
            referencia_pasarela=referencia,
            observaciones='Pago QR generado — pendiente de confirmación.',
        )

    datos_pago = {
        'banco':          CUENTA_CLINICA['banco'],
        'cuenta':         CUENTA_CLINICA['cuenta'],
        'titular':        CUENTA_CLINICA['titular'],
        'moneda':         CUENTA_CLINICA['moneda'],
        'monto':          str(factura.saldo_pendiente),
        'factura':        factura.numero_factura,
        'paciente':       factura.id_paciente.get_full_name(),
        'referencia':     referencia,
        'descripcion':    f'Pago factura {factura.numero_factura}',
    }

    qr_base64 = _generar_imagen_qr(datos_pago)

    return {
        'referencia_pasarela': referencia,
        'monto':               str(factura.saldo_pendiente),
        'numero_factura':      factura.numero_factura,
        'qr_base64':           qr_base64,
        'datos_pago':          datos_pago,
        'instrucciones': (
            'El paciente debe escanear este QR con su aplicación bancaria. '
            'Una vez realizada la transferencia, confirme el pago con el botón '
            '"Confirmar pago QR" usando la referencia indicada.'
        ),
    }


def _generar_imagen_qr(datos: dict) -> str:
    """
    Genera imagen PNG del QR con los datos de pago y devuelve base64.

    El contenido del QR es texto estructurado legible por apps bancarias
    genéricas. En integración real se usaría el formato del proveedor
    (ej. EMVCo para QR Bolivia, o string propio de Simple/Tigo).
    """
    contenido = (
        f"PAGO CLÍNICA\n"
        f"Banco: {datos['banco']}\n"
        f"Cuenta: {datos['cuenta']}\n"
        f"Titular: {datos['titular']}\n"
        f"Monto: {datos['moneda']} {datos['monto']}\n"
        f"Factura: {datos['factura']}\n"
        f"Paciente: {datos['paciente']}\n"
        f"Ref: {datos['referencia'][:16]}"  # primeros 16 chars de UUID
    )

    try:
        import qrcode  # noqa: PLC0415
        from qrcode.image.pure import PyPNGImage  # noqa: PLC0415

        qr = qrcode.QRCode(
            version=2,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=8,
            border=4,
        )
        qr.add_data(contenido)
        qr.make(fit=True)

        # Generar con PIL si está disponible, sino con PyPNG
        try:
            from PIL import Image  # noqa: PLC0415, F401
            img = qr.make_image(fill_color='black', back_color='white')
        except ImportError:
            img = qr.make_image(image_factory=PyPNGImage)

        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        return base64.b64encode(buffer.getvalue()).decode('utf-8')

    except ImportError:
        # Fallback: QR mock en base64 con SVG mínimo (placeholder visual)
        return _qr_placeholder_base64(contenido)


def _qr_placeholder_base64(contenido: str) -> str:
    """
    Placeholder SVG en caso de que qrcode no esté instalado.
    Solo para desarrollo — instalar qrcode[pil] en requirements.
    """
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">'
        '<rect width="200" height="200" fill="white" stroke="#ddd"/>'
        '<rect x="20" y="20" width="160" height="160" fill="none" stroke="black" stroke-width="2"/>'
        '<text x="100" y="95" font-size="10" text-anchor="middle" fill="black">QR no disponible</text>'
        '<text x="100" y="110" font-size="8" text-anchor="middle" fill="gray">pip install qrcode[pil]</text>'
        '</svg>'
    )
    return base64.b64encode(svg.encode()).decode()
