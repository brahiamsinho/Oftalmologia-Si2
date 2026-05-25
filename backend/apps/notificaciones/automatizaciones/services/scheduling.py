"""
Programación de tareas de recordatorio (CU17).
"""
from __future__ import annotations

from datetime import timedelta

from django.utils import timezone

from apps.atencionClinica.citas.models import Cita, EstadoCita
from apps.atencionClinica.postoperatorio.models import Postoperatorio

from ..models import EstadoTarea, ReglaRecordatorio, TareaRecordatorioProgramada, TipoReglaRecordatorio

_ESTADOS_CITA_SIN_RECORDATORIO = frozenset({
    EstadoCita.CANCELADA,
    EstadoCita.ATENDIDA,
    EstadoCita.NO_ASISTIO,
})

NOMBRE_REGLA_POSTOP_DEFAULT = 'Control postoperatorio 24h'
NOMBRE_REGLA_CITA_DEFAULT = 'Recordatorio de cita 24h'


def obtener_regla_activa(tipo_regla: str, *, nombre: str | None = None) -> ReglaRecordatorio | None:
    qs = ReglaRecordatorio.objects.filter(activa=True, tipo_regla=tipo_regla)
    if nombre:
        regla = qs.filter(nombre=nombre).first()
        if regla:
            return regla
    return qs.order_by('horas_antes').first()


def _programada_desde_evento(fecha_evento, horas_antes: int):
    return fecha_evento - timedelta(hours=horas_antes)


def _cancelar_pendientes(**filtros):
    return TareaRecordatorioProgramada.objects.filter(
        estado=EstadoTarea.PENDIENTE,
        **filtros,
    ).update(estado=EstadoTarea.CANCELADA)


def programar_recordatorio_postoperatorio(
    postoperatorio: Postoperatorio,
    regla: ReglaRecordatorio | None = None,
) -> TareaRecordatorioProgramada | None:
    if postoperatorio.proximo_control is None:
        return None

    regla = regla or obtener_regla_activa(
        TipoReglaRecordatorio.CONTROL_POSTOPERATORIO,
        nombre=NOMBRE_REGLA_POSTOP_DEFAULT,
    )
    if regla is None:
        return None

    programada_para = _programada_desde_evento(postoperatorio.proximo_control, regla.horas_antes)
    if programada_para <= timezone.now():
        return None

    _cancelar_pendientes(
        id_postoperatorio=postoperatorio,
        id_regla=regla,
    )

    return TareaRecordatorioProgramada.objects.create(
        id_regla=regla,
        id_paciente=postoperatorio.id_paciente,
        id_postoperatorio=postoperatorio,
        programada_para=programada_para,
        payload={
            'tipo': TipoReglaRecordatorio.CONTROL_POSTOPERATORIO,
            'paciente_id': postoperatorio.id_paciente_id,
            'postoperatorio_id': postoperatorio.id_postoperatorio,
            'proximo_control': postoperatorio.proximo_control.isoformat(),
        },
    )


def programar_recordatorio_cita(
    cita: Cita,
    regla: ReglaRecordatorio | None = None,
) -> TareaRecordatorioProgramada | None:
    if cita.estado in _ESTADOS_CITA_SIN_RECORDATORIO:
        _cancelar_pendientes(id_cita=cita)
        return None

    if cita.fecha_hora_inicio <= timezone.now():
        return None

    regla = regla or obtener_regla_activa(
        TipoReglaRecordatorio.RECORDATORIO_CITA,
        nombre=NOMBRE_REGLA_CITA_DEFAULT,
    )
    if regla is None:
        return None

    programada_para = _programada_desde_evento(cita.fecha_hora_inicio, regla.horas_antes)
    if programada_para <= timezone.now():
        return None

    _cancelar_pendientes(id_cita=cita, id_regla=regla)

    return TareaRecordatorioProgramada.objects.create(
        id_regla=regla,
        id_paciente=cita.id_paciente,
        id_cita=cita,
        programada_para=programada_para,
        payload={
            'tipo': TipoReglaRecordatorio.RECORDATORIO_CITA,
            'paciente_id': cita.id_paciente_id,
            'cita_id': cita.id_cita,
            'fecha_hora_inicio': cita.fecha_hora_inicio.isoformat(),
        },
    )


def sync_recordatorios_postoperatorio(postoperatorio: Postoperatorio) -> TareaRecordatorioProgramada | None:
    _cancelar_pendientes(id_postoperatorio=postoperatorio)
    if postoperatorio.proximo_control is None:
        return None
    return programar_recordatorio_postoperatorio(postoperatorio)


def sync_recordatorios_cita(cita: Cita) -> TareaRecordatorioProgramada | None:
    if cita.estado in _ESTADOS_CITA_SIN_RECORDATORIO:
        _cancelar_pendientes(id_cita=cita)
        return None
    return programar_recordatorio_cita(cita)
