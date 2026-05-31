"""
Modelos para el módulo de predicciones de plataforma con Random Forest.

Estos modelos viven en el schema PUBLIC (SHARED_APPS).
No se replican en schemas de clínicas (no están en TENANT_APPS).

Relación entre modelos:
  PredictionModelRun (1) ──── (N) PredictionResult
"""
import uuid
from django.db import models


class EstadoEntrenamiento(models.TextChoices):
    PENDIENTE   = 'pendiente',   'Pendiente'
    ENTRENANDO  = 'entrenando',  'Entrenando'
    COMPLETADO  = 'completado',  'Completado'
    FALLIDO     = 'fallido',     'Fallido'


class NivelRiesgo(models.TextChoices):
    BAJO  = 'bajo',  'Bajo'
    MEDIO = 'medio', 'Medio'
    ALTO  = 'alto',  'Alto'


class PredictionModelRun(models.Model):
    """
    Registro de cada ejecución de entrenamiento del modelo Random Forest.

    Cada vez que el superadmin presiona "Entrenar modelo", se crea un Run.
    Guarda métricas, ruta al archivo .pkl y estado del proceso.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    nombre = models.CharField(
        max_length=200,
        default='Riesgo Operativo Tenant',
        help_text='Nombre descriptivo del modelo entrenado.',
    )
    objetivo_prediccion = models.CharField(
        max_length=100,
        default='riesgo_operativo_tenant',
        help_text='Variable objetivo que predice el modelo.',
    )

    estado = models.CharField(
        max_length=20,
        choices=EstadoEntrenamiento.choices,
        default=EstadoEntrenamiento.PENDIENTE,
        db_index=True,
    )

    # Métricas de calidad del modelo (null si aún no completó)
    accuracy  = models.FloatField(null=True, blank=True, help_text='Exactitud global (0–1).')
    precision = models.FloatField(null=True, blank=True, help_text='Precisión macro (0–1).')
    recall    = models.FloatField(null=True, blank=True, help_text='Recall macro (0–1).')
    f1_score  = models.FloatField(null=True, blank=True, help_text='F1-score macro (0–1).')

    total_registros_entrenamiento = models.IntegerField(
        default=0,
        help_text='Número de muestras (tenants) usadas para entrenar.',
    )

    modelo_path = models.CharField(
        max_length=500,
        blank=True,
        help_text='Ruta al archivo .pkl generado por joblib.',
    )

    mensaje_resultado = models.TextField(
        blank=True,
        help_text='Mensaje de éxito o descripción del error si falló.',
    )

    # Importancia de variables serializada como JSON
    feature_importance_json = models.JSONField(
        default=dict,
        blank=True,
        help_text='Dict {nombre_feature: importancia} ordenado descendente.',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'platform_predictions'
        ordering = ['-created_at']
        verbose_name = 'Ejecución de Modelo Predictivo'
        verbose_name_plural = 'Ejecuciones de Modelos Predictivos'

    def __str__(self):
        return f'{self.nombre} [{self.estado}] – {self.created_at:%Y-%m-%d %H:%M}'


class PredictionResult(models.Model):
    """
    Resultado individual de una predicción para una entidad (tenant, etc.).

    Se genera al ejecutar el endpoint /predict/.
    Cada resultado está asociado a un PredictionModelRun específico.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    run = models.ForeignKey(
        PredictionModelRun,
        on_delete=models.CASCADE,
        related_name='results',
        help_text='Modelo que generó esta predicción.',
    )

    # Entidad predicha
    entidad_tipo = models.CharField(
        max_length=50,
        default='tenant',
        help_text='Tipo de entidad: tenant, paciente, cita, pago, etc.',
    )
    entidad_id = models.CharField(
        max_length=100,
        blank=True,
        help_text='ID opcional de la entidad específica.',
    )
    tenant_schema = models.CharField(
        max_length=200,
        blank=True,
        help_text='Schema del tenant si la entidad es de tipo tenant.',
        db_index=True,
    )
    tenant_nombre = models.CharField(
        max_length=200,
        blank=True,
        help_text='Nombre del tenant para display.',
    )

    # Resultado de la predicción
    prediccion = models.CharField(
        max_length=20,
        choices=NivelRiesgo.choices,
        help_text='Nivel de riesgo predicho: bajo | medio | alto.',
    )
    probabilidad = models.FloatField(
        help_text='Probabilidad de la clase predicha (0–1).',
    )
    probabilidades_json = models.JSONField(
        default=dict,
        blank=True,
        help_text='Dict {clase: probabilidad} para las 3 clases.',
    )

    # Features usadas para generar esta predicción
    features_json = models.JSONField(
        default=dict,
        blank=True,
        help_text='Dict con los valores de cada feature usada.',
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'platform_predictions'
        ordering = ['-created_at', 'tenant_schema']
        verbose_name = 'Resultado de Predicción'
        verbose_name_plural = 'Resultados de Predicciones'

    def __str__(self):
        return f'{self.tenant_nombre or self.tenant_schema} → {self.prediccion} ({self.probabilidad:.0%})'
