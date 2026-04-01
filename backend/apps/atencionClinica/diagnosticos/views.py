from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from apps.core.permissions import IsMedicoOrAdmin
from apps.pacientes.historial_clinico.models import HistoriaClinica
from .models import DiagnosticoClinico
from .serializers import DiagnosticoClinicoSerializer

class DiagnosticoClinicoViewSet(viewsets.ModelViewSet):
    serializer_class = DiagnosticoClinicoSerializer
    permission_classes = [IsAuthenticated, IsMedicoOrAdmin]

    def get_queryset(self):
        return DiagnosticoClinico.objects.filter(id_historia_clinica=self.kwargs.get('id_historia_clinica'))

    def perform_create(self, serializer):
        historia = get_object_or_404(HistoriaClinica, pk=self.kwargs.get('id_historia_clinica'))
        serializer.save(id_historia_clinica=historia)
