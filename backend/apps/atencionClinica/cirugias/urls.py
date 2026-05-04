from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CirugiaViewSet

router = DefaultRouter()
router.register('cirugias', CirugiaViewSet, basename='cirugias')

urlpatterns = [
    path('', include(router.urls)),
]

