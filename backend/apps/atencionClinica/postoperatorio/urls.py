from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PostoperatorioViewSet

router = DefaultRouter()
router.register('postoperatorios', PostoperatorioViewSet, basename='postoperatorios')

urlpatterns = [
    path('', include(router.urls)),
]
