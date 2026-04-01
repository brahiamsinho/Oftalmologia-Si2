from rest_framework import serializers
from .models import Receta, RecetaDetalle

class RecetaDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecetaDetalle
        fields = [
            'id_receta_detalle', 'id_receta', 'medicamento',
            'dosis', 'frecuencia', 'duracion', 'via_administracion',
        ]
        read_only_fields = ['id_receta_detalle']

class RecetaSerializer(serializers.ModelSerializer):
    detalles = RecetaDetalleSerializer(many=True, read_only=True)

    class Meta:
        model = Receta
        fields = [
            'id_receta', 'id_historia_clinica', 'id_especialista',
            'fecha_receta', 'indicaciones_generales', 'detalles',
        ]
        read_only_fields = ['id_receta']
