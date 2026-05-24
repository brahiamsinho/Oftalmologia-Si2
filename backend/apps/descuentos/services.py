"""
Lógica CU19 — vigencia, compatibilidad con seguros (CU18) y beneficios aplicables.
"""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any

from django.utils import timezone

from apps.pacientes.pacientes.models import Paciente
from apps.seguros.services import verificar_cobertura_paciente

from .models import (
    AlcancePromocion,
    BeneficioPaciente,
    CompatibilidadSeguro,
    EstadoPromocion,
    PromocionDescuento,
    TipoBeneficio,
)


def _fecha_en_rango(inicio: date, fin: date | None, ref: date) -> bool:
    if inicio > ref:
        return False
    if fin and fin < ref:
        return False
    return True


def promocion_vigente_en(promocion: PromocionDescuento, ref: date) -> bool:
    if promocion.estado != EstadoPromocion.ACTIVA:
        return False
    return _fecha_en_rango(promocion.fecha_inicio, promocion.fecha_fin, ref)


def asignacion_vigente_en(beneficio: BeneficioPaciente, ref: date) -> bool:
    if not beneficio.activo:
        return False
    if not promocion_vigente_en(beneficio.id_promocion, ref):
        return False
    return _fecha_en_rango(beneficio.fecha_asignacion, beneficio.fecha_fin, ref)


def _paciente_tiene_seguro_vigente(paciente_id: int, ref: date) -> bool:
    resultado = verificar_cobertura_paciente(paciente_id, fecha=ref)
    return bool(resultado.get('tiene_cobertura'))


def compatible_con_seguro(promocion: PromocionDescuento, paciente_id: int, ref: date) -> tuple[bool, str]:
    tiene_seguro = _paciente_tiene_seguro_vigente(paciente_id, ref)

    if promocion.compatibilidad_seguro == CompatibilidadSeguro.CUALQUIERA:
        return True, ''

    if promocion.compatibilidad_seguro == CompatibilidadSeguro.SOLO_SIN_SEGURO:
        if tiene_seguro:
            return False, 'Esta promoción solo aplica a pacientes sin cobertura de seguro vigente.'
        return True, ''

    if promocion.compatibilidad_seguro == CompatibilidadSeguro.INCOMPATIBLE_SEGURO:
        if tiene_seguro:
            return False, 'No es compatible con un seguro o convenio vigente del paciente.'
        return True, ''

    return True, ''


def _promocion_aplica_a_paciente(promocion: PromocionDescuento, paciente_id: int, ref: date) -> bool:
    if promocion.alcance == AlcancePromocion.GENERAL:
        return True
    return BeneficioPaciente.objects.filter(
        id_paciente_id=paciente_id,
        id_promocion=promocion,
        activo=True,
    ).exists()


def _serializar_promocion(promocion: PromocionDescuento, *, aplicable: bool, motivo: str = '') -> dict[str, Any]:
    return {
        'id_promocion': promocion.pk,
        'codigo': promocion.codigo,
        'nombre': promocion.nombre,
        'descripcion': promocion.descripcion,
        'tipo_beneficio': promocion.tipo_beneficio,
        'valor': str(promocion.valor),
        'alcance': promocion.alcance,
        'compatibilidad_seguro': promocion.compatibilidad_seguro,
        'acumulable': promocion.acumulable,
        'condiciones_aplicacion': promocion.condiciones_aplicacion,
        'vigente_hoy': promocion.vigente_hoy,
        'aplicable': aplicable,
        'motivo_no_aplicable': motivo,
    }


