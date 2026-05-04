from rest_framework import serializers

from .models import Cirugia, EstadoCirugia


class CirugiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cirugia
        fields = '__all__'
        read_only_fields = ['id_cirugia', 'created_at', 'updated_at']

    def validate(self, attrs):
        if self.instance:
            paciente = attrs.get('id_paciente', self.instance.id_paciente)
            historia = attrs.get('id_historia_clinica', self.instance.id_historia_clinica)
            preoperatorio = attrs.get('id_preoperatorio', self.instance.id_preoperatorio)
            cita = attrs.get('id_cita', self.instance.id_cita)
            estado = attrs.get('estado_cirugia', self.instance.estado_cirugia)
            fecha_programada = attrs.get('fecha_programada', self.instance.fecha_programada)
            fecha_real_inicio = attrs.get('fecha_real_inicio', self.instance.fecha_real_inicio)
            fecha_real_fin = attrs.get('fecha_real_fin', self.instance.fecha_real_fin)
        else:
            paciente = attrs.get('id_paciente')
            historia = attrs.get('id_historia_clinica')
            preoperatorio = attrs.get('id_preoperatorio')
            cita = attrs.get('id_cita')
            estado = attrs.get('estado_cirugia', EstadoCirugia.PROGRAMADA)
            fecha_programada = attrs.get('fecha_programada')
            fecha_real_inicio = attrs.get('fecha_real_inicio')
            fecha_real_fin = attrs.get('fecha_real_fin')

        if historia and paciente and historia.id_paciente_id != paciente.id_paciente:
            raise serializers.ValidationError(
                {'id_historia_clinica': 'La historia clinica no corresponde al paciente seleccionado.'}
            )

        if preoperatorio and paciente and preoperatorio.id_paciente_id != paciente.id_paciente:
            raise serializers.ValidationError(
                {'id_preoperatorio': 'El preoperatorio no corresponde al paciente seleccionado.'}
            )

        if cita and paciente and cita.id_paciente_id != paciente.id_paciente:
            raise serializers.ValidationError(
                {'id_cita': 'La cita no corresponde al paciente seleccionado.'}
            )

        if fecha_real_inicio and fecha_real_fin and fecha_real_inicio > fecha_real_fin:
            raise serializers.ValidationError(
                {'fecha_real_fin': 'La fecha real de fin debe ser mayor o igual a la de inicio.'}
            )

        if estado == EstadoCirugia.FINALIZADA and (not fecha_real_inicio or not fecha_real_fin):
            raise serializers.ValidationError(
                {'estado_cirugia': 'Para finalizar la cirugia se requieren fecha_real_inicio y fecha_real_fin.'}
            )

        if not fecha_programada:
            raise serializers.ValidationError({'fecha_programada': 'La fecha_programada es obligatoria.'})

        return attrs

