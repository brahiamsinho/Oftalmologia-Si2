from django.contrib import admin
from .models import PredictionModelRun, PredictionResult


@admin.register(PredictionModelRun)
class PredictionModelRunAdmin(admin.ModelAdmin):
    list_display  = ['nombre', 'estado', 'accuracy', 'f1_score',
                     'total_registros_entrenamiento', 'created_at']
    list_filter   = ['estado', 'objetivo_prediccion']
    readonly_fields = [
        'id', 'accuracy', 'precision', 'recall', 'f1_score',
        'total_registros_entrenamiento', 'modelo_path',
        'feature_importance_json', 'created_at', 'updated_at',
    ]
    ordering = ['-created_at']


@admin.register(PredictionResult)
class PredictionResultAdmin(admin.ModelAdmin):
    list_display  = ['tenant_nombre', 'prediccion', 'probabilidad',
                     'tenant_schema', 'created_at']
    list_filter   = ['prediccion', 'entidad_tipo']
    search_fields = ['tenant_schema', 'tenant_nombre']
    readonly_fields = [
        'id', 'run', 'prediccion', 'probabilidad',
        'probabilidades_json', 'features_json', 'created_at',
    ]
    ordering = ['-created_at']
