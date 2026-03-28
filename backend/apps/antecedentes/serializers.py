from rest_framework import serializers
from .models import AntecedenteClinico

class AntecedenteClinicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AntecedenteClinico
        fields = [
            'id_antecedente', 'id_historia_clinica', 'tipo_antecedente',
            'descripcion', 'fecha_registro', 'registrado_por',
        ]
        read_only_fields = ['id_antecedente', 'fecha_registro']
