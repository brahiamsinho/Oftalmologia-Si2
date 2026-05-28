from django.apps import AppConfig


class AutomatizacionesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notificaciones.automatizaciones'
    verbose_name = 'Automatizaciones de Notificaciones'

    def ready(self):
        # noqa: F401 — registra post_save para citas y postoperatorio (CU17)
        from . import signals  # pylint: disable=import-outside-toplevel
