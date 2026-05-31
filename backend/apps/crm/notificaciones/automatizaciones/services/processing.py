"""
Ejecución de tareas de recordatorio pendientes (CU17).
"""
from __future__ import annotations

from django.utils import timezone

from apps.crm.notificaciones.services import enviar_push_a_usuario

from ..models import (
    EstadoTarea,
    LogEjecucionRecordatorio,
    NivelLog,
    TareaRecordatorioProgramada,
    TipoReglaRecordatorio,
)


def _nombre_paciente(paciente) -> str:
    return f'{paciente.nombres} {paciente.apellidos}'.strip()


def _render_templates(tarea: TareaRecordatorioProgramada) -> tuple[str, str, str]:
    """Devuelve (titulo, cuerpo, tipo_notificacion)."""
    paciente = tarea.id_paciente
    nombre = _nombre_paciente(paciente)
    regla = tarea.id_regla
    tipo = regla.tipo_regla

    if tipo == TipoReglaRecordatorio.RECORDATORIO_CITA and tarea.id_cita_id:
        cita = tarea.id_cita
        fecha_txt = cita.fecha_hora_inicio.strftime('%Y-%m-%d %H:%M')
        titulo = regla.titulo_template.format(paciente=nombre, fecha_cita=fecha_txt)
        cuerpo = regla.cuerpo_template.format(paciente=nombre, fecha_cita=fecha_txt)
        return titulo, cuerpo, 'recordatorio_cita'

    if tarea.id_postoperatorio_id and tarea.id_postoperatorio.proximo_control:
        fecha_control = tarea.id_postoperatorio.proximo_control.strftime('%Y-%m-%d %H:%M')
        titulo = regla.titulo_template.format(paciente=nombre, fecha_control=fecha_control)
        cuerpo = regla.cuerpo_template.format(paciente=nombre, fecha_control=fecha_control)
        return titulo, cuerpo, 'recordatorio_control'

    titulo = regla.titulo_template.format(paciente=nombre, fecha_control='', fecha_cita='')
    cuerpo = regla.cuerpo_template.format(paciente=nombre, fecha_control='', fecha_cita='')
    return titulo, cuerpo, 'recordatorio_control'


def procesar_tarea_recordatorio(tarea: TareaRecordatorioProgramada) -> TareaRecordatorioProgramada:
    if tarea.estado != EstadoTarea.PENDIENTE:
        return tarea

    try:
        if tarea.payload.get('forzar_error'):
            raise ValueError('Error forzado para pruebas de resiliencia.')

        paciente = tarea.id_paciente
        titulo, cuerpo, tipo_notif = _render_templates(tarea)

        if paciente.usuario_id:
            push_data = {'tarea_id': str(tarea.id_tarea)}
            if tarea.id_cita_id:
                push_data['cita_id'] = str(tarea.id_cita_id)
            if tarea.id_postoperatorio_id:
                push_data['postoperatorio_id'] = str(tarea.id_postoperatorio_id)

            enviar_push_a_usuario(
                usuario_id=paciente.usuario_id,
                titulo=titulo,
                cuerpo=cuerpo,
                data=push_data,
                tipo=tipo_notif,
            )

        tarea.marcar_procesada()

        LogEjecucionRecordatorio.objects.create(
            id_tarea=tarea,
            nivel=NivelLog.INFO,
            mensaje='Recordatorio procesado correctamente.',
        )

    except Exception as exc:
        tarea.marcar_error()

        LogEjecucionRecordatorio.objects.create(
            id_tarea=tarea,
            nivel=NivelLog.ERROR,
            mensaje='Error al procesar recordatorio.',
            detalle=str(exc),
        )

    return tarea


def procesar_recordatorios_pendientes(*, limit: int = 100) -> int:
    """
    Procesa hasta ``limit`` tareas vencidas en el schema actual.

    Debe invocarse dentro de ``tenant_context`` cuando se use django-tenants.
    """
    limit = max(1, int(limit))
    pendientes = TareaRecordatorioProgramada.objects.filter(
        estado=EstadoTarea.PENDIENTE,
        programada_para__lte=timezone.now(),
    ).order_by('programada_para')[:limit]

    total = 0
    for tarea in pendientes:
        procesar_tarea_recordatorio(tarea)
        total += 1

    return total
