from rest_framework import serializers
from .models import DiagnosticoClinico
from apps.atencionClinica.tratamientos.serializers import TratamientoClinicoSerializer

class DiagnosticoClinicoSerializer(serializers.ModelSerializer):
    tratamientos = TratamientoClinicoSerializer(many=True, read_only=True)

    class Meta:
        model = DiagnosticoClinico
        fields = [
            'id_diagnostico', 'id_historia_clinica', 'fecha_diagnostico',
            'descripcion', 'cie10', 'id_especialista', 'observaciones',
            'tratamientos',
        ]
        read_only_fields = ['id_diagnostico']
