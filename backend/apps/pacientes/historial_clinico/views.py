from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsMedicoOrAdmin
from .models import HistoriaClinica
from .serializers import HistoriaClinicaSerializer, HistoriaClinicaDetalleSerializer

class HistoriaClinicaViewSet(viewsets.ModelViewSet):
    """
    CRUD principal de historias clínicas.
    """
    queryset = HistoriaClinica.objects.select_related('id_paciente').all()
    permission_classes = [IsAuthenticated, IsMedicoOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado']
    search_fields = ['id_paciente__nombres', 'id_paciente__apellidos', 'id_paciente__numero_historia']
    ordering = ['-fecha_apertura']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return HistoriaClinicaDetalleSerializer
        return HistoriaClinicaSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = getattr(self.request, 'tenant', None)
        if tenant is not None:
            qs = qs.for_tenant(tenant)
        return qs
