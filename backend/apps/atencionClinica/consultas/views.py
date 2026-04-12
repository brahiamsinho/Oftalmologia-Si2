from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Consulta, Estudio
from .serializers import ConsultaSerializer, EstudioSerializer

class ConsultaViewSet(viewsets.ModelViewSet):
    queryset = Consulta.objects.all().order_by('-fecha')
    serializer_class = ConsultaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Permite filtrar por paciente y fecha
        queryset = super().get_queryset()
        paciente_id = self.request.query_params.get('paciente_id')
        if paciente_id:
            queryset = queryset.filter(paciente_id=paciente_id)
        return queryset

    def perform_create(self, serializer):
        # Asignar especialista automáticamente (el usuario autenticado en sesión)
        serializer.save(especialista=self.request.user)

class EstudioViewSet(viewsets.ModelViewSet):
    queryset = Estudio.objects.all().order_by('-fecha')
    serializer_class = EstudioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        paciente_id = self.request.query_params.get('paciente_id')
        if paciente_id:
            queryset = queryset.filter(paciente_id=paciente_id)
        return queryset
