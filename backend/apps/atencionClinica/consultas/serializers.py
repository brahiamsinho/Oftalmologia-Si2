from rest_framework import serializers
from .models import Consulta, Estudio

class ConsultaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consulta
        fields = '__all__'
        read_only_fields = ['id', 'tenant', 'especialista', 'fecha', 'created_at', 'updated_at']

    def validate(self, data):
        data = super().validate(data)
        if self.instance:
            cita = data.get('cita', self.instance.cita)
            paciente = data.get('paciente', self.instance.paciente)
            especialista = data.get('especialista', self.instance.especialista)
        else:
            cita = data.get('cita')
            paciente = data.get('paciente')
            especialista = data.get('especialista')
        tenant = getattr(self.context.get('request'), 'tenant', None) or getattr(self.instance, 'tenant', None)
        if cita is not None and paciente is not None:
            paciente_id = paciente.pk if hasattr(paciente, 'pk') else paciente
            if cita.id_paciente_id != paciente_id:
                raise serializers.ValidationError(
                    {'cita': 'La cita no corresponde al paciente seleccionado.'}
                )
        if tenant is not None:
            if paciente is not None and getattr(paciente, 'tenant_id', None) != tenant.pk:
                raise serializers.ValidationError({'paciente': 'El paciente no pertenece al tenant actual.'})
            if cita is not None and getattr(cita, 'tenant_id', None) != tenant.pk:
                raise serializers.ValidationError({'cita': 'La cita no pertenece al tenant actual.'})
            if especialista is not None and getattr(especialista, 'tenant_id', None) != tenant.pk:
                raise serializers.ValidationError({'especialista': 'El especialista no pertenece al tenant actual.'})
        if paciente is not None and cita is not None and getattr(cita.id_paciente, 'tenant_id', None) is not None:
            if cita.id_paciente_id != getattr(paciente, 'pk', paciente):
                raise serializers.ValidationError({'cita': 'La cita no corresponde al paciente seleccionado.'})
        return data

class EstudioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estudio
        fields = '__all__'
        read_only_fields = ['id', 'tenant', 'fecha', 'created_at', 'updated_at']

    def validate(self, data):
        data = super().validate(data)
        if self.instance:
            cita = data.get('consulta', self.instance.consulta)
            paciente = data.get('paciente', self.instance.paciente)
        else:
            cita = data.get('consulta')
            paciente = data.get('paciente')
        tenant = getattr(self.context.get('request'), 'tenant', None) or getattr(self.instance, 'tenant', None)

        if cita is not None and paciente is not None:
            paciente_id = paciente.pk if hasattr(paciente, 'pk') else paciente
            if cita.paciente_id != paciente_id:
                raise serializers.ValidationError(
                    {'consulta': 'La consulta no corresponde al paciente seleccionado.'}
                )
        if tenant is not None:
            if paciente is not None and getattr(paciente, 'tenant_id', None) != tenant.pk:
                raise serializers.ValidationError({'paciente': 'El paciente no pertenece al tenant actual.'})
            if cita is not None and getattr(cita, 'tenant_id', None) != tenant.pk:
                raise serializers.ValidationError({'consulta': 'La consulta no pertenece al tenant actual.'})
        return data
