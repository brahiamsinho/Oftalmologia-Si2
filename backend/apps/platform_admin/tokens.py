from datetime import timedelta

from rest_framework_simplejwt.tokens import AccessToken


class PlatformAccessToken(AccessToken):
    """
    Access token firmado con la misma SIGNING_KEY que el resto del proyecto,
    pero con claim ``token_scope='platform'`` para separar de tokens de clínica.

    ``lifetime`` se ajusta en ``PlatformAdminConfig.ready()`` desde settings.
    """

    lifetime = timedelta(minutes=720)

    @classmethod
    def for_admin(cls, admin) -> 'PlatformAccessToken':
        token = cls()
        token['user_id'] = admin.pk
        token['token_scope'] = 'platform'
        token['email'] = admin.email
        return token
