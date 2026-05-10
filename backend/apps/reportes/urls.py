"""
Rutas API del módulo reportes QBE (tenant).

Prefijo típico: ``/t/<slug>/api/reportes-qbe/plantillas/``

Nota: no usamos ``reportes/plantillas`` para no colisionar con
``apps.crm.reportes`` (CU17), que ya registra el prefijo ``reportes/``.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.reportes.views import ReportTemplateViewSet

router = DefaultRouter()
router.register(r'reportes-qbe/plantillas', ReportTemplateViewSet, basename='report-template')

urlpatterns = [
    path('', include(router.urls)),
]
