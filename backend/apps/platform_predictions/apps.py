from django.apps import AppConfig


class PlatformPredictionsConfig(AppConfig):
    """
    App de predicciones con Random Forest para el superadmin de plataforma.

    Vive en el schema PUBLIC (SHARED_APPS).
    No tiene acceso directo a datos de clínicas; extrae solo agregados
    usando schema_context de django-tenants.

    Caso de uso académico inicial:
      - Predice riesgo_operativo_tenant: bajo | medio | alto
      - Usa datos históricos de actividad por clínica

    PUDS:
      - CU23+ (Inteligencia de plataforma)
      - Fase: Diseño e Implementación
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.platform_predictions'
    verbose_name = 'Predicciones de Plataforma (Random Forest)'
