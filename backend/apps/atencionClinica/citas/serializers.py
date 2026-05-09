"""
apps/appointments/serializers.py
"""
from rest_framework import serializers

from .models import Cita, DisponibilidadEspecialista, TipoCita


class TipoCitaSerializer(serializers.ModelSerializer):
    nombre_display = serializers.CharField(source='get_nombre_display', read_only=True)

    class Meta:
        model = TipoCita
        fields = ['id_tipo_cita', 'nombre', 'nombre_display', 'descripcion']
        read_only_fields = ['id_tipo_cita']


class DisponibilidadEspecialistaSerializer(serializers.ModelSerializer):
    dia_nombre = serializers.SerializerMethodField()

    class Meta:
        model = DisponibilidadEspecialista
        fields = [
            'id_disponibilidad',
            'id_especialista',
            'dia_semana',
            'dia_nombre',
            'hora_inicio',
            'hora_fin',
            'intervalo_minutos',
            'fecha_desde',
            'fecha_hasta',
            'activo',
        ]
        read_only_fields = ['id_disponibilidad']

    def get_dia_nombre(self, obj):
        dias = {
            1: 'Lunes',
            2: 'Martes',
            3: 'Miércoles',
            4: 'Jueves',
            5: 'Viernes',
            6: 'Sábado',
            7: 'Domingo',
        }
        return dias.get(obj.dia_semana, 'Desconocido')

    def validate(self, attrs):
        attrs = super().validate(attrs)

        hora_inicio = attrs.get('hora_inicio') or getattr(self.instance, 'hora_inicio', None)
        hora_fin = attrs.get('hora_fin') or getattr(self.instance, 'hora_fin', None)

        if hora_inicio and hora_fin and hora_inicio >= hora_fin:
            raise serializers.ValidationError({
                'hora_fin': 'La hora de fin debe ser mayor que la hora de inicio.'
            })

        return attrs


class CitaSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.SerializerMethodField()
    especialista_nombre = serializers.SerializerMethodField()
    tipo_cita_nombre = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Cita
        fields = [
            'id_cita',
            'id_paciente',
            'paciente_nombre',
            'id_especialista',
            'especialista_nombre',
            'id_tipo_cita',
            'tipo_cita_nombre',
            'fecha_hora_inicio',
            'fecha_hora_fin',
            'estado',
            'estado_display',
            'motivo',
            'observaciones',
            'confirmada_en',
            'id_cita_reprogramada_desde',
            'creado_por',
            'fecha_creacion',
        ]
        read_only_fields = [
            'id_cita',
            'confirmada_en',
            'creado_por',
            'fecha_creacion',
            'paciente_nombre',
            'especialista_nombre',
            'tipo_cita_nombre',
            'estado_display',
        ]

    def get_paciente_nombre(self, obj):
        return obj.id_paciente.get_full_name()

    def get_especialista_nombre(self, obj):
        return obj.id_especialista.usuario.get_full_name()

    def get_tipo_cita_nombre(self, obj):
        return obj.id_tipo_cita.get_nombre_display()

    def validate(self, data):
        data = super().validate(data)

        inicio = data.get('fecha_hora_inicio') or getattr(self.instance, 'fecha_hora_inicio', None)
        fin = data.get('fecha_hora_fin') or getattr(self.instance, 'fecha_hora_fin', None)

        if inicio and fin and inicio >= fin:
            raise serializers.ValidationError(
                'La fecha/hora de inicio debe ser anterior a la de fin.'
            )

        return data