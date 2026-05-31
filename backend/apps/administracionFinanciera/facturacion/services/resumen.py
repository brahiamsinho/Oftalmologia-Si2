"""
CU20 — Consultas de resumen para especialista y paciente.
"""
from __future__ import annotations

from typing import Any

from django.core.exceptions import ValidationError

from apps.atencionClinica.citas.models import Cita
from apps.pacientes.pacientes.models import Paciente

from ..models import EstadoFactura, FacturaClinica


def resumen_facturacion_cita(id_cita: int) -> dict[str, Any]:
    try:
        cita = Cita.objects.select_related('id_paciente', 'id_tipo_cita').get(pk=id_cita)
    except Cita.DoesNotExist as exc:
        raise ValidationError('Cita no encontrada.') from exc

    from . import calcular_montos_factura

    preview = calcular_montos_factura(
        cita.id_paciente_id,
        id_cita=id_cita,
    )

    facturas = FacturaClinica.objects.filter(id_cita=cita).order_by('-fecha_emision')
    return {
        'id_cita': id_cita,
        'id_paciente': cita.id_paciente_id,
        'paciente_nombre': cita.id_paciente.get_full_name(),
        'preview_calculo': preview,
        'facturas': [
            {
                'id_factura': f.pk,
                'numero_factura': f.numero_factura,
                'estado': f.estado,
                'monto_total': str(f.monto_total),
                'saldo_pendiente': str(f.saldo_pendiente),
            }
            for f in facturas
        ],
        'tiene_saldo_pendiente': any(
            f.estado in (EstadoFactura.EMITIDA, EstadoFactura.PAGADA_PARCIAL)
            and f.saldo_pendiente > 0
            for f in facturas
        ),
    }


def listar_facturas_paciente(paciente_id: int, *, solo_pendientes: bool = False) -> list[dict[str, Any]]:
    try:
        Paciente.objects.get(pk=paciente_id)
    except Paciente.DoesNotExist as exc:
        raise ValidationError('Paciente no encontrado.') from exc

    qs = FacturaClinica.objects.filter(id_paciente_id=paciente_id).select_related('id_servicio')
    if solo_pendientes:
        qs = qs.filter(
            estado__in=(EstadoFactura.EMITIDA, EstadoFactura.PAGADA_PARCIAL),
            saldo_pendiente__gt=0,
        )
    qs = qs.order_by('-fecha_emision')

    return [
        {
            'id_factura': f.pk,
            'numero_factura': f.numero_factura,
            'estado': f.estado,
            'fecha_emision': f.fecha_emision.isoformat(),
            'servicio_nombre': f.id_servicio.nombre,
            'monto_total': str(f.monto_total),
            'saldo_pendiente': str(f.saldo_pendiente),
        }
        for f in qs
    ]
