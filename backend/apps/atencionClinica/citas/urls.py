from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import CitaViewSet, DisponibilidadEspecialistaViewSet, TipoCitaViewSet

router = DefaultRouter()
router.register('tipos-cita', TipoCitaViewSet, basename='tipos-cita')
router.register('disponibilidades', DisponibilidadEspecialistaViewSet, basename='disponibilidades')
router.register('citas', CitaViewSet, basename='citas')

urlpatterns = [
    path('', include(router.urls)),
]
