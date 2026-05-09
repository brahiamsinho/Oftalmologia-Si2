from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from apps.atencionClinica.postoperatorio.models import Postoperatorio
from apps.notificaciones.models import Notificacion

from .models import (
    EstadoTarea,
    LogEjecucionRecordatorio,
    NivelLog,
    ReglaRecordatorio,
    TareaRecordatorioProgramada,
)


class ReglaRecordatorioSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReglaRecordatorio
        fields = '__all__'
        read_only_fields = ['id_regla', 'creado_por', 'created_at', 'updated_at']

    def validate(self, attrs):
        attrs = super().validate(attrs)

        nombre = attrs.get('nombre') or getattr(self.instance, 'nombre', None)

        if nombre:
            qs = ReglaRecordatorio.objects.filter(nombre=nombre)
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)

            if qs.exists():
                raise serializers.ValidationError({
                    'nombre': 'Ya existe una regla con ese nombre.'
                })

        return attrs


class TareaRecordatorioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TareaRecordatorioProgramada
        fields = '__all__'
        read_only_fields = [
            'id_tarea',
            'estado',
            'intentos',
            'procesada_en',
            'created_at',
            'updated_at',
        ]


class LogEjecucionRecordatorioSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogEjecucionRecordatorio
        fields = '__all__'
        read_only_fields = [
            'id_log',
            'id_tarea',
            'nivel',
            'mensaje',
            'detalle',
            'ejecutado_en',
        ]


class GenerarTareaSerializer(serializers.Serializer):
    id_regla = serializers.PrimaryKeyRelatedField(
        queryset=ReglaRecordatorio.objects.filter(activa=True),
    )
    id_postoperatorio = serializers.PrimaryKeyRelatedField(
        queryset=Postoperatorio.objects.all(),
    )

    def validate(self, attrs):
        attrs = super().validate(attrs)

        regla = attrs['id_regla']
        postoperatorio = attrs['id_postoperatorio']

        if postoperatorio.proximo_control is None:
            raise serializers.ValidationError({
                'id_postoperatorio': 'El postoperatorio no tiene próximo control programado.'
            })

        programada_para = postoperatorio.proximo_control - timedelta(hours=regla.horas_antes)

        if programada_para <= timezone.now():
            raise serializers.ValidationError({
                'id_postoperatorio': 'No se puede programar en el pasado con la regla seleccionada.'
            })

        attrs['programada_para'] = programada_para
        return attrs

    def create(self, validated_data):
        regla = validated_data['id_regla']
        postoperatorio = validated_data['id_postoperatorio']

        return TareaRecordatorioProgramada.objects.create(
            id_regla=regla,
            id_paciente=postoperatorio.id_paciente,
            id_postoperatorio=postoperatorio,
            programada_para=validated_data['programada_para'],
            payload={
                'paciente_id': postoperatorio.id_paciente_id,
                'postoperatorio_id': postoperatorio.id_postoperatorio,
                'proximo_control': postoperatorio.proximo_control.isoformat(),
            },
        )


def procesar_tarea_recordatorio(tarea: TareaRecordatorioProgramada):
    if tarea.estado != EstadoTarea.PENDIENTE:
        return tarea

    try:
        if tarea.payload.get('forzar_error'):
            raise ValueError('Error forzado para pruebas de resiliencia.')

        paciente = tarea.id_paciente
        nombre = f'{paciente.nombres} {paciente.apellidos}'.strip()

        titulo = tarea.id_regla.titulo_template.format(paciente=nombre)
        cuerpo = tarea.id_regla.cuerpo_template.format(
            paciente=nombre,
            fecha_control=tarea.id_postoperatorio.proximo_control.strftime('%Y-%m-%d %H:%M'),
        )

        if paciente.usuario_id:
            Notificacion.objects.create(
                usuario=paciente.usuario,
                titulo=titulo,
                cuerpo=cuerpo,
                tipo='recordatorio_control',
            )

        tarea.marcar_procesada()

        LogEjecucionRecordatorio.objects.create(
            id_tarea=tarea,
            nivel=NivelLog.INFO,
            mensaje='Recordatorio procesado correctamente.',
        )

    except Exception as exc:
        tarea.marcar_error()

        LogEjecucionRecordatorio.objects.create(
            id_tarea=tarea,
            nivel=NivelLog.ERROR,
            mensaje='Error al procesar recordatorio.',
            detalle=str(exc),
        )

    return tarea