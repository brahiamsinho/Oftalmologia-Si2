from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConsultaViewSet, EstudioViewSet

router = DefaultRouter()
router.register(r'lista', ConsultaViewSet, basename='consulta')
router.register(r'estudios', EstudioViewSet, basename='estudio')

urlpatterns = [
    path('', include(router.urls)),
]
