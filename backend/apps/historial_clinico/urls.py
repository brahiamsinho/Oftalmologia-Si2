from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import HistoriaClinicaViewSet

router = DefaultRouter()
router.register('historias-clinicas', HistoriaClinicaViewSet, basename='historias-clinicas')

urlpatterns = [
    path('', include(router.urls)),
]
