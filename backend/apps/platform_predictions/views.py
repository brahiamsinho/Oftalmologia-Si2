"""
Views (endpoints DRF) para el módulo de predicciones de plataforma.

Todos los endpoints están protegidos con:
  - PlatformJWTAuthentication  → solo acepta token con scope='platform'
  - IsPlatformAdministrator    → solo admins activos de plataforma

URL base: /api/public/platform/predictions/
"""
import logging

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.authentication import PlatformJWTAuthentication
from apps.core.permissions import IsPlatformAdministrator
from .models import EstadoEntrenamiento, PredictionModelRun, PredictionResult
from .serializers import PredictionModelRunSerializer, PredictionResultSerializer
from .services.random_forest_service import ML_AVAILABLE, RandomForestPredictionService

logger = logging.getLogger(__name__)


class TrainModelView(APIView):
    """
    POST /api/public/platform/predictions/train/

    Entrena el modelo Random Forest con datos actuales de la plataforma.
    Crea un registro PredictionModelRun y devuelve las métricas.

    Puede tomar varios segundos si hay muchos tenants.
    """
    authentication_classes = [PlatformJWTAuthentication]
    permission_classes = [IsPlatformAdministrator]

    def post(self, request):
        if not ML_AVAILABLE:
            return Response(
                {
                    'error': (
                        'Dependencias de Machine Learning no instaladas en el servidor. '
                        'Ejecutar: pip install scikit-learn pandas numpy joblib'
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Crear run en estado ENTRENANDO
        run = PredictionModelRun.objects.create(
            nombre='Riesgo Operativo Tenant',
            objetivo_prediccion='riesgo_operativo_tenant',
            estado=EstadoEntrenamiento.ENTRENANDO,
        )

        try:
            svc = RandomForestPredictionService()
            result = svc.train_model()

            run.estado = EstadoEntrenamiento.COMPLETADO
            run.accuracy = result['accuracy']
            run.precision = result['precision']
            run.recall = result['recall']
            run.f1_score = result['f1_score']
            run.total_registros_entrenamiento = result['total_registros']
            run.modelo_path = result['modelo_path']
            run.mensaje_resultado = result['mensaje']
            run.feature_importance_json = result['feature_importance']
            run.save()

            return Response(
                {
                    'run': PredictionModelRunSerializer(run).data,
                    'clases': result.get('clases', []),
                    'tenants_reales': result.get('tenants_reales', 0),
                    'muestras_sinteticas': result.get('muestras_sinteticas', 0),
                    'mensaje': result['mensaje'],
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as exc:  # noqa: BLE001
            run.estado = EstadoEntrenamiento.FALLIDO
            run.mensaje_resultado = str(exc)
            run.save()
            logger.exception('Error entrenando modelo: %s', exc)
            return Response(
                {'error': str(exc), 'run_id': str(run.id)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RunsListView(APIView):
    """
    GET /api/public/platform/predictions/runs/

    Lista todas las ejecuciones de entrenamiento, ordenadas por fecha descendente.
    """
    authentication_classes = [PlatformJWTAuthentication]
    permission_classes = [IsPlatformAdministrator]

    def get(self, request):
        runs = PredictionModelRun.objects.all()[:50]
        return Response(PredictionModelRunSerializer(runs, many=True).data)


class ResultsListView(APIView):
    """
    GET /api/public/platform/predictions/results/

    Lista predicciones del run más reciente completado.
    Query param: ?run_id=<uuid> para filtrar por run específico.
    """
    authentication_classes = [PlatformJWTAuthentication]
    permission_classes = [IsPlatformAdministrator]

    def get(self, request):
        run_id = request.query_params.get('run_id')

        if run_id:
            results = PredictionResult.objects.filter(run_id=run_id)
        else:
            # Último run completado
            last_run = PredictionModelRun.objects.filter(
                estado=EstadoEntrenamiento.COMPLETADO,
            ).first()
            if not last_run:
                return Response([])
            results = PredictionResult.objects.filter(run=last_run)

        return Response(PredictionResultSerializer(results, many=True).data)


class PredictView(APIView):
    """
    POST /api/public/platform/predictions/predict/

    Ejecuta predicción con el modelo entrenado actualmente.
    Guarda los resultados en PredictionResult asociados al último run completado.

    Body (opcional):
        { "tenant_schema": "clinica_xyz" }  → predice solo ese tenant
        {}                                  → predice todos los tenants
    """
    authentication_classes = [PlatformJWTAuthentication]
    permission_classes = [IsPlatformAdministrator]

    def post(self, request):
        if not ML_AVAILABLE:
            return Response(
                {'error': 'Dependencias ML no instaladas.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        tenant_schema = request.data.get('tenant_schema')

        try:
            svc = RandomForestPredictionService()
            predictions = svc.predict(tenant_schema=tenant_schema)
        except RuntimeError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:  # noqa: BLE001
            logger.exception('Error en predicción: %s', exc)
            return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Asociar al último run completado
        last_run = PredictionModelRun.objects.filter(
            estado=EstadoEntrenamiento.COMPLETADO,
        ).first()

        saved_results = []
        if last_run:
            for pred in predictions:
                result_obj = PredictionResult.objects.create(
                    run=last_run,
                    entidad_tipo='tenant',
                    tenant_schema=pred['tenant_schema'],
                    tenant_nombre=pred['tenant_nombre'],
                    prediccion=pred['prediccion'],
                    probabilidad=pred['probabilidad'],
                    probabilidades_json=pred.get('probabilidades', {}),
                    features_json=pred.get('features', {}),
                )
                saved_results.append(PredictionResultSerializer(result_obj).data)

        return Response(
            {
                'total': len(predictions),
                'predicciones': predictions,
                'guardadas': len(saved_results),
                'run_id': str(last_run.id) if last_run else None,
            },
            status=status.HTTP_200_OK,
        )


class FeatureImportanceView(APIView):
    """
    GET /api/public/platform/predictions/feature-importance/

    Devuelve la importancia de variables del modelo entrenado más reciente.
    Si hay un run completado, usa sus datos guardados (sin re-cargar el modelo).
    """
    authentication_classes = [PlatformJWTAuthentication]
    permission_classes = [IsPlatformAdministrator]

    def get(self, request):
        # Intentar obtener de la última ejecución completada
        last_run = PredictionModelRun.objects.filter(
            estado=EstadoEntrenamiento.COMPLETADO,
        ).first()

        if last_run and last_run.feature_importance_json:
            importance_list = [
                {
                    'feature': k,
                    'importance': v,
                    'importance_pct': round(v * 100, 2),
                }
                for k, v in sorted(
                    last_run.feature_importance_json.items(),
                    key=lambda x: x[1],
                    reverse=True,
                )
            ]
            return Response(
                {
                    'run_id':     str(last_run.id),
                    'run_nombre': last_run.nombre,
                    'features':   importance_list,
                }
            )

        # Fallback: cargar modelo desde disco
        if not ML_AVAILABLE:
            return Response(
                {'error': 'Sin modelo entrenado y dependencias ML no disponibles.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            svc = RandomForestPredictionService()
            importance = svc.get_feature_importance()
            return Response({'features': importance})
        except RuntimeError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
