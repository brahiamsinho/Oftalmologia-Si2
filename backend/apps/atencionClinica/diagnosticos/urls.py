from django.urls import path
from .views import DiagnosticoClinicoViewSet

urlpatterns = [
    path('diagnosticos/', DiagnosticoClinicoViewSet.as_view({
        'get': 'list', 'post': 'create'
    }), name='diagnosticos-list'),
    path('diagnosticos/<int:pk>/', DiagnosticoClinicoViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'
    }), name='diagnosticos-detail'),
]
