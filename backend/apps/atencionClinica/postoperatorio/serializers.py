from rest_framework import serializers

from .models import Postoperatorio


class PostoperatorioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Postoperatorio
        fields = '__all__'
        read_only_fields = ['id_postoperatorio', 'profesional_atiende', 'created_at', 'updated_at']

    def validate(self, attrs):
        if self.instance:
            paciente = attrs.get('id_paciente', self.instance.id_paciente)
            historia = attrs.get('id_historia_clinica', self.instance.id_historia_clinica)
            cirugia = attrs.get('id_cirugia', self.instance.id_cirugia)
            fecha_control = attrs.get('fecha_control', self.instance.fecha_control)
            proximo_control = attrs.get('proximo_control', self.instance.proximo_control)
        else:
            paciente = attrs.get('id_paciente')
            historia = attrs.get('id_historia_clinica')
            cirugia = attrs.get('id_cirugia')
            fecha_control = attrs.get('fecha_control')
            proximo_control = attrs.get('proximo_control')

        if historia and paciente and historia.id_paciente_id != paciente.id_paciente:
            raise serializers.ValidationError(
                {'id_historia_clinica': 'La historia clinica no corresponde al paciente seleccionado.'}
            )

        if cirugia and paciente and cirugia.id_paciente_id != paciente.id_paciente:
            raise serializers.ValidationError(
                {'id_cirugia': 'La cirugia no corresponde al paciente seleccionado.'}
            )

        if not fecha_control:
            raise serializers.ValidationError({'fecha_control': 'La fecha_control es obligatoria.'})

        if proximo_control and fecha_control and proximo_control < fecha_control:
            raise serializers.ValidationError(
                {'proximo_control': 'El proximo_control debe ser mayor o igual a fecha_control.'}
            )

        return attrs
