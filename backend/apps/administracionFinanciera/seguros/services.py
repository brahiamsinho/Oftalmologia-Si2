"""
Lógica de negocio CU19 — verificación de cobertura vigente.
"""
from __future__ import annotations

from datetime import date
from typing import Any

from django.utils import timezone

from apps.pacientes.pacientes.models import Paciente

from .models import AfiliacionSeguroPaciente, Convenio


def _fecha_en_rango(inicio: date, fin: date | None, ref: date) -> bool:
    if inicio > ref:
        return False
    if fin and fin < ref:
        return False
    return True


def convenio_vigente_en(convenio: Convenio, ref: date) -> bool:
    if not convenio.activo:
        return False
    return _fecha_en_rango(convenio.fecha_inicio, convenio.fecha_fin, ref)


def afiliacion_vigente_en(afiliacion: AfiliacionSeguroPaciente, ref: date) -> bool:
    if not afiliacion.activo:
        return False
    if not convenio_vigente_en(afiliacion.id_convenio, ref):
        return False
    return _fecha_en_rango(afiliacion.fecha_inicio, afiliacion.fecha_fin, ref)


def verificar_cobertura_paciente(paciente_id: int, *, fecha: date | None = None) -> dict[str, Any]:
    """
    Devuelve la cobertura principal vigente del paciente en una fecha de referencia.

    Usado por admisión/facturación antes de atender (CU20 integra vía apps.facturacion).
    """
    ref = fecha or timezone.localdate()

    try:
        paciente = Paciente.objects.get(pk=paciente_id)
    except Paciente.DoesNotExist:
        return {
            'tiene_cobertura': False,
            'motivo': 'Paciente no encontrado.',
            'paciente_id': paciente_id,
            'fecha_referencia': ref.isoformat(),
        }

    afiliaciones = (
        AfiliacionSeguroPaciente.objects.filter(
            id_paciente=paciente,
            activo=True,
        )
        .select_related('id_convenio', 'id_convenio__id_aseguradora')
        .order_by('-es_principal', '-fecha_inicio')
    )

    for afiliacion in afiliaciones:
        if not afiliacion_vigente_en(afiliacion, ref):
            continue

        convenio = afiliacion.id_convenio
        return {
            'tiene_cobertura': True,
            'paciente_id': paciente.pk,
            'fecha_referencia': ref.isoformat(),
            'afiliacion_id': afiliacion.pk,
            'numero_afiliado': afiliacion.numero_afiliado,
            'es_principal': afiliacion.es_principal,
            'convenio': {
                'id': convenio.pk,
                'codigo': convenio.codigo,
                'nombre': convenio.nombre,
                'porcentaje_cobertura': str(convenio.porcentaje_cobertura),
                'copago_monto': str(convenio.copago_monto),
            },
            'aseguradora': {
                'id': convenio.id_aseguradora_id,
                'codigo': convenio.id_aseguradora.codigo,
                'nombre': convenio.id_aseguradora.nombre,
            },
        }

    return {
        'tiene_cobertura': False,
        'motivo': 'Sin afiliación vigente en la fecha indicada.',
        'paciente_id': paciente.pk,
        'fecha_referencia': ref.isoformat(),
    }
