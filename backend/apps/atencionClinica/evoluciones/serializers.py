from rest_framework import serializers
from .models import EvolucionClinica

class EvolucionClinicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvolucionClinica
        fields = [
            'id_evolucion', 'id_historia_clinica', 'fecha_evolucion',
            'nota_evolucion', 'id_especialista',
        ]
        read_only_fields = ['id_evolucion']
