from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from apps.core.permissions import IsMedicoOrAdmin
from apps.historial_clinico.models import HistoriaClinica
from .models import AntecedenteClinico
from .serializers import AntecedenteClinicoSerializer

class AntecedenteClinicoViewSet(viewsets.ModelViewSet):
    serializer_class = AntecedenteClinicoSerializer
    permission_classes = [IsAuthenticated, IsMedicoOrAdmin]

    def get_queryset(self):
        return AntecedenteClinico.objects.filter(id_historia_clinica=self.kwargs.get('id_historia_clinica'))

    def perform_create(self, serializer):
        historia = get_object_or_404(HistoriaClinica, pk=self.kwargs.get('id_historia_clinica'))
        serializer.save(id_historia_clinica=historia, registrado_por=self.request.user)
