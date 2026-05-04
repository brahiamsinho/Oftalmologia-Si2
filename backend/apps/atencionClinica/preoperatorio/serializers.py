from rest_framework import serializers

from .models import EstadoPreoperatorio, Preoperatorio


class PreoperatorioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Preoperatorio
        fields = '__all__'
        read_only_fields = [
            'id_preoperatorio',
            'validado_por',
            'fecha_validacion',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        if self.instance:
            paciente = attrs.get('id_paciente', self.instance.id_paciente)
            historia = attrs.get('id_historia_clinica', self.instance.id_historia_clinica)
            evaluacion = attrs.get('id_evaluacion_quirurgica', self.instance.id_evaluacion_quirurgica)
            cita = attrs.get('id_cita', self.instance.id_cita)
            estado = attrs.get('estado_preoperatorio', self.instance.estado_preoperatorio)
            checklist_completado = attrs.get('checklist_completado', self.instance.checklist_completado)
            apto_anestesia = attrs.get('apto_anestesia', self.instance.apto_anestesia)
        else:
            paciente = attrs.get('id_paciente')
            historia = attrs.get('id_historia_clinica')
            evaluacion = attrs.get('id_evaluacion_quirurgica')
            cita = attrs.get('id_cita')
            estado = attrs.get('estado_preoperatorio', EstadoPreoperatorio.PENDIENTE)
            checklist_completado = attrs.get('checklist_completado', False)
            apto_anestesia = attrs.get('apto_anestesia', False)

        if historia and paciente and historia.id_paciente_id != paciente.id_paciente:
            raise serializers.ValidationError(
                {'id_historia_clinica': 'La historia clinica no corresponde al paciente seleccionado.'}
            )

        if evaluacion and paciente and evaluacion.id_paciente_id != paciente.id_paciente:
            raise serializers.ValidationError(
                {'id_evaluacion_quirurgica': 'La evaluacion quirurgica no corresponde al paciente seleccionado.'}
            )

        if cita and paciente and cita.id_paciente_id != paciente.id_paciente:
            raise serializers.ValidationError(
                {'id_cita': 'La cita no corresponde al paciente seleccionado.'}
            )

        if estado == EstadoPreoperatorio.APROBADO and not (checklist_completado and apto_anestesia):
            raise serializers.ValidationError(
                {
                    'estado_preoperatorio': (
                        'Para aprobar, checklist_completado y apto_anestesia deben estar en true.'
                    )
                }
            )

        return attrs

