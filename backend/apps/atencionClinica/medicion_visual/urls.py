from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MedicionVisualViewSet

router = DefaultRouter()
router.register(r'registros', MedicionVisualViewSet, basename='medicionvisual')

urlpatterns = [
    path('', include(router.urls)),
]
