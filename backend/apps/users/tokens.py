"""
apps/users/tokens.py
Tokens de recuperación de contraseña (un solo uso, 2h vigencia).
"""
import secrets
from datetime import timedelta

from django.utils import timezone


def generar_token():
    """Genera un token URL-safe aleatorio de 48 bytes."""
    return secrets.token_urlsafe(48)


def crear_token_recuperacion(usuario):
    """
    Invalida tokens anteriores activos del usuario y crea uno nuevo.
    Retorna el objeto TokenRecuperacion creado.
    """
    from .models import TokenRecuperacion

    TokenRecuperacion.objects.filter(id_usuario=usuario, usado=False).update(usado=True)
    expira_en = timezone.now() + timedelta(hours=2)
    return TokenRecuperacion.objects.create(
        id_usuario=usuario,
        token=generar_token(),
        expira_en=expira_en,
    )


def validar_token_recuperacion(token_str):
    """
    Retorna (TokenRecuperacion, None) si válido.
    Retorna (None, 'mensaje') si inválido o expirado.
    """
    from .models import TokenRecuperacion

    try:
        token = TokenRecuperacion.objects.select_related('id_usuario').get(
            token=token_str, usado=False
        )
    except TokenRecuperacion.DoesNotExist:
        return None, 'Token inválido o ya utilizado.'

    if token.expira_en < timezone.now():
        return None, 'El token ha expirado. Solicita uno nuevo.'

    return token, None
