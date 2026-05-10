from datetime import timedelta

from django.apps import AppConfig


class PlatformAdminConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.platform_admin'
    verbose_name = 'Administración plataforma SaaS'

    def ready(self) -> None:
        from django.conf import settings

        from apps.platform_admin.tokens import PlatformAccessToken

        minutes = int(getattr(settings, 'PLATFORM_JWT_ACCESS_MINUTES', 720))
        PlatformAccessToken.lifetime = timedelta(minutes=minutes)
