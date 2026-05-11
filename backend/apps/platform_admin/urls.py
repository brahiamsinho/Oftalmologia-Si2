from django.urls import path

from .views import PlatformLoginView, PlatformMeView

urlpatterns = [
    path('auth/login/', PlatformLoginView.as_view(), name='platform-auth-login'),
    path('auth/me/', PlatformMeView.as_view(), name='platform-auth-me'),
]
