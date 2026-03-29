from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import RolViewSet, UsuarioRolViewSet

router = DefaultRouter()
router.register('roles', RolViewSet, basename='roles')
router.register('usuario-roles', UsuarioRolViewSet, basename='usuario-roles')

urlpatterns = [
    path('', include(router.urls)),
]
