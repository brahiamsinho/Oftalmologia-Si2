"""
CU20 — Servicios de facturación clínica.
"""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.atencionClinica.citas.models import Cita, TipoCitaNombre
from apps.administracionFinanciera.descuentos.models import TipoBeneficio
from apps.administracionFinanciera.descuentos.services import listar_beneficios_aplicables, verificar_aplicacion_promocion
from apps.pacientes.pacientes.models import Paciente
from apps.administracionFinanciera.seguros.services import verificar_cobertura_paciente

from ..models import (
    CatalogoServicioClinico,
    CobroClinico,
    EstadoCobro,
    EstadoFactura,
    FacturaClinica,
    MetodoPagoClinico,
    TipoServicioClinico,
)
from .cobros import aplicar_cobro_confirmado_a_factura
from .comprobante import generar_comprobante_pdf, generar_comprobante_texto
from .notificaciones import notificar_paciente_factura
from .pasarela import confirmar_pago_pasarela, iniciar_pago_en_linea
from .resumen import listar_facturas_paciente, resumen_facturacion_cita

__all__ = [
    'calcular_montos_factura',
    'emitir_factura',
    'registrar_cobro_factura',
    'anular_factura',
    'iniciar_pago_en_linea',
    'confirmar_pago_pasarela',
    'generar_comprobante_pdf',
    'generar_comprobante_texto',
    'notificar_paciente_factura',
    'resumen_facturacion_cita',
    'listar_facturas_paciente',
]


def _q(value: Decimal) -> Decimal:
    return value.quantize(Decimal('0.01'))


def _resolver_servicio(
    *,
    id_servicio: int | None = None,
    id_cita: int | None = None,
) -> CatalogoServicioClinico:
    if id_servicio:
        try:
            return CatalogoServicioClinico.objects.get(pk=id_servicio, activo=True)
        except CatalogoServicioClinico.DoesNotExist as exc:
            raise ValidationError('Servicio clínico no encontrado o inactivo.') from exc

    if not id_cita:
        raise ValidationError('Debe indicar id_servicio o id_cita.')

    try:
        cita = Cita.objects.select_related('id_tipo_cita').get(pk=id_cita)
    except Cita.DoesNotExist as exc:
        raise ValidationError('Cita no encontrada.') from exc

    servicio = CatalogoServicioClinico.objects.filter(
        id_tipo_cita=cita.id_tipo_cita,
        activo=True,
    ).first()
    if servicio:
        return servicio

    tipo_map = {
        TipoCitaNombre.CONSULTA: TipoServicioClinico.CONSULTA,
        TipoCitaNombre.ESTUDIO: TipoServicioClinico.ESTUDIO,
        TipoCitaNombre.CIRUGIA: TipoServicioClinico.CIRUGIA,
        TipoCitaNombre.SEGUIMIENTO_POSTOPERATORIO: TipoServicioClinico.CONTROL,
    }
    tipo = tipo_map.get(cita.id_tipo_cita.nombre)
    if tipo:
        servicio = CatalogoServicioClinico.objects.filter(tipo_servicio=tipo, activo=True).first()
        if servicio:
            return servicio

    raise ValidationError(
        'No hay tarifa en catálogo para el tipo de cita. Registre un servicio en facturación.',
    )


def calcular_montos_factura(
    paciente_id: int,
    *,
    id_servicio: int | None = None,
    id_cita: int | None = None,
    fecha: date | None = None,
    promocion_id: int | None = None,
) -> dict[str, Any]:
    ref = fecha or timezone.localdate()

    try:
        Paciente.objects.get(pk=paciente_id)
    except Paciente.DoesNotExist as exc:
        raise ValidationError('Paciente no encontrado.') from exc

    servicio = _resolver_servicio(id_servicio=id_servicio, id_cita=id_cita)
    base = servicio.precio_base

    cobertura = verificar_cobertura_paciente(paciente_id, fecha=ref)
    monto_cobertura = Decimal('0.00')
    copago = Decimal('0.00')

    if cobertura.get('tiene_cobertura') and cobertura.get('convenio'):
        conv = cobertura['convenio']
        pct = Decimal(conv['porcentaje_cobertura'])
        monto_cobertura = _q(base * pct / Decimal('100'))
        copago = _q(Decimal(conv['copago_monto']))

    paciente_antes_descuento = _q(base - monto_cobertura + copago)
    if paciente_antes_descuento < 0:
        paciente_antes_descuento = Decimal('0.00')

    monto_descuento = Decimal('0.00')
    promocion_aplicada: dict[str, Any] | None = None
    promocion_id_final: int | None = None

    if promocion_id:
        verif = verificar_aplicacion_promocion(paciente_id, promocion_id, fecha=ref)
        if not verif.get('puede_aplicar'):
            raise ValidationError(verif.get('motivo') or 'Promoción no aplicable.')
        promocion_aplicada = verif.get('promocion')
        promocion_id_final = promocion_id
    else:
        beneficios = listar_beneficios_aplicables(paciente_id, fecha=ref)
        promocion_aplicada = beneficios.get('mejor_beneficio')
        if promocion_aplicada:
            promocion_id_final = promocion_aplicada.get('id_promocion')

    if promocion_aplicada:
        valor = Decimal(str(promocion_aplicada['valor']))
        if promocion_aplicada['tipo_beneficio'] == TipoBeneficio.PORCENTAJE:
            monto_descuento = _q(paciente_antes_descuento * valor / Decimal('100'))
        else:
            monto_descuento = _q(min(valor, paciente_antes_descuento))

    monto_total = _q(max(paciente_antes_descuento - monto_descuento, Decimal('0.00')))

    return {
        'paciente_id': paciente_id,
        'id_servicio': servicio.pk,
        'servicio_codigo': servicio.codigo,
        'servicio_nombre': servicio.nombre,
        'id_cita': id_cita,
        'fecha_referencia': ref.isoformat(),
        'monto_base': str(base),
        'monto_cobertura_seguro': str(monto_cobertura),
        'copago_seguro': str(copago),
        'monto_subtotal_paciente': str(paciente_antes_descuento),
        'monto_descuento': str(monto_descuento),
        'monto_total': str(monto_total),
        'saldo_pendiente': str(monto_total),
        'id_promocion_aplicada': promocion_id_final,
        'cobertura_seguro': cobertura,
        'promocion_aplicada': promocion_aplicada,
    }


