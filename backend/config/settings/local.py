"""
Oftalmología Si2 — Local Development Settings
===============================================
Configuración para desarrollo local.
"""

from .base import *  # noqa: F401,F403

# =============================================================================
# DEBUG
# =============================================================================
DEBUG = True

# =============================================================================
# ALLOWED HOSTS
# =============================================================================
ALLOWED_HOSTS = ['*']

# =============================================================================
# CORS — Permisivo en desarrollo
# =============================================================================
CORS_ALLOW_ALL_ORIGINS = True

# =============================================================================
# EMAIL — Console backend para desarrollo
# =============================================================================
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# =============================================================================
# STATIC FILES
# =============================================================================
STATICFILES_DIRS = [BASE_DIR / 'static'] if (BASE_DIR / 'static').exists() else []

# =============================================================================
# DRF — Browsable API habilitada en desarrollo
# =============================================================================
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = (  # noqa: F405
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',
)

# =============================================================================
# LOGGING — Más verbose en desarrollo
# =============================================================================
LOGGING['loggers']['django.db.backends'] = {  # noqa: F405
    'handlers': ['console'],
    'level': 'WARNING',
    'propagate': False,
}
