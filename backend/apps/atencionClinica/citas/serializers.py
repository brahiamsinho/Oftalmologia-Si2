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
            'id_disponibilidad', 'tenant', 'id_especialista',
            'dia_semana', 'dia_nombre',
            'hora_inicio', 'hora_fin', 'intervalo_minutos',
            'fecha_desde', 'fecha_hasta', 'activo',
        ]
        read_only_fields = ['id_disponibilidad', 'tenant']

    def get_dia_nombre(self, obj):
        dias = {1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
                4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo'}
        return dias.get(obj.dia_semana, 'Desconocido')

    def validate(self, attrs):
        tenant = getattr(getattr(self.context.get('request'), 'tenant', None), 'pk', None)
        especialista = attrs.get('id_especialista') or getattr(self.instance, 'id_especialista', None)
        if tenant is not None and especialista is not None and getattr(especialista, 'tenant_id', None) != tenant:
            raise serializers.ValidationError(
                {'id_especialista': 'El especialista no pertenece al tenant actual.'}
            )
        return attrs


class CitaSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.SerializerMethodField()
    especialista_nombre = serializers.SerializerMethodField()
    tipo_cita_nombre = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Cita
        fields = [
            'id_cita', 'tenant', 'id_paciente', 'paciente_nombre',
            'id_especialista', 'especialista_nombre',
            'id_tipo_cita', 'tipo_cita_nombre',
            'fecha_hora_inicio', 'fecha_hora_fin',
            'estado', 'estado_display',
            'motivo', 'observaciones', 'confirmada_en',
            'id_cita_reprogramada_desde', 'creado_por', 'fecha_creacion',
        ]
        read_only_fields = [
            'id_cita', 'tenant', 'confirmada_en', 'creado_por', 'fecha_creacion',
            'paciente_nombre', 'especialista_nombre', 'tipo_cita_nombre', 'estado_display',
        ]

    def get_paciente_nombre(self, obj):
        return obj.id_paciente.get_full_name()

    def get_especialista_nombre(self, obj):
        return obj.id_especialista.usuario.get_full_name()

    def get_tipo_cita_nombre(self, obj):
        return obj.id_tipo_cita.get_nombre_display()

    def validate(self, data):
        data = super().validate(data)
        request = self.context.get('request')
        tenant = getattr(request, 'tenant', None) or getattr(self.instance, 'tenant', None)

        paciente = data.get('id_paciente') or getattr(self.instance, 'id_paciente', None)
        especialista = data.get('id_especialista') or getattr(self.instance, 'id_especialista', None)
        reprogramada_desde = data.get('id_cita_reprogramada_desde') or getattr(
            self.instance, 'id_cita_reprogramada_desde', None
        )

        if tenant is not None:
            if paciente is not None and getattr(paciente, 'tenant_id', None) != tenant.pk:
                raise serializers.ValidationError({'id_paciente': 'El paciente no pertenece al tenant actual.'})
            if especialista is not None and getattr(especialista, 'tenant_id', None) != tenant.pk:
                raise serializers.ValidationError({'id_especialista': 'El especialista no pertenece al tenant actual.'})
            if reprogramada_desde is not None and getattr(reprogramada_desde, 'tenant_id', None) != tenant.pk:
                raise serializers.ValidationError({'id_cita_reprogramada_desde': 'La cita original no pertenece al tenant actual.'})

        if paciente is not None and especialista is not None:
            paciente_tenant_id = getattr(paciente, 'tenant_id', None)
            especialista_tenant_id = getattr(especialista, 'tenant_id', None)
            if paciente_tenant_id is not None and especialista_tenant_id is not None and paciente_tenant_id != especialista_tenant_id:
                raise serializers.ValidationError(
                    {'id_especialista': 'El especialista y el paciente deben pertenecer al mismo tenant.'}
                )

        inicio = data.get('fecha_hora_inicio')
        fin = data.get('fecha_hora_fin')
        if inicio and fin and inicio >= fin:
            raise serializers.ValidationError(
                'La fecha/hora de inicio debe ser anterior a la de fin.'
            )
        return data
