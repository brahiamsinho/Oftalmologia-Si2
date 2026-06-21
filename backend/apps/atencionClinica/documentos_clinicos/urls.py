from django.urls import path

from .views import DocumentoClinicoViewSet


list_create = DocumentoClinicoViewSet.as_view({
    'get': 'list',
    'post': 'create',
})

detail = DocumentoClinicoViewSet.as_view({
    'get': 'retrieve',
    'patch': 'partial_update',
    'put': 'update',
    'delete': 'destroy',
})

download = DocumentoClinicoViewSet.as_view({
    'get': 'download',
})

urlpatterns = [
    path('historias-clinicas/<int:id_historia_clinica>/documentos-clinicos/', list_create, name='documentos-clinicos-list'),
    path('historias-clinicas/<int:id_historia_clinica>/documentos-clinicos/<int:pk>/', detail, name='documentos-clinicos-detail'),
    path('historias-clinicas/<int:id_historia_clinica>/documentos-clinicos/<int:pk>/download/', download, name='documentos-clinicos-download'),
]
