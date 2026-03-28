from rest_framework import serializers
from .models import HistoriaClinica

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
        from apps.antecedentes.serializers import AntecedenteClinicoSerializer
        return AntecedenteClinicoSerializer(obj.antecedentes.all(), many=True).data

    def get_diagnosticos(self, obj):
        from apps.diagnosticos.serializers import DiagnosticoClinicoSerializer
        return DiagnosticoClinicoSerializer(obj.diagnosticos.all(), many=True).data

    def get_evoluciones(self, obj):
        from apps.evoluciones.serializers import EvolucionClinicaSerializer
        return EvolucionClinicaSerializer(obj.evoluciones.all(), many=True).data

    def get_recetas(self, obj):
        from apps.recetas.serializers import RecetaSerializer
        return RecetaSerializer(obj.recetas.all(), many=True).data
