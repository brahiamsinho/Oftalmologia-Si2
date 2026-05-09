from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from apps.core.permissions import IsMedicoOrAdmin

from .models import HistoriaClinica
from .serializers import HistoriaClinicaDetalleSerializer, HistoriaClinicaSerializer


class HistoriaClinicaViewSet(viewsets.ModelViewSet):
    queryset = HistoriaClinica.objects.select_related('id_paciente').all()
    permission_classes = [IsAuthenticated, IsMedicoOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado']
    search_fields = [
        'id_paciente__nombres',
        'id_paciente__apellidos',
        'id_paciente__numero_historia',
    ]
    ordering = ['-fecha_apertura']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return HistoriaClinicaDetalleSerializer
        return HistoriaClinicaSerializer