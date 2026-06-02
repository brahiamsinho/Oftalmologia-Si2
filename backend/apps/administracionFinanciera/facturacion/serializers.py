from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from .models import CatalogoServicioClinico, CobroClinico, EstadoFactura, FacturaClinica
from .services import anular_factura, calcular_montos_factura, emitir_factura, registrar_cobro_factura


class CatalogoServicioClinicoSerializer(serializers.ModelSerializer):
    tipo_servicio_display = serializers.CharField(source='get_tipo_servicio_display', read_only=True)

    class Meta:
        model = CatalogoServicioClinico
        fields = '__all__'
        read_only_fields = ['id_servicio', 'created_at', 'updated_at']

    def validate_codigo(self, value: str) -> str:
        codigo = (value or '').strip().upper()
        if not codigo:
            raise serializers.ValidationError('El código es obligatorio.')
        return codigo


class CobroClinicoSerializer(serializers.ModelSerializer):
    metodo_pago_display = serializers.CharField(source='get_metodo_pago_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = CobroClinico
        fields = '__all__'
        read_only_fields = ['id_cobro', 'created_at', 'updated_at']


class FacturaClinicaSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.SerializerMethodField()
    servicio_nombre = serializers.CharField(source='id_servicio.nombre', read_only=True)
    servicio_codigo = serializers.CharField(source='id_servicio.codigo', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    promocion_codigo = serializers.CharField(
        source='id_promocion_aplicada.codigo',
        read_only=True,
        allow_null=True,
    )
    cobros = CobroClinicoSerializer(many=True, read_only=True)

    class Meta:
        model = FacturaClinica
        fields = '__all__'
        read_only_fields = [
            'id_factura',
            'numero_factura',
            'monto_base',
            'monto_cobertura_seguro',
            'copago_seguro',
            'monto_descuento',
            'monto_total',
            'saldo_pendiente',
            'detalle_calculo',
            'creado_por',
            'created_at',
            'updated_at',
        ]

    def get_paciente_nombre(self, obj) -> str:
        return obj.id_paciente.get_full_name()


class PreviewFacturaSerializer(serializers.Serializer):
    paciente_id = serializers.IntegerField()
    id_servicio = serializers.IntegerField(required=False, allow_null=True)
    id_cita = serializers.IntegerField(required=False, allow_null=True)
    fecha = serializers.DateField(required=False, default=timezone.localdate)
    promocion_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if not attrs.get('id_servicio') and not attrs.get('id_cita'):
            raise serializers.ValidationError(
                'Debe indicar id_servicio o id_cita.',
            )
        attrs['resultado'] = calcular_montos_factura(
            attrs['paciente_id'],
            id_servicio=attrs.get('id_servicio'),
            id_cita=attrs.get('id_cita'),
            fecha=attrs.get('fecha'),
            promocion_id=attrs.get('promocion_id'),
        )
        return attrs


class EmitirFacturaSerializer(serializers.Serializer):
    paciente_id = serializers.IntegerField()
    id_servicio = serializers.IntegerField(required=False, allow_null=True)
    id_cita = serializers.IntegerField(required=False, allow_null=True)
    fecha = serializers.DateField(required=False, default=timezone.localdate)
    promocion_id = serializers.IntegerField(required=False, allow_null=True)
    observaciones = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if not attrs.get('id_servicio') and not attrs.get('id_cita'):
            raise serializers.ValidationError(
                'Debe indicar id_servicio o id_cita.',
            )
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        return emitir_factura(
            validated_data['paciente_id'],
            id_servicio=validated_data.get('id_servicio'),
            id_cita=validated_data.get('id_cita'),
            fecha=validated_data.get('fecha'),
            promocion_id=validated_data.get('promocion_id'),
            observaciones=validated_data.get('observaciones', ''),
            creado_por=user if user and user.is_authenticated else None,
        )


class RegistrarCobroSerializer(serializers.Serializer):
    monto = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    metodo_pago = serializers.ChoiceField(choices=CobroClinico._meta.get_field('metodo_pago').choices)
    estado = serializers.ChoiceField(
        choices=CobroClinico._meta.get_field('estado').choices,
        default='CONFIRMADO',
        required=False,
    )
    referencia_pasarela = serializers.CharField(required=False, allow_blank=True, default='')
    observaciones = serializers.CharField(required=False, allow_blank=True, default='')

    def create(self, validated_data):
        factura = self.context['factura']
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        return registrar_cobro_factura(
            factura,
            validated_data['monto'],
            validated_data['metodo_pago'],
            estado=validated_data.get('estado', 'CONFIRMADO'),
            referencia_pasarela=validated_data.get('referencia_pasarela', ''),
            observaciones=validated_data.get('observaciones', ''),
            registrado_por=user if user and user.is_authenticated else None,
        )


class AnularFacturaSerializer(serializers.Serializer):
    def save(self, **kwargs):
        factura = self.context['factura']
        return anular_factura(factura)


class ConfirmarPasarelaSerializer(serializers.Serializer):
    referencia_pasarela = serializers.CharField()
    exito = serializers.BooleanField(default=True)

    def create(self, validated_data):
        from django.core.exceptions import ValidationError as DjangoValidationError
        from rest_framework.exceptions import ValidationError as DRFValidationError

        from .services import confirmar_pago_pasarela

        try:
            return confirmar_pago_pasarela(
                validated_data['referencia_pasarela'],
                exito=validated_data['exito'],
            )
        except DjangoValidationError as exc:
            detail = exc.messages if hasattr(exc, 'messages') else [str(exc)]
            raise DRFValidationError({'detail': detail}) from exc
