from rest_framework import serializers

from .models import MedicionVisual


class MedicionVisualSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicionVisual
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        if self.instance:
            consulta = data.get('consulta', self.instance.consulta)
            paciente = data.get('paciente', self.instance.paciente)
        else:
            consulta = data.get('consulta')
            paciente = data.get('paciente')
        if consulta is not None and paciente is not None:
            paciente_id = paciente.pk if hasattr(paciente, 'pk') else paciente
            if consulta.paciente_id != paciente_id:
                raise serializers.ValidationError(
                    {'consulta': 'La consulta no corresponde al paciente seleccionado.'},
                )
        return data
