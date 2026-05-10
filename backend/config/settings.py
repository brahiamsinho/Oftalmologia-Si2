import hashlib
import os
from datetime import timedelta
from pathlib import Path

from decouple import Csv, config


BASE_DIR = Path(__file__).resolve().parent.parent

# --- IA / Gemini (CU23): clave vía entorno; nunca commitear secretos ---
GEMINI_API_KEY = config('GEMINI_API_KEY', default=os.getenv('GEMINI_API_KEY', '')).strip()
#GEMINI_MODEL = config('GEMINI_MODEL', default=os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')).strip()
GEMINI_MODEL = 'gemini-2.5-flash'

SECRET_KEY = config('DJANGO_SECRET_KEY', default='INSECURE-change-me-in-production')
DEBUG = config('DJANGO_DEBUG', default=True, cast=bool)


def _jwt_signing_key() -> str:
    if len(SECRET_KEY.encode('utf-8')) >= 32:
        return SECRET_KEY
    return hashlib.sha256(SECRET_KEY.encode('utf-8')).hexdigest()


ALLOWED_HOSTS = [
    host.strip()
    for host in config('DJANGO_ALLOWED_HOSTS', default='localhost,127.0.0.1,testserver', cast=Csv())
    if host.strip()
]

if DEBUG and '*' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('*')


# =============================================================================
# DJANGO-TENANTS PURO
# =============================================================================

TENANT_MODEL = 'tenant.Tenant'
TENANT_DOMAIN_MODEL = 'tenant.Domain'

PUBLIC_SCHEMA_NAME = 'public'
TENANT_SUBFOLDER_PREFIX = 't'

PUBLIC_SCHEMA_URLCONF = 'config.urls_public'

SHARED_APPS = [
    'django_tenants',

    'apps.tenant',

    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',

    'apps.core',
]

TENANT_APPS = [
    # Auth por clínica.
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.admin',
    'django.contrib.staticfiles',

    # Blacklist JWT por clínica.
    'rest_framework_simplejwt.token_blacklist',

    # Usuarios, roles y permisos por clínica.
    'apps.usuarios.users',
    'apps.usuarios.permisos',
    'apps.usuarios.roles',

    # Auditoría por clínica.
    'apps.bitacora',

    # Módulo pacientes por clínica.
    'apps.pacientes.pacientes',
    'apps.pacientes.historial_clinico',

    # Atención clínica por clínica.
    'apps.atencionClinica.especialistas',
    'apps.atencionClinica.antecedentes',
    'apps.atencionClinica.citas',
    'apps.atencionClinica.consultas',
    'apps.atencionClinica.medicion_visual',
    'apps.atencionClinica.evaluacion_quirurgica',
    'apps.atencionClinica.preoperatorio',
    'apps.atencionClinica.cirugias',
    'apps.atencionClinica.postoperatorio',

    # CRM por clínica.
    'apps.crm',
    'apps.crm.reportes',
     

    # Notificaciones por clínica.
    'apps.notificaciones',
    'apps.notificaciones.automatizaciones',

    # Backup y restore por clínica.
    'apps.backup',

    # Reportes QBE — CU21 personalizados / CU22 predefinidos (ORM únicamente).
    'apps.reportes',

    # Inteligencia artificial (NL → QBE, CU23+).
    'apps.ia',
]


INSTALLED_APPS = list(SHARED_APPS) + [
    app for app in TENANT_APPS if app not in SHARED_APPS
]

DATABASES = {
    'default': {
        'ENGINE': 'django_tenants.postgresql_backend',
        'NAME': config('POSTGRES_DB', default='oftalmologia_db'),
        'USER': config('POSTGRES_USER', default='oftalmologia_user'),
        'PASSWORD': config('POSTGRES_PASSWORD', default='password'),
        'HOST': config('POSTGRES_HOST', default='localhost' if DEBUG else 'db'),
        'PORT': config('POSTGRES_PORT', default='5432'),
        'OPTIONS': {
            'connect_timeout': 10,
        },
    },
}

DATABASE_ROUTERS = (
    'django_tenants.routers.TenantSyncRouter',
)


MIDDLEWARE = [
    'django_tenants.middleware.TenantSubfolderMiddleware',

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
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'templates',
        ],
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


AUTH_USER_MODEL = 'users.Usuario'

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
    PASSWORD_HASHERS = [
        'django.contrib.auth.hashers.MD5PasswordHasher',
        'django.contrib.auth.hashers.Argon2PasswordHasher',
        'django.contrib.auth.hashers.PBKDF2PasswordHasher',
        'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
        'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    ]


LANGUAGE_CODE = 'es'
TIME_ZONE = 'America/La_Paz'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static'] if (BASE_DIR / 'static').exists() else []

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


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
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ),
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


SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=config('JWT_ACCESS_TOKEN_LIFETIME', default=30, cast=int),
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=config('JWT_REFRESH_TOKEN_LIFETIME', default=7, cast=int),
    ),
    'SIGNING_KEY': _jwt_signing_key(),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}


if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = [
        origin.strip()
        for origin in config('CORS_ALLOWED_ORIGINS', default='', cast=Csv())
        if origin.strip()
    ]
    CORS_ALLOW_CREDENTIALS = True


SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_BROWSER_XSS_FILTER = True

if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31_536_000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')


EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='mailhog')
EMAIL_PORT = config('EMAIL_PORT', default=1025, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=False, cast=bool)

DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@oftalmologia.local')
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')
SITE_DISPLAY_NAME = config('SITE_DISPLAY_NAME', default='Oftalmología Si2')
REGISTRATION_EMAIL_FOOTER_HINT = config('REGISTRATION_EMAIL_FOOTER_HINT', default='')

FIREBASE_CREDENTIALS_PATH = config(
    'FIREBASE_CREDENTIALS_PATH',
    default=str(BASE_DIR / 'firebase-credentials.json'),
)


LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
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


# =============================================================================
# BACKUP SETTINGS
# =============================================================================

BACKUP_STORAGE_PATH = config('BACKUP_STORAGE_PATH', default='backups')
BACKUP_TIMEOUT_SECONDS = config('BACKUP_TIMEOUT_SECONDS', default=600, cast=int)
BACKUP_MAX_SIZE_MB = config('BACKUP_MAX_SIZE_MB', default=500, cast=int)

# Límites de backups por plan
BACKUP_PLAN_LIMITS = {
    'FREE': {
        'max_backups': 0,
        'retencion_dias': 0,
        'permite_restore': False,
        'permite_automatico': False,
    },
    'PLUS': {
        'max_backups': 5,
        'retencion_dias': 30,
        'permite_restore': True,
        'permite_automatico': True,
    },
    'PRO': {
        'max_backups': -1,  # ilimitado
        'retencion_dias': 90,
        'permite_restore': True,
        'permite_automatico': True,
    },
}