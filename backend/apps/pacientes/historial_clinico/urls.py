from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DocumentoClinicoAutorizadoViewSet, HistoriaClinicaViewSet

router = DefaultRouter()
router.register('historias-clinicas', HistoriaClinicaViewSet, basename='historias-clinicas')

urlpatterns = [
    path(
        'historias-clinicas/<int:id_historia_clinica>/documentos-clinicos/',
        DocumentoClinicoAutorizadoViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='documentos-clinicos-list',
    ),
    path(
        'historias-clinicas/<int:id_historia_clinica>/documentos-clinicos/<int:pk>/',
        DocumentoClinicoAutorizadoViewSet.as_view({
            'get': 'retrieve',
            'put': 'update',
            'patch': 'partial_update',
            'delete': 'destroy',
        }),
        name='documentos-clinicos-detail',
    ),
    path(
        'historias-clinicas/<int:id_historia_clinica>/documentos-clinicos/<int:pk>/autorizar/',
        DocumentoClinicoAutorizadoViewSet.as_view({'post': 'autorizar'}),
        name='documentos-clinicos-autorizar',
    ),
    path(
        'historias-clinicas/<int:id_historia_clinica>/documentos-clinicos/<int:pk>/download/',
        DocumentoClinicoAutorizadoViewSet.as_view({'get': 'download'}),
        name='documentos-clinicos-download',
    ),
    path(
        'mis-documentos-clinicos/',
        DocumentoClinicoAutorizadoViewSet.as_view({'get': 'list'}),
        name='mis-documentos-clinicos-list',
    ),
    path(
        'mis-documentos-clinicos/<int:pk>/',
        DocumentoClinicoAutorizadoViewSet.as_view({'get': 'retrieve'}),
        name='mis-documentos-clinicos-detail',
    ),
    path(
        'mis-documentos-clinicos/<int:pk>/download/',
        DocumentoClinicoAutorizadoViewSet.as_view({'get': 'download'}),
        name='mis-documentos-clinicos-download',
    ),
    path('', include(router.urls)),
]
