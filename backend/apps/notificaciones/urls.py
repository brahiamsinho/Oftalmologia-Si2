from django.urls import path

from .views import (
    DispositivoFcmRegisterView,
    NotificacionListView,
    NotificacionLeerView,
    NotificacionMarcarTodasLeidasView,
)

urlpatterns = [
    path('dispositivos/', DispositivoFcmRegisterView.as_view(), name='fcm-dispositivos'),
    path('', NotificacionListView.as_view(), name='notificaciones-list'),
    path('<int:pk>/leer/', NotificacionLeerView.as_view(), name='notificacion-leer'),
    path('leer-todas/', NotificacionMarcarTodasLeidasView.as_view(), name='notificaciones-leer-todas'),
]
