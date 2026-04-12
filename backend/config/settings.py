"""
config/settings.py
============================
Configuración única de Django — un solo archivo.
Los valores específicos de entorno se controlan vía .env

Para producción, sobreescribe via variables de entorno:
  DJANGO_DEBUG=False
  DJANGO_SECRET_KEY=tu-clave-segura
  CORS_ALLOWED_ORIGINS=https://tudominio.com
  (ver .env.example para la lista completa)
"""
import hashlib
from datetime import timedelta
from pathlib import Path

from decouple import Csv, config

# BASE_DIR apunta a la raíz /backend/
# __file__ está en /backend/config/settings.py → .parent.parent
BASE_DIR = Path(__file__).resolve().parent.parent

# =============================================================================
# SEGURIDAD
# =============================================================================
SECRET_KEY = config('DJANGO_SECRET_KEY', default='INSECURE-change-me-in-production')
DEBUG = config('DJANGO_DEBUG', default=True, cast=bool)


def _jwt_signing_key() -> str:
    """HS256 exige clave HMAC ≥ 32 bytes; si SECRET_KEY es corta, se deriva SHA-256 hex (64 chars)."""
    raw = SECRET_KEY
    if len(raw.encode('utf-8')) >= 32:
        return raw
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()
# Obligatorio vía .env (ver .env.example). En DEBUG se añade '*' para IP LAN / móvil sin listar cada host.
_csv_hosts = [h.strip() for h in config('DJANGO_ALLOWED_HOSTS', cast=Csv()) if h.strip()]
ALLOWED_HOSTS = list(_csv_hosts)
if DEBUG and '*' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('*')

# =============================================================================
# APLICACIONES
# =============================================================================
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
]

LOCAL_APPS = [
    'apps.core',
    'apps.usuarios.users',
    'apps.usuarios.permisos',
    'apps.usuarios.roles',
    'apps.bitacora',
    'apps.pacientes.pacientes',
    'apps.atencionClinica.especialistas',
    'apps.pacientes.historial_clinico',
    'apps.atencionClinica.antecedentes',
    'apps.atencionClinica.diagnosticos',
    'apps.atencionClinica.tratamientos',
    'apps.atencionClinica.evoluciones',
    'apps.atencionClinica.recetas',
    'apps.atencionClinica.citas',
    'apps.atencionClinica.consultas',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# =============================================================================
# MIDDLEWARE
# =============================================================================
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

# =============================================================================
# TEMPLATES
# =============================================================================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# =============================================================================
# BASE DE DATOS — PostgreSQL
# =============================================================================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB', default='oftalmologia_db'),
        'USER': config('POSTGRES_USER', default='oftalmologia_user'),
        'PASSWORD': config('POSTGRES_PASSWORD', default='password'),
        'HOST': config('POSTGRES_HOST', default='db'),
        'PORT': config('POSTGRES_PORT', default='5432'),
        'OPTIONS': {
            'connect_timeout': 10,
        },
    }
}

# =============================================================================
# MODELO DE USUARIO PERSONALIZADO
# =============================================================================
AUTH_USER_MODEL = 'users.Usuario'

# =============================================================================
# VALIDACIÓN DE CONTRASEÑAS
# =============================================================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

if DEBUG:
    # Acelerar sustancialmente el inicio de sesión y creación de usuarios
    # localmente al usar un algoritmo de hashing más rápido
    PASSWORD_HASHERS = [
        'django.contrib.auth.hashers.MD5PasswordHasher',
        'django.contrib.auth.hashers.Argon2PasswordHasher',
        'django.contrib.auth.hashers.PBKDF2PasswordHasher',
        'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
        'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    ]

# =============================================================================
# INTERNACIONALIZACIÓN
# =============================================================================
LANGUAGE_CODE = 'es'
# Bolivia (Santa Cruz de la Sierra — mismo huso que La Paz: UTC−4 sin DST)
TIME_ZONE = 'America/La_Paz'
USE_I18N = True
USE_TZ = True

# =============================================================================
# ARCHIVOS ESTÁTICOS Y MULTIMEDIA
# =============================================================================
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static'] if (BASE_DIR / 'static').exists() else []

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =============================================================================
# DJANGO REST FRAMEWORK
# =============================================================================
_drf_renderer_classes = (
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',  # Solo se ve si DEBUG=True
)

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': _drf_renderer_classes,
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    },
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%S%z',
}

# =============================================================================
# SIMPLE JWT
# =============================================================================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=config('JWT_ACCESS_TOKEN_LIFETIME', default=30, cast=int)
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=config('JWT_REFRESH_TOKEN_LIFETIME', default=7, cast=int)
    ),
    'SIGNING_KEY': _jwt_signing_key(),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# =============================================================================
# CORS
# =============================================================================
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = [
        o.strip() for o in config('CORS_ALLOWED_ORIGINS', cast=Csv()) if o.strip()
    ]
    CORS_ALLOW_CREDENTIALS = True

# =============================================================================
# HEADERS DE SEGURIDAD
# =============================================================================
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_BROWSER_XSS_FILTER = True

# En producción (DEBUG=False) activar HTTPS headers:
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31_536_000  # 1 año
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# =============================================================================
# EMAIL (Mailhog en Docker dev | SMTP real en producción via .env)
# =============================================================================
EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.smtp.EmailBackend',
)
EMAIL_HOST = config('EMAIL_HOST', default='mailhog')
EMAIL_PORT = config('EMAIL_PORT', default=1025, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=False, cast=bool)
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@oftalmologia.local')
FRONTEND_URL = config('FRONTEND_URL')

# =============================================================================
# LOGGING
# =============================================================================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}
