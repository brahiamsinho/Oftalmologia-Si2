from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ReportesViewSet

router = DefaultRouter()
router.register('reportes', ReportesViewSet, basename='reportes')

urlpatterns = [
    path('', include(router.urls)),
]
