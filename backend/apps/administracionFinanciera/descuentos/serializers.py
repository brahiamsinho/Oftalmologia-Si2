from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from .models import (
    AlcancePromocion,
    BeneficioPaciente,
    EstadoPromocion,
    PromocionDescuento,
    TipoBeneficio,
)
from .services import listar_beneficios_aplicables, verificar_aplicacion_promocion


class PromocionDescuentoSerializer(serializers.ModelSerializer):
    vigente_hoy = serializers.BooleanField(read_only=True)
    creado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = PromocionDescuento
        fields = '__all__'
        read_only_fields = ['id_promocion', 'creado_por', 'created_at', 'updated_at', 'vigente_hoy']

    def get_creado_por_nombre(self, obj) -> str:
        if not obj.creado_por:
            return ''
        return obj.creado_por.get_full_name() or obj.creado_por.email

    def validate_codigo(self, value: str) -> str:
        codigo = (value or '').strip().upper()
        if not codigo:
            raise serializers.ValidationError('El código es obligatorio.')
        return codigo

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

        tipo = attrs.get('tipo_beneficio') or getattr(self.instance, 'tipo_beneficio', None)
        valor = attrs.get('valor')
        if valor is not None and tipo == TipoBeneficio.PORCENTAJE:
            if valor <= 0 or valor > Decimal('100'):
                raise serializers.ValidationError({
                    'valor': 'El porcentaje debe estar entre 0.01 y 100.',
                })

        estado = attrs.get('estado')
        if estado == EstadoPromocion.ACTIVA:
            fin = fecha_fin
            inicio = fecha_inicio or timezone.localdate()
            if fin and fin < inicio:
                raise serializers.ValidationError({
                    'estado': 'No se puede activar con fechas de vigencia inválidas.',
                })

        return attrs


class BeneficioPacienteSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.SerializerMethodField()
    promocion_nombre = serializers.CharField(source='id_promocion.nombre', read_only=True)
    promocion_codigo = serializers.CharField(source='id_promocion.codigo', read_only=True)
    vigente_hoy = serializers.BooleanField(read_only=True)

    class Meta:
        model = BeneficioPaciente
        fields = '__all__'
        read_only_fields = ['id_beneficio', 'created_at', 'updated_at', 'vigente_hoy']

    def get_paciente_nombre(self, obj) -> str:
        return obj.id_paciente.get_full_name()

    def validate(self, attrs):
        attrs = super().validate(attrs)

        promocion = attrs.get('id_promocion') or getattr(self.instance, 'id_promocion', None)
        if promocion and promocion.alcance != AlcancePromocion.ASIGNADA:
            raise serializers.ValidationError({
                'id_promocion': 'Solo se pueden asignar promociones con alcance "Solo pacientes asignados".',
            })

        fecha_inicio = attrs.get('fecha_asignacion')
        fecha_fin = attrs.get('fecha_fin')
        if self.instance:
            fecha_inicio = fecha_inicio or self.instance.fecha_asignacion
            fecha_fin = fecha_fin if 'fecha_fin' in attrs else self.instance.fecha_fin

        if fecha_fin and fecha_inicio and fecha_fin < fecha_inicio:
            raise serializers.ValidationError({
                'fecha_fin': 'La fecha fin no puede ser anterior a la fecha de asignación.',
            })

        return attrs


class BeneficiosAplicablesSerializer(serializers.Serializer):
    paciente_id = serializers.IntegerField()
    fecha = serializers.DateField(required=False, default=timezone.localdate)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        attrs['resultado'] = listar_beneficios_aplicables(
            attrs['paciente_id'],
            fecha=attrs.get('fecha'),
        )
        return attrs


class VerificarAplicacionSerializer(serializers.Serializer):
    paciente_id = serializers.IntegerField()
    promocion_id = serializers.IntegerField()
    fecha = serializers.DateField(required=False, default=timezone.localdate)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        attrs['resultado'] = verificar_aplicacion_promocion(
            attrs['paciente_id'],
            attrs['promocion_id'],
            fecha=attrs.get('fecha'),
        )
        return attrs
