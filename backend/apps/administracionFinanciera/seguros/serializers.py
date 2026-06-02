from datetime import date, datetime

from django.utils import timezone
from rest_framework import serializers

from .models import AfiliacionSeguroPaciente, Aseguradora, Convenio
from .services import verificar_cobertura_paciente


def _normalize_date(value):
    """
    DRF DateField falla si el valor en instancia viene como datetime.
    Normalizamos para respuesta sin perder compatibilidad de escritura.
    """
    if value is None:
        return None
    if isinstance(value, datetime):
        return timezone.localtime(value).date() if timezone.is_aware(value) else value.date()
    if isinstance(value, date):
        return value
    return value


class AseguradoraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aseguradora
        fields = '__all__'
        read_only_fields = ['id_aseguradora', 'created_at', 'updated_at']

    def validate_codigo(self, value: str) -> str:
        codigo = (value or '').strip().upper()
        if not codigo:
            raise serializers.ValidationError('El código es obligatorio.')
        return codigo


class ConvenioSerializer(serializers.ModelSerializer):
    aseguradora_nombre = serializers.CharField(source='id_aseguradora.nombre', read_only=True)
    vigente_hoy = serializers.BooleanField(read_only=True)

    class Meta:
        model = Convenio
        fields = '__all__'
        read_only_fields = ['id_convenio', 'creado_por', 'created_at', 'updated_at', 'vigente_hoy']

    def validate(self, attrs):
        attrs = super().validate(attrs)

        fecha_inicio = attrs.get('fecha_inicio')
        fecha_fin = attrs.get('fecha_fin')

        if self.instance:
            fecha_inicio = fecha_inicio or self.instance.fecha_inicio
            fecha_fin = fecha_fin if 'fecha_fin' in attrs else self.instance.fecha_fin

        if fecha_fin and fecha_inicio and fecha_fin < fecha_inicio:
            raise serializers.ValidationError({
                'fecha_fin': 'La fecha fin no puede ser anterior a la fecha inicio.',
            })

        porcentaje = attrs.get('porcentaje_cobertura')
        if porcentaje is not None and (porcentaje < 0 or porcentaje > 100):
            raise serializers.ValidationError({
                'porcentaje_cobertura': 'Debe estar entre 0 y 100.',
            })

        return attrs

    def to_representation(self, instance):
        # Hardening: en create/update algunos DateField quedan en memoria como datetime.
        instance.fecha_inicio = _normalize_date(instance.fecha_inicio)
        instance.fecha_fin = _normalize_date(instance.fecha_fin)
        return super().to_representation(instance)


class AfiliacionSeguroPacienteSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.SerializerMethodField()
    convenio_nombre = serializers.CharField(source='id_convenio.nombre', read_only=True)
    aseguradora_nombre = serializers.CharField(source='id_convenio.id_aseguradora.nombre', read_only=True)
    vigente_hoy = serializers.BooleanField(read_only=True)

    class Meta:
        model = AfiliacionSeguroPaciente
        fields = '__all__'
        read_only_fields = ['id_afiliacion', 'created_at', 'updated_at', 'vigente_hoy']

    def get_paciente_nombre(self, obj) -> str:
        return obj.id_paciente.get_full_name()

    def validate(self, attrs):
        attrs = super().validate(attrs)

        convenio = attrs.get('id_convenio') or getattr(self.instance, 'id_convenio', None)
        if convenio and not convenio.activo:
            raise serializers.ValidationError({
                'id_convenio': 'El convenio seleccionado no está activo.',
            })

        fecha_inicio = attrs.get('fecha_inicio')
        fecha_fin = attrs.get('fecha_fin')
        if self.instance:
            fecha_inicio = fecha_inicio or self.instance.fecha_inicio
            fecha_fin = fecha_fin if 'fecha_fin' in attrs else self.instance.fecha_fin

        if fecha_fin and fecha_inicio and fecha_fin < fecha_inicio:
            raise serializers.ValidationError({
                'fecha_fin': 'La fecha fin no puede ser anterior a la fecha inicio.',
            })

        es_principal = attrs.get('es_principal')
        paciente = attrs.get('id_paciente') or getattr(self.instance, 'id_paciente', None)

        if es_principal and paciente:
            qs = AfiliacionSeguroPaciente.objects.filter(
                id_paciente=paciente,
                es_principal=True,
                activo=True,
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    'es_principal': 'El paciente ya tiene otra afiliación marcada como principal.',
                })

        return attrs

    def to_representation(self, instance):
        # Hardening equivalente para afiliaciones.
        instance.fecha_inicio = _normalize_date(instance.fecha_inicio)
        instance.fecha_fin = _normalize_date(instance.fecha_fin)
        return super().to_representation(instance)


class VerificarCoberturaSerializer(serializers.Serializer):
    paciente_id = serializers.IntegerField()
    fecha = serializers.DateField(required=False, allow_null=True)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        fecha = attrs.get('fecha') or timezone.localdate()
        attrs['resultado'] = verificar_cobertura_paciente(
            attrs['paciente_id'],
            fecha=fecha,
        )
        return attrs
