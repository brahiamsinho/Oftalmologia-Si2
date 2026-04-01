from django.urls import path
from .views import TratamientoClinicoViewSet

urlpatterns = [
    path('tratamientos/', TratamientoClinicoViewSet.as_view({
        'get': 'list', 'post': 'create'
    }), name='tratamientos-list'),
    path('tratamientos/<int:pk>/', TratamientoClinicoViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'
    }), name='tratamientos-detail'),
]
