"""
JWT: separación tokens de **clínica** (tenant schema) vs **plataforma** (public schema).

- ``TenantScopedJWTAuthentication``: rechaza Bearer con ``token_scope=platform``.
- ``PlatformJWTAuthentication``: solo acepta ``token_scope=platform`` y enlaza ``PlatformAdministrator``.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken

TOKEN_SCOPE_PLATFORM = 'platform'
TOKEN_SCOPE_TENANT = 'tenant'


class PlatformJWTUser:
    """
    Wrapper mínimo para ``request.user`` en rutas sólo-plataforma.
    No debe usarse donde se espera ``apps.usuarios.users.models.Usuario``.
    """

    is_authenticated = True
    is_anonymous = False

    def __init__(self, platform_administrator):
        self.platform_administrator = platform_administrator
        self.pk = platform_administrator.pk
        self.id = platform_administrator.pk

    # Compatibilidad con ``IsAuthenticated`` si algún día se cruza código que mira ``is_staff``:
    @property
    def is_staff(self) -> bool:
        return getattr(self.platform_administrator, 'is_staff', True)


class TenantScopedJWTAuthentication(JWTAuthentication):
    """
    Autenticación estándar de clínica: rechaza tokens emitidos para la plataforma.
    Tokens antiguos sin ``token_scope`` se tratan como clínica.
    """

    def get_validated_token(self, raw_token):
        validated = super().get_validated_token(raw_token)
        if validated.get('token_scope') == TOKEN_SCOPE_PLATFORM:
            raise InvalidToken(
                {'detail': 'Token de plataforma no válido en la API de clínica.', 'code': 'token_wrong_scope'},
            )
        return validated


class PlatformJWTAuthentication(JWTAuthentication):
    """
    Autenticación para endpoints bajo schema public que operan ``Tenant``, planes, etc.
    """

    def get_validated_token(self, raw_token):
        validated = super().get_validated_token(raw_token)
        if validated.get('token_scope') != TOKEN_SCOPE_PLATFORM:
            raise InvalidToken(
                {'detail': 'Se requiere token de plataforma.', 'code': 'missing_platform_scope'},
            )
        return validated

    def get_user(self, validated_token):
        user_id = validated_token.get('user_id')
        if user_id is None:
            raise InvalidToken('Token sin user_id')

        from apps.platform_admin.models import PlatformAdministrator

        try:
            admin = PlatformAdministrator.objects.get(pk=user_id)
        except PlatformAdministrator.DoesNotExist as exc:
            raise AuthenticationFailed('Administrador de plataforma no encontrado.') from exc

        if not admin.is_active:
            raise AuthenticationFailed('Cuenta inactiva.')

        return PlatformJWTUser(admin)
