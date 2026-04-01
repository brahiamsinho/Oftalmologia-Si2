from django.urls import path
from .views import RecetaViewSet, RecetaDetalleViewSet

urlpatterns = [
    path('recetas/', RecetaViewSet.as_view({
        'get': 'list', 'post': 'create'
    }), name='recetas-list'),
    path('recetas/<int:pk>/', RecetaViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'
    }), name='recetas-detail'),
    path('recetas/<int:id_receta>/detalles/', RecetaDetalleViewSet.as_view({
        'get': 'list', 'post': 'create'
    }), name='receta-detalles-list'),
    path('recetas/<int:id_receta>/detalles/<int:pk>/', RecetaDetalleViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'
    }), name='receta-detalles-detail'),
]
