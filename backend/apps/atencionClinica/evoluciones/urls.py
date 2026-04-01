from django.urls import path
from .views import EvolucionClinicaViewSet

urlpatterns = [
    path('evoluciones/', EvolucionClinicaViewSet.as_view({
        'get': 'list', 'post': 'create'
    }), name='evoluciones-list'),
    path('evoluciones/<int:pk>/', EvolucionClinicaViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'
    }), name='evoluciones-detail'),
]
