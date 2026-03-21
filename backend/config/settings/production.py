"""
Oftalmología Si2 — Production Settings
========================================
Configuración para producción. NUNCA usar en desarrollo.
"""

from .base import *  # noqa: F401,F403

# =============================================================================
# DEBUG — Siempre False en producción
# =============================================================================
DEBUG = False

# =============================================================================
# SECURITY
# =============================================================================
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000  # 1 año
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# =============================================================================
# CORS — Solo orígenes permitidos
# =============================================================================
CORS_ALLOW_ALL_ORIGINS = False

# =============================================================================
# EMAIL — Configurar SMTP real
# =============================================================================
# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = config('EMAIL_HOST')
# EMAIL_PORT = config('EMAIL_PORT', cast=int)
# EMAIL_HOST_USER = config('EMAIL_HOST_USER')
# EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
# EMAIL_USE_TLS = True

# =============================================================================
# STATIC FILES — WhiteNoise para servir estáticos
# =============================================================================
# STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# =============================================================================
# DRF — Solo JSON en producción (sin Browsable API)
# =============================================================================
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = (  # noqa: F405
    'rest_framework.renderers.JSONRenderer',
)

# =============================================================================
# LOGGING — Producción con archivos de log
# =============================================================================
LOGGING['handlers']['file'] = {  # noqa: F405
    'class': 'logging.FileHandler',
    'filename': BASE_DIR / 'logs' / 'django.log',  # noqa: F405
    'formatter': 'verbose',
}