def emitir_factura(
    paciente_id: int,
    *,
    id_servicio: int | None = None,
    id_cita: int | None = None,
    fecha: date | None = None,
    promocion_id: int | None = None,
    observaciones: str = '',
    creado_por=None,
    notificar: bool = True,
) -> FacturaClinica:
    calculo = calcular_montos_factura(
        paciente_id,
        id_servicio=id_servicio,
        id_cita=id_cita,
        fecha=fecha,
        promocion_id=promocion_id,
    )
    ref = date.fromisoformat(calculo['fecha_referencia'])

    promocion = None
    if calculo.get('id_promocion_aplicada'):
        from apps.administracionFinanciera.descuentos.models import PromocionDescuento

        promocion = PromocionDescuento.objects.filter(pk=calculo['id_promocion_aplicada']).first()

    factura = FacturaClinica(
        id_paciente_id=paciente_id,
        id_servicio_id=calculo['id_servicio'],
        id_cita_id=id_cita,
        estado=EstadoFactura.EMITIDA,
        fecha_emision=ref,
        fecha_referencia_calculo=ref,
        monto_base=Decimal(calculo['monto_base']),
        monto_cobertura_seguro=Decimal(calculo['monto_cobertura_seguro']),
        copago_seguro=Decimal(calculo['copago_seguro']),
        monto_descuento=Decimal(calculo['monto_descuento']),
        monto_total=Decimal(calculo['monto_total']),
        saldo_pendiente=Decimal(calculo['monto_total']),
        id_promocion_aplicada=promocion,
        detalle_calculo=calculo,
        observaciones=observaciones or '',
        creado_por=creado_por,
    )
    factura.save()
    if notificar:
        notificar_paciente_factura(factura, 'EMITIDA')
    return factura


def registrar_cobro_factura(
    factura: FacturaClinica,
    monto: Decimal,
    metodo_pago: str,
    *,
    estado: str = EstadoCobro.CONFIRMADO,
    referencia_pasarela: str = '',
    observaciones: str = '',
    registrado_por=None,
    notificar: bool = True,
):
    if factura.estado == EstadoFactura.ANULADA:
        raise ValidationError('No se puede cobrar una factura anulada.')

    if factura.estado == EstadoFactura.PAGADA:
        raise ValidationError('La factura ya está pagada.')

    if metodo_pago == MetodoPagoClinico.EN_LINEA and estado == EstadoCobro.CONFIRMADO:
        raise ValidationError(
            'Use iniciar-pago-en-linea y confirmar-pasarela para cobros EN_LINEA.',
        )

    monto = _q(monto)
    if monto > factura.saldo_pendiente:
        raise ValidationError('El monto del cobro supera el saldo pendiente.')

    cobro = CobroClinico.objects.create(
        id_factura=factura,
        monto=monto,
        metodo_pago=metodo_pago,
        estado=estado,
        referencia_pasarela=referencia_pasarela or '',
        observaciones=observaciones or '',
        registrado_por=registrado_por,
    )

    if estado == EstadoCobro.CONFIRMADO:
        aplicar_cobro_confirmado_a_factura(factura, monto)
        if notificar:
            notificar_paciente_factura(factura, 'PAGO_CONFIRMADO')

    return cobro


def anular_factura(factura: FacturaClinica) -> FacturaClinica:
    if factura.estado == EstadoFactura.PAGADA:
        raise ValidationError('No se puede anular una factura totalmente pagada.')
    if factura.cobros.filter(estado=EstadoCobro.CONFIRMADO).exists():
        raise ValidationError('Anule o revierta los cobros confirmados antes de anular la factura.')

    factura.estado = EstadoFactura.ANULADA
    factura.saldo_pendiente = Decimal('0.00')
    factura.save(update_fields=['estado', 'saldo_pendiente', 'updated_at'])
    return factura
