from rest_framework import serializers

from .models import CampanaCRM, HistorialContacto, SegmentacionPaciente


class SegmentacionPacienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SegmentacionPaciente
        fields = '__all__'
        read_only_fields = ['id_segmentacion', 'created_at', 'updated_at']


class CampanaCRMSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampanaCRM
        fields = '__all__'
        read_only_fields = ['id_campana', 'creado_por', 'created_at', 'updated_at']

    def validate(self, attrs):
        fecha_inicio = attrs.get('fecha_inicio')
        fecha_fin = attrs.get('fecha_fin')

        if self.instance:
            fecha_inicio = fecha_inicio or self.instance.fecha_inicio
            fecha_fin = fecha_fin if 'fecha_fin' in attrs else self.instance.fecha_fin

        if fecha_fin and fecha_inicio and fecha_fin < fecha_inicio:
            raise serializers.ValidationError(
                {'fecha_fin': 'La fecha fin no puede ser anterior a la fecha inicio.'}
            )
        return attrs


class HistorialContactoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistorialContacto
        fields = '__all__'
        read_only_fields = ['id_historial_contacto', 'contactado_por', 'created_at', 'updated_at']
