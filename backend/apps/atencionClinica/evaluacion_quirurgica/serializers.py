from rest_framework import serializers

from .models import EvaluacionQuirurgica


class EvaluacionQuirurgicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluacionQuirurgica
        fields = '__all__'
        read_only_fields = [
            'id_evaluacion_quirurgica',
            'evaluado_por',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        if self.instance:
            paciente = attrs.get('id_paciente', self.instance.id_paciente)
            historia = attrs.get('id_historia_clinica', self.instance.id_historia_clinica)
            consulta = attrs.get('id_consulta', self.instance.id_consulta)
        else:
            paciente = attrs.get('id_paciente')
            historia = attrs.get('id_historia_clinica')
            consulta = attrs.get('id_consulta')

        if historia and paciente and historia.id_paciente_id != paciente.id_paciente:
            raise serializers.ValidationError(
                {'id_historia_clinica': 'La historia clinica no corresponde al paciente seleccionado.'}
            )

        if consulta and paciente and consulta.paciente_id != paciente.id_paciente:
            raise serializers.ValidationError(
                {'id_consulta': 'La consulta no corresponde al paciente seleccionado.'}
            )

        return attrs

