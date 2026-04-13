"""
apps/users/emails.py
Correos transaccionales del sistema.
Mailhog / SMTP según EMAIL_* en .env; UI de Mailhog en el puerto HOST_PORT_MAILHOG_UI del compose.
"""
import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger('apps')


def enviar_confirmacion_registro(usuario) -> bool:
    """
    Correo de confirmación tras registro (cuenta ya activa; JWT en la respuesta API).

    Returns:
        True si Django entregó el mensaje al backend de correo (p. ej. Mailhog en dev).
        False si hubo error (el usuario igual queda creado).
    """
    brand = getattr(settings, 'SITE_DISPLAY_NAME', 'Oftalmología Si2')
    subject = f'Confirmación de registro — {brand}'
    tipo_display = ''
    try:
        tipo_display = usuario.get_tipo_usuario_display()
    except Exception:
        tipo_display = str(getattr(usuario, 'tipo_usuario', '') or '')

    hint = getattr(settings, 'REGISTRATION_EMAIL_FOOTER_HINT', '') or ''
    hint = hint.strip()

    message = (
        f'Hola {usuario.nombres},\n\n'
        f'Tu registro en {brand} se completó correctamente.\n\n'
        f'Usuario: {usuario.username}\n'
        f'Correo:  {usuario.email}\n'
        f'Tipo de cuenta: {tipo_display}\n\n'
        f'Ya podés iniciar sesión en la aplicación móvil o en el panel web.\n\n'
        f'---\n'
        f'Este mensaje es informativo; no hace falta responder.\n'
    )
    if hint:
        message += f'\n{hint}\n'
    message += f'\n{brand}'

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [usuario.email],
            fail_silently=False,
        )
        return True
    except Exception as exc:
        logger.warning('[email:confirmacion_registro] %s — %s', usuario.email, exc)
        return False


def enviar_bienvenida(usuario) -> bool:
    """Alias retrocompatible con el nombre anterior."""
    return enviar_confirmacion_registro(usuario)


def enviar_recuperacion_password(usuario, token_str):
    """Email con enlace de recuperación de contraseña (expira en 2h)."""
    frontend_url = settings.FRONTEND_URL
    reset_url = f'{frontend_url}/auth/reset-password?token={token_str}'

    brand = getattr(settings, 'SITE_DISPLAY_NAME', 'Oftalmología Si2')
    subject = f'Recuperación de contraseña — {brand}'
    message = (
        f'Hola {usuario.nombres},\n\n'
        f'Recibimos una solicitud para restablecer tu contraseña.\n\n'
        f'Accedé al siguiente enlace (válido 2 horas):\n'
        f'{reset_url}\n\n'
        f'Si no solicitaste este cambio, ignorá este mensaje.\n\n'
        f'{brand}'
    )
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL,
                  [usuario.email], fail_silently=False)
    except Exception as exc:
        logger.error(f'[email:recuperacion] {usuario.email} — {exc}')
        raise
