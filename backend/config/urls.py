"""
Oftalmología Si2 — URL Configuration
======================================
Rutas principales del proyecto.
Agrega las URLs de cada app bajo /api/v1/<app>/ cuando estén listas.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

# API v1 patterns
api_v1_patterns = [
    # Authentication — JWT
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Agrega las URLs de tus apps aquí cuando estén listas:
    # path('users/', include('apps.users.urls')),
    # path('patients/', include('apps.patients.urls')),
    # path('doctors/', include('apps.doctors.urls')),
    # path('appointments/', include('apps.appointments.urls')),
    # path('medical-records/', include('apps.medical_records.urls')),
    # path('health/', include('apps.core.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include((api_v1_patterns, 'api-v1'))),
]

# Servir media/static en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
