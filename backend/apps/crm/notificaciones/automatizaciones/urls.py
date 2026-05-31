from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LogEjecucionRecordatorioViewSet, ReglaRecordatorioViewSet, TareaRecordatorioViewSet

router = DefaultRouter()
router.register('reglas', ReglaRecordatorioViewSet, basename='notificaciones-reglas')
router.register('tareas', TareaRecordatorioViewSet, basename='notificaciones-tareas')
router.register('logs', LogEjecucionRecordatorioViewSet, basename='notificaciones-logs')

urlpatterns = [
    path('', include(router.urls)),
]
