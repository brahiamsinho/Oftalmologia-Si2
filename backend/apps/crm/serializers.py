from rest_framework import serializers

from .models import CampanaCRM, HistorialContacto, SegmentacionPaciente


class SegmentacionPacienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SegmentacionPaciente
        fields = '__all__'
        read_only_fields = ['id_segmentacion', 'tenant', 'created_at', 'updated_at']

    def validate(self, attrs):
        attrs = super().validate(attrs)
        nombre = attrs.get('nombre') or getattr(self.instance, 'nombre', None)
        tenant = getattr(self.context.get('request'), 'tenant', None) or getattr(self.instance, 'tenant', None)
        if nombre and tenant is not None:
            qs = SegmentacionPaciente.objects.filter(tenant=tenant, nombre=nombre)
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({'nombre': 'Ya existe una segmentación con ese nombre en este tenant.'})
        return attrs


class CampanaCRMSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampanaCRM
        fields = '__all__'
        read_only_fields = ['id_campana', 'tenant', 'creado_por', 'created_at', 'updated_at']

    def validate(self, attrs):
        attrs = super().validate(attrs)
        fecha_inicio = attrs.get('fecha_inicio')
        fecha_fin = attrs.get('fecha_fin')
        tenant = getattr(self.context.get('request'), 'tenant', None) or getattr(self.instance, 'tenant', None)
        segmentacion = attrs.get('id_segmentacion') or getattr(self.instance, 'id_segmentacion', None)

        if self.instance:
            fecha_inicio = fecha_inicio or self.instance.fecha_inicio
            fecha_fin = fecha_fin if 'fecha_fin' in attrs else self.instance.fecha_fin

        if fecha_fin and fecha_inicio and fecha_fin < fecha_inicio:
            raise serializers.ValidationError(
                {'fecha_fin': 'La fecha fin no puede ser anterior a la fecha inicio.'}
            )
        if tenant is not None and segmentacion is not None and getattr(segmentacion, 'tenant_id', None) != tenant.pk:
            raise serializers.ValidationError({'id_segmentacion': 'La segmentación no pertenece al tenant actual.'})
        return attrs


class HistorialContactoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistorialContacto
        fields = '__all__'
        read_only_fields = ['id_historial_contacto', 'tenant', 'contactado_por', 'created_at', 'updated_at']

    def validate(self, attrs):
        attrs = super().validate(attrs)
        tenant = getattr(self.context.get('request'), 'tenant', None) or getattr(self.instance, 'tenant', None)
        paciente = attrs.get('id_paciente') or getattr(self.instance, 'id_paciente', None)
        campana = attrs.get('id_campana') or getattr(self.instance, 'id_campana', None)

        if tenant is not None:
            if paciente is not None and getattr(paciente, 'tenant_id', None) != tenant.pk:
                raise serializers.ValidationError({'id_paciente': 'El paciente no pertenece al tenant actual.'})
            if campana is not None and getattr(campana, 'tenant_id', None) != tenant.pk:
                raise serializers.ValidationError({'id_campana': 'La campaña no pertenece al tenant actual.'})
        return attrs
