"""
apps/core/utils.py
Utilidades transversales del sistema.
"""
import logging

logger = logging.getLogger('apps')


def get_client_ip(request):
    """Extrae la IP real del cliente, considerando proxies."""
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def registrar_bitacora(
    usuario=None,
    modulo='',
    accion='',
    descripcion=None,
    tabla_afectada=None,
    id_registro_afectado=None,
    ip_origen=None,
    user_agent=None,
):
    """
    Registra un evento en la bitácora del sistema.
    Usa importación lazy para evitar imports circulares.
    Nunca lanza excepción — falla silenciosamente.
    """
    try:
        from apps.bitacora.models import Bitacora
        Bitacora.objects.create(
            id_usuario=usuario,
            modulo=modulo,
            accion=accion,
            descripcion=descripcion,
            tabla_afectada=tabla_afectada,
            id_registro_afectado=id_registro_afectado,
            ip_origen=ip_origen,
            user_agent=user_agent,
        )
    except Exception as exc:
        logger.warning(f'[bitacora] No se pudo registrar evento: {exc}')
