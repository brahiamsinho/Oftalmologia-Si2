"""
Serializers para los modelos de platform_predictions.
"""
from rest_framework import serializers
from .models import PredictionModelRun, PredictionResult


class PredictionModelRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictionModelRun
        fields = [
            'id', 'nombre', 'objetivo_prediccion', 'estado',
            'accuracy', 'precision', 'recall', 'f1_score',
            'total_registros_entrenamiento', 'modelo_path',
            'mensaje_resultado', 'feature_importance_json',
            'created_at', 'updated_at',
        ]
        read_only_fields = fields


class PredictionResultSerializer(serializers.ModelSerializer):
    run_nombre = serializers.CharField(source='run.nombre', read_only=True)

    class Meta:
        model = PredictionResult
        fields = [
            'id', 'run', 'run_nombre',
            'entidad_tipo', 'entidad_id', 'tenant_schema', 'tenant_nombre',
            'prediccion', 'probabilidad', 'probabilidades_json', 'features_json',
            'created_at',
        ]
        read_only_fields = fields
