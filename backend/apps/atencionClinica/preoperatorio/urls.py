from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PreoperatorioViewSet

router = DefaultRouter()
router.register('preoperatorios', PreoperatorioViewSet, basename='preoperatorios')

urlpatterns = [
    path('', include(router.urls)),
]

