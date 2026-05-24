from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AfiliacionSeguroPacienteViewSet, AseguradoraViewSet, ConvenioViewSet

router = DefaultRouter()
router.register('aseguradoras', AseguradoraViewSet, basename='seguros-aseguradoras')
router.register('convenios', ConvenioViewSet, basename='seguros-convenios')
router.register('afiliaciones', AfiliacionSeguroPacienteViewSet, basename='seguros-afiliaciones')

urlpatterns = [
    path('', include(router.urls)),
]