def listar_beneficios_aplicables(
    paciente_id: int,
    *,
    fecha: date | None = None,
) -> dict[str, Any]:
    ref = fecha or timezone.localdate()

    try:
        paciente = Paciente.objects.get(pk=paciente_id)
    except Paciente.DoesNotExist:
        return {
            'paciente_id': paciente_id,
            'fecha_referencia': ref.isoformat(),
            'beneficios': [],
            'mejor_beneficio': None,
            'motivo': 'Paciente no encontrado.',
        }

    promociones = PromocionDescuento.objects.filter(estado=EstadoPromocion.ACTIVA).order_by('-fecha_inicio')
    items: list[dict[str, Any]] = []
    aplicables: list[dict[str, Any]] = []

    for promocion in promociones:
        if not promocion_vigente_en(promocion, ref):
            items.append(_serializar_promocion(promocion, aplicable=False, motivo='Promoción fuera de vigencia.'))
            continue

        if not _promocion_aplica_a_paciente(promocion, paciente.pk, ref):
            if promocion.alcance == AlcancePromocion.ASIGNADA:
                asig = BeneficioPaciente.objects.filter(
                    id_paciente=paciente,
                    id_promocion=promocion,
                    activo=True,
                ).first()
                if asig and not asignacion_vigente_en(asig, ref):
                    items.append(
                        _serializar_promocion(
                            promocion,
                            aplicable=False,
                            motivo='La asignación al paciente no está vigente.',
                        ),
                    )
                    continue
            items.append(
                _serializar_promocion(
                    promocion,
                    aplicable=False,
                    motivo='Promoción no asignada a este paciente.',
                ),
            )
            continue

        if promocion.alcance == AlcancePromocion.ASIGNADA:
            asig = BeneficioPaciente.objects.filter(
                id_paciente=paciente,
                id_promocion=promocion,
                activo=True,
            ).first()
            if not asig or not asignacion_vigente_en(asig, ref):
                items.append(
                    _serializar_promocion(
                        promocion,
                        aplicable=False,
                        motivo='La asignación al paciente no está vigente.',
                    ),
                )
                continue

        ok_seguro, motivo_seguro = compatible_con_seguro(promocion, paciente.pk, ref)
        if not ok_seguro:
            items.append(_serializar_promocion(promocion, aplicable=False, motivo=motivo_seguro))
            continue

        row = _serializar_promocion(promocion, aplicable=True)
        items.append(row)
        aplicables.append(row)

    if len(aplicables) > 1:
        no_acumulables = [b for b in aplicables if not PromocionDescuento.objects.get(pk=b['id_promocion']).acumulable]
        if len(no_acumulables) > 1:
            for b in items:
                if b.get('aplicable') and not PromocionDescuento.objects.get(pk=b['id_promocion']).acumulable:
                    otros = [x for x in no_acumulables if x['id_promocion'] != b['id_promocion']]
                    if otros:
                        b['aplicable'] = False
                        b['motivo_no_aplicable'] = (
                            'Beneficio no acumulable: ya existe otra promoción vigente para el paciente.'
                        )

    aplicables_finales = [b for b in items if b.get('aplicable')]
    mejor = _elegir_mejor_beneficio(aplicables_finales) if aplicables_finales else None

    return {
        'paciente_id': paciente.pk,
        'fecha_referencia': ref.isoformat(),
        'beneficios': items,
        'mejor_beneficio': mejor,
        'total_aplicables': len(aplicables_finales),
    }


def _elegir_mejor_beneficio(aplicables: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not aplicables:
        return None

    def peso(item: dict[str, Any]) -> Decimal:
        valor = Decimal(item['valor'])
        if item['tipo_beneficio'] == TipoBeneficio.PORCENTAJE:
            return valor
        return valor

    return max(aplicables, key=peso)


def verificar_aplicacion_promocion(
    paciente_id: int,
    promocion_id: int,
    *,
    fecha: date | None = None,
) -> dict[str, Any]:
    ref = fecha or timezone.localdate()

    try:
        promocion = PromocionDescuento.objects.get(pk=promocion_id)
    except PromocionDescuento.DoesNotExist:
        return {
            'puede_aplicar': False,
            'motivo': 'Promoción no encontrada.',
            'paciente_id': paciente_id,
            'promocion_id': promocion_id,
        }

    resultado = listar_beneficios_aplicables(paciente_id, fecha=ref)
    match = next(
        (b for b in resultado['beneficios'] if b['id_promocion'] == promocion_id),
        None,
    )
    if not match:
        return {
            'puede_aplicar': False,
            'motivo': 'Promoción no disponible para el paciente.',
            'paciente_id': paciente_id,
            'promocion_id': promocion_id,
            'fecha_referencia': ref.isoformat(),
        }

    return {
        'puede_aplicar': bool(match.get('aplicable')),
        'motivo': match.get('motivo_no_aplicable') or '',
        'paciente_id': paciente_id,
        'promocion_id': promocion_id,
        'fecha_referencia': ref.isoformat(),
        'promocion': match,
    }
