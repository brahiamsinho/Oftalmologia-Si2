"""
Derivación de casos críticos detectados por el asistente virtual.
"""
from __future__ import annotations

import logging
import re
import unicodedata
from dataclasses import dataclass, field
from typing import Any

from apps.bitacora.models import AccionBitacora
from apps.core.utils import registrar_bitacora
from apps.crm.notificaciones.services import enviar_push_a_usuario
from apps.usuarios.users.models import EstadoUsuario, TipoUsuario, Usuario

logger = logging.getLogger(__name__)

DERIVATION_NOTIFICATION_TYPE = 'derivacion_urgente'
_STAFF_TYPES = (
    TipoUsuario.ADMINISTRATIVO,
    TipoUsuario.MEDICO,
    TipoUsuario.ESPECIALISTA,
    TipoUsuario.ADMIN,
)

_CRITICAL_PATTERNS: tuple[tuple[str, str], ...] = (
    (r'perdida (?:subita|repentina)? de vision', 'pérdida súbita de visión'),
    (r'vision (?:muy )?borrosa (?:subita|repentina)', 'visión borrosa súbita'),
    (r'dolor ocular intenso', 'dolor ocular intenso'),
    (r'trauma ocular', 'trauma ocular'),
    (r'golpe (?:en )?el ojo', 'golpe en el ojo'),
    (r'salpicadura quimica', 'exposición química'),
    (r'quemadura quimica', 'quemadura química'),
    (r'destellos', 'destellos o luces repentinas'),
    (r'moscas volantes subitas', 'moscas volantes súbitas'),
    (r'cortina en la vision', 'sombra o cortina en la visión'),
    (r'sangrado ocular', 'sangrado ocular'),
    (r'cuerpo extrano', 'cuerpo extraño en el ojo'),
)

_WARNING_PATTERNS: tuple[tuple[str, str], ...] = (
    (r'dolor ocular', 'dolor ocular'),
    (r'vision borrosa', 'visión borrosa'),
    (r'ojo rojo', 'ojo rojo'),
    (r'fotofobia', 'sensibilidad a la luz'),
    (r'hinchazon', 'hinchazón'),
    (r'lagrimeo intenso', 'lagrimeo intenso'),
    (r'nauseas', 'náuseas'),
    (r'cefalea', 'dolor de cabeza'),
)


def _normalize_text(value: str | None) -> str:
    raw = value or ''
    normalized = unicodedata.normalize('NFD', raw)
    without_accents = ''.join(ch for ch in normalized if not unicodedata.combining(ch))
    return re.sub(r'\s+', ' ', without_accents).strip().lower()


def _unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


@dataclass(slots=True)
class DerivationOutcome:
    derivada: bool
    es_urgente: bool
    motivo: str | None = None
    senales: list[str] = field(default_factory=list)
    destinatarios: int = 0
    tipo_notificacion: str = DERIVATION_NOTIFICATION_TYPE
    titulo_notificacion: str | None = None
    cuerpo_notificacion: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            'derivada': self.derivada,
            'es_urgente': self.es_urgente,
            'motivo': self.motivo,
            'senales': self.senales,
            'destinatarios': self.destinatarios,
            'tipo_notificacion': self.tipo_notificacion,
            'titulo_notificacion': self.titulo_notificacion,
            'cuerpo_notificacion': self.cuerpo_notificacion,
        }


def detect_critical_case(message: str, reply: str) -> DerivationOutcome:
    text = _normalize_text(f'{message}\n{reply}')
    critical_hits: list[str] = []
    warning_hits: list[str] = []

    for pattern, label in _CRITICAL_PATTERNS:
        if re.search(pattern, text):
            critical_hits.append(label)

    for pattern, label in _WARNING_PATTERNS:
        if re.search(pattern, text):
            warning_hits.append(label)

    critical_hits = _unique(critical_hits)
    warning_hits = _unique(warning_hits)

    derivada = bool(critical_hits) or len(warning_hits) >= 2
    if not derivada:
        return DerivationOutcome(derivada=False, es_urgente=False, senales=_unique(critical_hits + warning_hits))

    señales = critical_hits or warning_hits[:2]
    motivo = ', '.join(señales)
    return DerivationOutcome(
        derivada=True,
        es_urgente=True,
        motivo=motivo,
        senales=_unique(critical_hits + warning_hits),
    )


def derive_critical_case_to_staff(*, user: Usuario, message: str, reply: str) -> dict[str, Any]:
    """
    Detecta un caso crítico, notifica al personal activo y registra bitácora.
    """
    outcome = detect_critical_case(message, reply)
    if not outcome.derivada:
        return outcome.as_dict()

    requester_name = (user.get_full_name() or user.username or 'Usuario').strip()
    summary = outcome.motivo or 'signos de alarma detectados'
    titulo = 'Caso urgente derivado al equipo humano'
    cuerpo = (
        f'{requester_name} consultó al asistente. '
        f'Se detectaron signos de alarma: {summary}. '
        'Revisar la conversación y coordinar atención prioritaria.'
    )
    payload = {
        'origen': 'asistente_virtual',
        'nivel': 'urgente',
        'tipo': DERIVATION_NOTIFICATION_TYPE,
    }

    recipients = list(
        Usuario.objects.filter(
            is_active=True,
            estado=EstadoUsuario.ACTIVO,
            tipo_usuario__in=_STAFF_TYPES,
        )
        .exclude(pk=user.pk)
        .only('id', 'username', 'nombres', 'apellidos', 'tipo_usuario'),
    )

    if not recipients:
        logger.warning('No se encontraron usuarios de staff para derivar el caso urgente del asistente.')

    for recipient in recipients:
        enviar_push_a_usuario(
            recipient.pk,
            titulo,
            cuerpo,
            data=payload,
            tipo=DERIVATION_NOTIFICATION_TYPE,
        )

    registrar_bitacora(
        usuario=user,
        modulo='ia',
        accion=AccionBitacora.DERIVAR,
        descripcion=(
            f'Derivó caso urgente del asistente a {len(recipients)} usuarios de staff. '
            f'Señales detectadas: {summary}.'
        ),
        tabla_afectada='notificaciones_notificacion',
    )

    outcome.destinatarios = len(recipients)
    outcome.titulo_notificacion = titulo
    outcome.cuerpo_notificacion = cuerpo
    return outcome.as_dict()
