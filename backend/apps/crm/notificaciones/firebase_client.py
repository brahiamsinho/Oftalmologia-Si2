"""Inicialización lazy de Firebase Admin SDK (envío vía FCM HTTP v1)."""

from __future__ import annotations

import logging

import firebase_admin
from django.conf import settings
from firebase_admin import credentials

_logger = logging.getLogger(__name__)


def ensure_firebase_app() -> bool:
    """
    Inicializa firebase_admin si existe ruta a credenciales de servicio.
    Retorna False si no hay credenciales (solo registro de tokens, sin envío).
    """
    if firebase_admin._apps:
        return True

    path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)
    if not path:
        _logger.warning('FIREBASE_CREDENTIALS_PATH no configurado; envío FCM deshabilitado.')
        return False

    try:
        cred = credentials.Certificate(path)
        firebase_admin.initialize_app(cred)
        return True
    except Exception as exc:  # noqa: BLE001
        _logger.exception('No se pudo inicializar Firebase Admin: %s', exc)
        return False
