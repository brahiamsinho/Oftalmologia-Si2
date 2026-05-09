from rest_framework import serializers

from .models import (
    CampanaCRM,
    EstadoComunicacion,
    HistorialContacto,
    SegmentacionPaciente,
)


class SegmentacionPacienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SegmentacionPaciente
        fields = '__all__'
        read_only_fields = ['id_segmentacion', 'created_at', 'updated_at']

    def validate(self, attrs):
        attrs = super().validate(attrs)

        nombre = attrs.get('nombre') or getattr(self.instance, 'nombre', None)

        if nombre:
            qs = SegmentacionPaciente.objects.filter(nombre=nombre)
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)

            if qs.exists():
                raise serializers.ValidationError({
                    'nombre': 'Ya existe una segmentación con ese nombre.'
                })

        return attrs


class CampanaCRMSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampanaCRM
        fields = '__all__'
        read_only_fields = ['id_campana', 'creado_por', 'created_at', 'updated_at']

    def validate(self, attrs):
        attrs = super().validate(attrs)

        fecha_inicio = attrs.get('fecha_inicio')
        fecha_fin = attrs.get('fecha_fin')

        if self.instance:
            fecha_inicio = fecha_inicio or self.instance.fecha_inicio
            fecha_fin = fecha_fin if 'fecha_fin' in attrs else self.instance.fecha_fin

        if fecha_fin and fecha_inicio and fecha_fin < fecha_inicio:
            raise serializers.ValidationError({
                'fecha_fin': 'La fecha fin no puede ser anterior a la fecha inicio.'
            })

        return attrs


class HistorialContactoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistorialContacto
        fields = '__all__'
        read_only_fields = [
            'id_historial_contacto',
            'contactado_por',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)

        if self.instance:
            estado = attrs.get('estado_comunicacion', self.instance.estado_comunicacion)
            respuesta = attrs.get('respuesta_paciente', self.instance.respuesta_paciente)
        else:
            estado = attrs.get('estado_comunicacion', EstadoComunicacion.PENDIENTE)
            respuesta = attrs.get('respuesta_paciente')

        # Si el estado es RESPONDIDO, debe haber una respuesta del paciente registrada
        if estado == EstadoComunicacion.RESPONDIDO and not (respuesta or '').strip():
            raise serializers.ValidationError({
                'respuesta_paciente': (
                    'Debes registrar la respuesta del paciente para marcar el estado como Respondido.'
                )
            })

        return attrs