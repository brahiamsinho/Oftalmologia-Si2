"""Registro de dispositivos FCM y envío de mensajes."""

from __future__ import annotations

import logging
from typing import Any

from .firebase_client import ensure_firebase_app
from .models import DispositivoFcm, PlataformaFcm

_logger = logging.getLogger(__name__)


def registrar_dispositivo_fcm(
    usuario,
    token: str | None,
    plataforma: str | None = None,
) -> DispositivoFcm | None:
    """
    Asocia un token FCM al usuario (mismo criterio que POST /notificaciones/dispositivos/).
    Si token viene vacío, no hace nada (p. ej. cliente web sin push).
    """
    if not token:
        return None
    token = str(token).strip()
    if not token:
        return None

    plat = (plataforma or PlataformaFcm.ANDROID).strip().lower()
    validos = {c[0] for c in PlataformaFcm.choices}
    if plat not in validos:
        plat = PlataformaFcm.ANDROID

    try:
        DispositivoFcm.objects.filter(token=token).exclude(usuario=usuario).delete()
        obj, _created = DispositivoFcm.objects.update_or_create(
            token=token,
            defaults={
                'usuario': usuario,
                'plataforma': plat,
            },
        )
        return obj
    except Exception as exc:  # noqa: BLE001
        _logger.warning('registrar_dispositivo_fcm: %s', exc)
        return None


def enviar_push_a_usuario(
    usuario_id: int,
    titulo: str,
    cuerpo: str,
    data: dict[str, str] | None = None,
    tipo: str = 'general',
) -> dict[str, Any]:
    """
    Envía notificación push a todos los dispositivos del usuario Y la persiste en BD
    para que aparezca en el historial de la campanita.

    Retorna dict con claves: ok (bool), enviados (int), errores (list).
    """
    from .models import Notificacion

    # Persiste siempre en BD para el historial, independientemente de FCM.
    try:
        Notificacion.objects.create(
            usuario_id=usuario_id,
            titulo=titulo,
            cuerpo=cuerpo,
            tipo=tipo,
        )
    except Exception as exc:  # noqa: BLE001
        _logger.warning('No se pudo guardar Notificacion en BD: %s', exc)

    if not ensure_firebase_app():
        _logger.warning('Firebase no configurado — notificación guardada en BD pero sin push FCM')
        return {'ok': False, 'error': 'Firebase no configurado', 'enviados': 0, 'errores': []}

    from firebase_admin import messaging

    tokens = list(
        DispositivoFcm.objects.filter(usuario_id=usuario_id).values_list('token', flat=True),
    )
    if not tokens:
        return {'ok': True, 'enviados': 0, 'errores': [], 'mensaje': 'Sin dispositivos'}

    errores: list[str] = []
    enviados = 0
    payload_data = {k: str(v) for k, v in (data or {}).items()}

    for token in tokens:
        try:
            msg = messaging.Message(
                notification=messaging.Notification(title=titulo, body=cuerpo),
                data=payload_data,
                token=token,
            )
            messaging.send(msg)
            enviados += 1
            _logger.info('FCM push enviado OK → usuario_id=%s token=…%s titulo="%s"', usuario_id, token[-12:], titulo)
        except Exception as exc:  # noqa: BLE001
            err = str(exc)
            errores.append(err)
            _logger.warning('FCM send falló para token …%s: %s', token[-12:], err)

    _logger.info('enviar_push_a_usuario: usuario_id=%s enviados=%s errores=%s', usuario_id, enviados, errores)
    return {'ok': True, 'enviados': enviados, 'errores': errores}
