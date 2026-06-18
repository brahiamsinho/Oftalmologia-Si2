"""Servicio de derivación a atención humana (CU25).

Toma una clasificación crítica de CU24, crea un caso de atención humana,
notifica al personal disponible y registra cada paso en bitácora.
"""
from __future__ import annotations

import logging
from typing import Any

from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.core.utils import registrar_bitacora
from apps.ia.models import (
    ChatbotUrgencyClassification,
    CriticalHumanHandoff,
    EstadoDerivacionHumana,
    NivelUrgenciaChatbot,
)

_logger = logging.getLogger(__name__)

_TIPOS_STAFF = ('ADMIN', 'ADMINISTRATIVO', 'MEDICO', 'ESPECIALISTA')


def _classification_is_valid(classification: ChatbotUrgencyClassification) -> bool:
    """Valida que la clasificación sea derivable."""
    return (
        classification.nivel == NivelUrgenciaChatbot.CRITICO
        and classification.requiere_atencion_humana is True
    )


def find_available_staff():
    """Retorna usuarios activos con perfil de staff clínico/administrativo.

    Considera ADMIN, ADMINISTRATIVO, MEDICO y ESPECIALISTA.
    """
    return get_user_model().objects.filter(
        tipo_usuario__in=_TIPOS_STAFF,
        estado='ACTIVO',
        is_active=True,
    )


def create_handoff(
    classification: ChatbotUrgencyClassification,
    usuario,
    ip_origen: str | None = None,
    user_agent: str | None = None,
) -> CriticalHumanHandoff:
    """Crea una derivación humana desde una clasificación crítica CU24.

    Raises
    ------
    ValueError
        Si la clasificación no es crítica o ya fue derivada.
    """
    if not _classification_is_valid(classification):
        raise ValueError(
            f'La clasificación {classification.id_clasificacion} no es crítica '
            f'y no puede ser derivada (nivel={classification.nivel}).',
        )

    if CriticalHumanHandoff.objects.filter(classification=classification).exists():
        raise ValueError(
            f'Ya existe una derivación para la clasificación '
            f'{classification.id_clasificacion}.',
        )

    paciente = classification.paciente

    handoff = CriticalHumanHandoff.objects.create(
        classification=classification,
        paciente=paciente,
        mensaje_original=classification.mensaje_usuario,
        nivel_urgencia=classification.nivel,
        criterios_detectados=classification.criterios_detectados,
        estado=EstadoDerivacionHumana.PENDIENTE,
    )

    registrar_bitacora(
        usuario=usuario,
        modulo='IA',
        accion='CREAR',
        descripcion=(
            f'Derivación a atención humana creada — '
            f'handoff {handoff.id_handoff} / '
            f'clasificación {classification.id_clasificacion} / '
            f'paciente {paciente.id_paciente}'
        ),
        tabla_afectada=CriticalHumanHandoff._meta.db_table,
        id_registro_afectado=handoff.id_handoff,
        ip_origen=ip_origen,
        user_agent=user_agent,
    )

    _logger.info(
        'CU25 handoff creado: id=%s clasificacion=%s paciente=%s creado_por=%s',
        handoff.id_handoff,
        classification.id_clasificacion,
        paciente.id_paciente,
        usuario,
    )

    return handoff


def notify_available_staff(
    handoff: CriticalHumanHandoff,
    usuario,
    ip_origen: str | None = None,
    user_agent: str | None = None,
) -> dict[str, Any]:
    """Notifica a todo el personal disponible sobre una derivación nueva.

    No lanza excepción si falla la notificación — el handoff ya existe.
    Retorna dict con resultados por usuario notificado.
    """
    from apps.crm.notificaciones.services import enviar_push_a_usuario

    staff = list(find_available_staff())
    results: list[dict[str, Any]] = []

    for staff_user in staff:
        try:
            result = enviar_push_a_usuario(
                usuario_id=staff_user.pk,
                titulo='Derivación crítica — atención requerida',
                cuerpo=(
                    f'Paciente {handoff.paciente} requiere atención humana. '
                    f'Nivel: {handoff.nivel_urgencia}. '
                    f'Handoff #{handoff.id_handoff}.'
                ),
                data={
                    'type': 'human_handoff',
                    'handoff_id': str(handoff.id_handoff),
                },
                tipo='human_handoff',
            )
            results.append({'usuario_id': staff_user.pk, 'resultado': result})
        except Exception as exc:
            _logger.warning(
                'Notificación falló para usuario %s: %s',
                staff_user.pk,
                exc,
            )
            results.append({'usuario_id': staff_user.pk, 'error': str(exc)})

    if staff:
        handoff.estado = EstadoDerivacionHumana.NOTIFICADA
        handoff.notificado_en = timezone.now()
        handoff.save(update_fields=['estado', 'notificado_en', 'updated_at'])

    registrar_bitacora(
        usuario=usuario,
        modulo='IA',
        accion='CREAR',
        descripcion=(
            f'Notificación de handoff {handoff.id_handoff} enviada a '
            f'{len(staff)} personal(es) staff.'
        ),
        tabla_afectada=CriticalHumanHandoff._meta.db_table,
        id_registro_afectado=handoff.id_handoff,
        ip_origen=ip_origen,
        user_agent=user_agent,
    )

    return {
        'notified_count': len(staff),
        'results': results,
        'handoff_id': handoff.id_handoff,
        'new_state': handoff.estado,
    }
