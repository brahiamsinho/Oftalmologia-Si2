from rest_framework import serializers

from apps.atencionClinica.citas.models import Cita
from apps.atencionClinica.postoperatorio.models import Postoperatorio

from .models import (
    LogEjecucionRecordatorio,
    ReglaRecordatorio,
    TareaRecordatorioProgramada,
    TipoReglaRecordatorio,
)
from .services.scheduling import (
    programar_recordatorio_cita,
    programar_recordatorio_postoperatorio,
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
                    'nombre': 'Ya existe una regla con ese nombre.',
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
    """Genera una tarea manualmente (postoperatorio o cita)."""

    id_regla = serializers.PrimaryKeyRelatedField(
        queryset=ReglaRecordatorio.objects.filter(activa=True),
    )
    id_postoperatorio = serializers.PrimaryKeyRelatedField(
        queryset=Postoperatorio.objects.all(),
        required=False,
        allow_null=True,
    )
    id_cita = serializers.PrimaryKeyRelatedField(
        queryset=Cita.objects.all(),
        required=False,
        allow_null=True,
    )

    def validate(self, attrs):
        attrs = super().validate(attrs)

        postop = attrs.get('id_postoperatorio')
        cita = attrs.get('id_cita')
        regla = attrs['id_regla']

        if bool(postop) == bool(cita):
            raise serializers.ValidationError(
                'Indique exactamente uno: id_postoperatorio o id_cita.',
            )

        if postop is not None:
            if regla.tipo_regla != TipoReglaRecordatorio.CONTROL_POSTOPERATORIO:
                raise serializers.ValidationError({
                    'id_regla': 'La regla debe ser de tipo control postoperatorio.',
                })
            if postop.proximo_control is None:
                raise serializers.ValidationError({
                    'id_postoperatorio': 'El postoperatorio no tiene próximo control programado.',
                })

        if cita is not None:
            if regla.tipo_regla != TipoReglaRecordatorio.RECORDATORIO_CITA:
                raise serializers.ValidationError({
                    'id_regla': 'La regla debe ser de tipo recordatorio de cita.',
                })

        return attrs

    def create(self, validated_data):
        regla = validated_data['id_regla']
        postop = validated_data.get('id_postoperatorio')
        cita = validated_data.get('id_cita')

        if postop is not None:
            tarea = programar_recordatorio_postoperatorio(postop, regla=regla)
        else:
            tarea = programar_recordatorio_cita(cita, regla=regla)

        if tarea is None:
            raise serializers.ValidationError(
                'No se pudo programar la tarea (fecha en el pasado o regla inválida).',
            )
        return tarea
