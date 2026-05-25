"""
CU20 — Comprobante / factura en PDF (reportlab).
"""
from __future__ import annotations

import io
from decimal import Decimal

from django.utils import timezone

from ..models import FacturaClinica


def generar_comprobante_pdf(factura: FacturaClinica) -> bytes:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas
    except ImportError as exc:
        raise RuntimeError(
            'reportlab no está instalado. Agregue reportlab a requirements/base.txt.',
        ) from exc

    factura = (
        FacturaClinica.objects.select_related(
            'id_paciente',
            'id_servicio',
            'id_promocion_aplicada',
        )
        .prefetch_related('cobros')
        .get(pk=factura.pk)
    )

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 20 * mm

    def line(text: str, size: int = 10, bold: bool = False):
        nonlocal y
        pdf.setFont('Helvetica-Bold' if bold else 'Helvetica', size)
        pdf.drawString(20 * mm, y, text[:95])
        y -= 6 * mm

    line('COMPROBANTE DE FACTURACIÓN CLÍNICA', 14, bold=True)
    line(f'Número: {factura.numero_factura}')
    line(f'Fecha emisión: {factura.fecha_emision}')
    line(f'Estado: {factura.get_estado_display()}')
    y -= 4 * mm

    paciente = factura.id_paciente
    line('PACIENTE', 11, bold=True)
    line(f'{paciente.get_full_name()} — Doc: {paciente.numero_documento}')
    line(f'N° historia: {paciente.numero_historia}')
    y -= 4 * mm

    line('SERVICIO', 11, bold=True)
    line(f'{factura.id_servicio.nombre} ({factura.id_servicio.codigo})')
    y -= 4 * mm

    line('DETALLE DE MONTOS', 11, bold=True)
    line(f'Monto base:              {factura.monto_base}')
    line(f'Cobertura seguro:        {factura.monto_cobertura_seguro}')
    line(f'Copago seguro:           {factura.copago_seguro}')
    line(f'Descuento aplicado:      {factura.monto_descuento}')
    if factura.id_promocion_aplicada:
        line(f'Promoción:               {factura.id_promocion_aplicada.codigo}')
    line(f'TOTAL A CARGO PACIENTE:  {factura.monto_total}', 11, bold=True)
    line(f'Saldo pendiente:         {factura.saldo_pendiente}', 11, bold=True)
    y -= 4 * mm

    cobros = list(factura.cobros.order_by('fecha_cobro'))
    if cobros:
        line('COBROS', 11, bold=True)
        for c in cobros:
            line(
                f'- {c.fecha_cobro:%Y-%m-%d %H:%M} | {c.get_metodo_pago_display()} | '
                f'{c.monto} | {c.get_estado_display()}',
            )

    line('')
    line(f'Generado: {timezone.localtime():%Y-%m-%d %H:%M}', 8)

    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return buffer.getvalue()


def generar_comprobante_texto(factura: FacturaClinica) -> str:
    """Fallback legible si PDF no está disponible."""
    p = factura.id_paciente
    return (
        f'Comprobante {factura.numero_factura}\n'
        f'Paciente: {p.get_full_name()}\n'
        f'Servicio: {factura.id_servicio.nombre}\n'
        f'Total: {factura.monto_total} | Saldo: {factura.saldo_pendiente}\n'
        f'Estado: {factura.get_estado_display()}\n'
    )
