"""
apps/users/urls.py
Solo auth y CRUD de usuarios.
Roles → apps/roles/urls.py
Permisos → apps/permisos/urls.py

Auth:
  POST  /api/auth/register/
  POST  /api/auth/login/   body: email + password
  POST  /api/auth/logout/
  GET   /api/auth/me/
  PATCH /api/auth/me/
  POST  /api/auth/change-password/
  POST  /api/auth/reset-password/
  POST  /api/auth/reset-password/confirm/
  POST  /api/auth/token/refresh/
  POST  /api/auth/token/verify/

Gestión:
  /api/users/
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
    ChangePasswordView,
    LoginView,
    LogoutView,
    MeView,
    RegisterView,
    ResetPasswordConfirmView,
    ResetPasswordView,
    UsuarioViewSet,
)

router = DefaultRouter()
router.register('users', UsuarioViewSet, basename='users')

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
    path('auth/reset-password/confirm/', ResetPasswordConfirmView.as_view(), name='auth-reset-confirm'),
    # JWT refresh / verify
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token-verify'),
    # CRUD Users
    path('', include(router.urls)),
]
