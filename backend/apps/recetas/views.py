from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from apps.core.permissions import IsMedicoOrAdmin
from apps.historial_clinico.models import HistoriaClinica
from .models import Receta, RecetaDetalle
from .serializers import RecetaSerializer, RecetaDetalleSerializer

class RecetaViewSet(viewsets.ModelViewSet):
    serializer_class = RecetaSerializer
    permission_classes = [IsAuthenticated, IsMedicoOrAdmin]

    def get_queryset(self):
        return Receta.objects.filter(id_historia_clinica=self.kwargs.get('id_historia_clinica')).prefetch_related('detalles')

    def perform_create(self, serializer):
        historia = get_object_or_404(HistoriaClinica, pk=self.kwargs.get('id_historia_clinica'))
        serializer.save(id_historia_clinica=historia)

class RecetaDetalleViewSet(viewsets.ModelViewSet):
    serializer_class = RecetaDetalleSerializer
    permission_classes = [IsAuthenticated, IsMedicoOrAdmin]

    def get_queryset(self):
        return RecetaDetalle.objects.filter(id_receta=self.kwargs.get('id_receta'))

    def perform_create(self, serializer):
        receta = get_object_or_404(Receta, pk=self.kwargs.get('id_receta'))
        serializer.save(id_receta=receta)
