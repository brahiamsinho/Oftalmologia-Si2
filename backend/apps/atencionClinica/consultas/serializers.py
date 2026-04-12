from rest_framework import serializers
from .models import Consulta, Estudio

class ConsultaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consulta
        fields = '__all__'
        read_only_fields = ['id', 'fecha', 'created_at', 'updated_at']

    def validate(self, data):
        if self.instance:
            cita = data.get('cita', self.instance.cita)
            paciente = data.get('paciente', self.instance.paciente)
        else:
            cita = data.get('cita')
            paciente = data.get('paciente')
        if cita is not None and paciente is not None:
            paciente_id = paciente.pk if hasattr(paciente, 'pk') else paciente
            if cita.id_paciente_id != paciente_id:
                raise serializers.ValidationError(
                    {'cita': 'La cita no corresponde al paciente seleccionado.'}
                )
        return data

class EstudioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estudio
        fields = '__all__'
        read_only_fields = ['id', 'fecha', 'created_at', 'updated_at']
