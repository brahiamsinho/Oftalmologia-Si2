"""
apps/users/emails.py
Correos transaccionales del sistema.
En desarrollo → Mailhog (http://localhost:8025).
En producción → SMTP real configurado en .env.
"""
import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger('apps')


def enviar_bienvenida(usuario):
    """Email de bienvenida post-registro. Falla silenciosamente."""
    subject = 'Bienvenido — Clínica Oftalmológica Si2'
    message = (
        f'Hola {usuario.nombres},\n\n'
        f'Tu cuenta ha sido registrada exitosamente.\n\n'
        f'Usuario: {usuario.username}\n'
        f'Correo:  {usuario.email}\n\n'
        f'Ya puedes acceder al sistema.\n\n'
        f'Clínica Oftalmológica Si2'
    )
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL,
                  [usuario.email], fail_silently=True)
    except Exception as exc:
        logger.warning(f'[email:bienvenida] {usuario.email} — {exc}')


def enviar_recuperacion_password(usuario, token_str):
    """Email con enlace de recuperación de contraseña (expira en 2h)."""
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    reset_url = f'{frontend_url}/auth/reset-password?token={token_str}'

    subject = 'Recuperación de contraseña — Clínica Oftalmológica Si2'
    message = (
        f'Hola {usuario.nombres},\n\n'
        f'Recibimos una solicitud para restablecer tu contraseña.\n\n'
        f'Accede al siguiente enlace (válido 2 horas):\n'
        f'{reset_url}\n\n'
        f'Si no solicitaste este cambio, ignora este mensaje.\n\n'
        f'Clínica Oftalmológica Si2'
    )
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL,
                  [usuario.email], fail_silently=False)
    except Exception as exc:
        logger.error(f'[email:recuperacion] {usuario.email} — {exc}')
        raise
