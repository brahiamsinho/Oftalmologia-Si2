"""
apps/bitacora/views.py
Endpoints de solo lectura para la bitácora del sistema.
Solo accesible por ADMIN y ADMINISTRATIVO.
"""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsAdministrativoOrAdmin

from .models import Bitacora
from .serializers import BitacoraSerializer


class BitacoraViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    GET /api/bitacora/          - Listar eventos (con filtros y paginación)
    GET /api/bitacora/{id}/     - Detalle de un evento
    La escritura es automática desde el sistema — no expuesta via API.
    """
    queryset = Bitacora.objects.select_related('id_usuario').all()
    serializer_class = BitacoraSerializer
    permission_classes = [IsAuthenticated, IsAdministrativoOrAdmin]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['accion', 'modulo', 'tabla_afectada', 'id_usuario']
    search_fields = ['descripcion', 'modulo', 'tabla_afectada', 'ip_origen']
    ordering_fields = ['fecha_evento', 'accion', 'modulo']
    ordering = ['-fecha_evento']

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = getattr(self.request, 'tenant', None)
        if tenant is not None:
            qs = qs.for_tenant(tenant)
        return qs
