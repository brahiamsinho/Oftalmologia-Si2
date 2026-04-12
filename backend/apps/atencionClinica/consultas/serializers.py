from rest_framework import serializers
from .models import Consulta, Estudio

class ConsultaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consulta
        fields = '__all__'
        read_only_fields = ['id', 'fecha', 'created_at', 'updated_at']

class EstudioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estudio
        fields = '__all__'
        read_only_fields = ['id', 'fecha', 'created_at', 'updated_at']
