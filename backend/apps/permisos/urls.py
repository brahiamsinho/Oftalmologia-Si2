from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import PermisoViewSet

router = DefaultRouter()
router.register('permisos', PermisoViewSet, basename='permisos')

urlpatterns = [
    path('', include(router.urls)),
]
