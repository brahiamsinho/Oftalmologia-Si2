from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EvaluacionQuirurgicaViewSet

router = DefaultRouter()
router.register('evaluaciones-quirurgicas', EvaluacionQuirurgicaViewSet, basename='evaluaciones-quirurgicas')

urlpatterns = [
    path('', include(router.urls)),
]

