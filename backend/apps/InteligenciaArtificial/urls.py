from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.InteligenciaArtificial.views import AsistenteVirtualPacienteViewSet, ClasificacionUrgenciaViewSet

router = DefaultRouter()
router.register(
    'interacciones-asistente',
    AsistenteVirtualPacienteViewSet,
    basename='interacciones-asistente',
)
router.register(
    'clasificaciones-urgencia',
    ClasificacionUrgenciaViewSet,
    basename='clasificaciones-urgencia',
)

urlpatterns = [
    path(
        'asistente-virtual/',
        AsistenteVirtualPacienteViewSet.as_view({'post': 'consultar'}),
        name='asistente-virtual-consultar',
    ),
    path('', include(router.urls)),
]
