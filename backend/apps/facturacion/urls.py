from django.urls import include, path
from rest_framework.routers import DefaultRouter

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CatalogoServicioClinicoViewSet,
    CobroClinicoViewSet,
    FacturaClinicaViewSet,
    mock_checkout_pasarela,
)

router = DefaultRouter()
router.register('servicios', CatalogoServicioClinicoViewSet, basename='facturacion-servicios')
router.register('facturas', FacturaClinicaViewSet, basename='facturacion-facturas')
router.register('cobros', CobroClinicoViewSet, basename='facturacion-cobros')

urlpatterns = [
    path(
        'pasarela/mock-checkout/<str:referencia>/',
        mock_checkout_pasarela,
        name='facturacion-mock-checkout',
    ),
    path('', include(router.urls)),
]
