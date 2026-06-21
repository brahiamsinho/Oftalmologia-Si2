from rest_framework import serializers

from .models import (
    DocumentoClinicoAutorizado,
    EstadoDocumentoClinico,
    HistoriaClinica,
)

class HistoriaClinicaSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.SerializerMethodField()

    class Meta:
        model = HistoriaClinica
        fields = [
            'id_historia_clinica', 'id_paciente', 'paciente_nombre',
            'fecha_apertura', 'motivo_apertura', 'estado', 'observaciones',
        ]
        read_only_fields = ['id_historia_clinica']

    def get_paciente_nombre(self, obj):
        return obj.id_paciente.get_full_name()

    def validate_id_paciente(self, value):
        """Un paciente solo puede tener una historia (OneToOne en el modelo)."""
        if self.instance is None and HistoriaClinica.objects.filter(id_paciente=value).exists():
            raise serializers.ValidationError(
                'Este paciente ya tiene una historia clínica. Editá la existente o elegí otro paciente.'
            )
        return value

class HistoriaClinicaDetalleSerializer(HistoriaClinicaSerializer):
    """Versión con todos los sub-registros incluidos importados en lazy load para evitar imports circulares."""
    antecedentes = serializers.SerializerMethodField()
    diagnosticos = serializers.SerializerMethodField()
    evoluciones = serializers.SerializerMethodField()
    recetas = serializers.SerializerMethodField()

    class Meta(HistoriaClinicaSerializer.Meta):
        fields = HistoriaClinicaSerializer.Meta.fields + [
            'antecedentes', 'diagnosticos', 'evoluciones', 'recetas',
        ]

    def get_antecedentes(self, obj):
        from apps.atencionClinica.antecedentes.serializers import AntecedenteClinicoSerializer
        return AntecedenteClinicoSerializer(obj.antecedentes.all(), many=True).data

    def get_diagnosticos(self, _obj):
        return []

    def get_evoluciones(self, _obj):
        return []

    def get_recetas(self, _obj):
        documentos = DocumentoClinicoAutorizado.objects.select_related(
            'autorizado_por',
            'id_paciente',
        ).filter(
            id_historia_clinica=_obj,
            estado=EstadoDocumentoClinico.AUTORIZADO,
        ).order_by('-autorizado_en', '-fecha_emision')
        return DocumentoClinicoAutorizadoSerializer(documentos, many=True, context=self.context).data


class DocumentoClinicoAutorizadoSerializer(serializers.ModelSerializer):
    paciente_nombre = serializers.SerializerMethodField()
    autorizado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = DocumentoClinicoAutorizado
        fields = [
            'id_documento_clinico',
            'id_historia_clinica',
            'id_paciente',
            'paciente_nombre',
            'tipo_documento',
            'estado',
            'titulo',
            'contenido',
            'nombre_archivo_descarga',
            'fecha_emision',
            'autorizado_por',
            'autorizado_por_nombre',
            'autorizado_en',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id_documento_clinico',
            'id_historia_clinica',
            'id_paciente',
            'estado',
            'autorizado_por',
            'autorizado_por_nombre',
            'autorizado_en',
            'fecha_emision',
            'created_at',
            'updated_at',
        ]

    def get_paciente_nombre(self, obj):
        return obj.id_paciente.get_full_name()

    def get_autorizado_por_nombre(self, obj):
        if not obj.autorizado_por:
            return None
        return obj.autorizado_por.get_full_name()
