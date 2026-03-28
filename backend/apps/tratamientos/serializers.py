from rest_framework import serializers
from .models import TratamientoClinico

class TratamientoClinicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TratamientoClinico
        fields = [
            'id_tratamiento', 'id_historia_clinica', 'id_diagnostico',
            'descripcion', 'indicaciones', 'fecha_inicio', 'fecha_fin',
            'estado', 'id_especialista',
        ]
        read_only_fields = ['id_tratamiento']
