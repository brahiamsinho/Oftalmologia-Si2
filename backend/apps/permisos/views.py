"""
apps/permisos/views.py

Endpoints:
  GET/POST       /api/v1/permisos/
  GET/PUT/PATCH  /api/v1/permisos/{id}/
  DELETE         /api/v1/permisos/{id}/
"""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsAdmin

from .models import Permiso
from .serializers import PermisoSerializer


class PermisoViewSet(viewsets.ModelViewSet):
    """
    CRUD de permisos del sistema. Solo accesible por ADMIN.
    Los permisos definen acciones granulares por módulo.
    """
    queryset = Permiso.objects.all()
    serializer_class = PermisoSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['modulo']
    search_fields = ['codigo', 'nombre', 'modulo', 'descripcion']
    ordering_fields = ['modulo', 'codigo', 'nombre']
    ordering = ['modulo', 'codigo']
