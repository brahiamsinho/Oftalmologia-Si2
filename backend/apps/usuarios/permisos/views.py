"""
apps/permisos/views.py

Endpoints (solo lectura vía API — el catálogo se define con seed/migraciones):
  GET            /api/permisos/
  GET            /api/permisos/{id}/
"""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsAdministrativoOrAdmin

from .models import Permiso
from .serializers import PermisoSerializer


class PermisoViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    Catálogo de permisos granulares (solo lectura).
    ADMIN y ADMINISTRATIVO pueden listar para armar roles en la UI.
    Altas/bajas de códigos: seeders o migraciones, no POST aquí.
    """
    queryset = Permiso.objects.all()
    serializer_class = PermisoSerializer
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['modulo']
    search_fields = ['codigo', 'nombre', 'modulo', 'descripcion']
    ordering_fields = ['modulo', 'codigo', 'nombre']
    ordering = ['modulo', 'codigo']
