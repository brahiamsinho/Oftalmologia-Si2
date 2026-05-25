from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BeneficioPacienteViewSet, PromocionDescuentoViewSet

router = DefaultRouter()
router.register('promociones', PromocionDescuentoViewSet, basename='descuentos-promociones')
router.register('beneficios', BeneficioPacienteViewSet, basename='descuentos-beneficios')

urlpatterns = [
    path('', include(router.urls)),
]
