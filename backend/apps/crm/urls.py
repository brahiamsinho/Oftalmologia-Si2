from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CampanaCRMViewSet, HistorialContactoViewSet, SegmentacionPacienteViewSet

router = DefaultRouter()
router.register('crm-segmentaciones', SegmentacionPacienteViewSet, basename='crm-segmentaciones')
router.register('crm-campanas', CampanaCRMViewSet, basename='crm-campanas')
router.register('crm-contactos', HistorialContactoViewSet, basename='crm-contactos')

urlpatterns = [
    path('', include(router.urls)),
]
