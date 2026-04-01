from django.urls import path
from .views import AntecedenteClinicoViewSet

urlpatterns = [
    path('antecedentes/', AntecedenteClinicoViewSet.as_view({
        'get': 'list', 'post': 'create'
    }), name='antecedentes-list'),
    path('antecedentes/<int:pk>/', AntecedenteClinicoViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'
    }), name='antecedentes-detail'),
]
