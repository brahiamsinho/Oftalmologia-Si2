"""
Random Forest Service — Módulo de predicciones de plataforma.

Este servicio es el núcleo del módulo de IA para el superadmin.
Funciona 100% en el schema PUBLIC y solo accede a datos de tenants
mediante agregados anónimos (sin exponer información sensible de pacientes).

──────────────────────────────────────────────────────────────────────────────
FLUJO:
  1. collect_training_data()  → recorre tenants activos, extrae features por cada uno
  2. build_features()         → construye DataFrame + genera etiquetas académicas
  3. train_model()            → entrena RandomForestClassifier
  4. save_model() / load_model() → persistencia con joblib
  5. predict()                → clasifica tenants con modelo cargado
  6. get_feature_importance() → importancia de variables

NOTA ACADÉMICA:
  Las etiquetas de entrenamiento (bajo/medio/alto) son generadas por reglas
  heurísticas dado que no existe dataset histórico etiquetado.
  Esto es suficiente para un prototipo funcional de demostración académica.
  En producción real se reemplazarían por etiquetas históricas verificadas.
──────────────────────────────────────────────────────────────────────────────
"""
import logging
import os
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)

# ── Imports opcionales (se instalan vía requirements) ──────────────────────
try:
    import numpy as np
    import pandas as pd
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import (
        accuracy_score,
        f1_score,
        precision_score,
        recall_score,
    )
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder
    import joblib
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    logger.warning(
        'Dependencias de ML no disponibles. '
        'Ejecutar: pip install scikit-learn pandas numpy joblib'
    )

# ── Configuración ──────────────────────────────────────────────────────────
MODEL_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
    'ml_models',
)
MODEL_FILENAME = 'rf_riesgo_operativo_tenant.pkl'
MODEL_PATH = os.path.join(MODEL_DIR, MODEL_FILENAME)

FEATURE_NAMES = [
    'total_pacientes',
    'total_citas',
    'citas_canceladas',
    'citas_pendientes',
    'citas_atendidas',
    'pct_canceladas',
    'total_consultas',
    'total_cirugias',
    'total_postoperatorio',
    'total_bitacora',
    'citas_por_paciente',
    'dias_activo',
    'tiene_suscripcion',
]


class RandomForestPredictionService:
    """
    Servicio principal para predicciones Random Forest de riesgo operativo.

    Uso desde views:
        svc = RandomForestPredictionService()
        result = svc.train_model()          # entrena y devuelve métricas
        predictions = svc.predict()         # predice con modelo guardado
        importance = svc.get_feature_importance()
    """

    def __init__(self):
        self._model: Any = None
        self._encoder: Any = None
        os.makedirs(MODEL_DIR, exist_ok=True)

    # ──────────────────────────────────────────────────────────────────────
    # 1. RECOLECCIÓN DE DATOS
    # ──────────────────────────────────────────────────────────────────────

    def collect_training_data(self) -> list[dict]:
        """
        Recorre todos los tenants activos y extrae features agregadas de cada uno.

        Usa schema_context para cambiar al schema del tenant sin exponerse
        a datos sensibles individuales — solo conteos y ratios.

        Returns:
            Lista de dicts, uno por tenant, con sus features y metadata.
        """
        from django_tenants.utils import schema_context  # noqa: PLC0415
        from apps.tenant.models import Tenant            # noqa: PLC0415

        # Excluir schema 'public' (superadmin) — solo clínicas reales
        tenants = Tenant.objects.exclude(
            schema_name='public',
        ).order_by('schema_name')

        results = []
        for tenant in tenants:
            try:
                features = self._extract_tenant_features(tenant, schema_context)
                results.append(features)
                logger.info(
                    'Features extraídas para tenant %s: %s',
                    tenant.schema_name,
                    {k: v for k, v in features.items() if k not in ('tenant_schema', 'tenant_nombre')},
                )
            except Exception as exc:  # noqa: BLE001
                logger.warning('Error extrayendo features de %s: %s', tenant.schema_name, exc)
                # Agregar con datos mínimos para no perder la fila
                results.append(self._empty_features(tenant))

        logger.info('Total tenants procesados: %d', len(results))
        return results

    def _extract_tenant_features(self, tenant: Any, schema_context: Any) -> dict:
        """Extrae conteos agregados de un tenant específico."""
        schema = tenant.schema_name
        nombre = getattr(tenant, 'nombre', schema)
        created_date = getattr(tenant, 'created_at', None)
        dias_activo = 0
        if created_date:
            if hasattr(created_date, 'date'):
                created_date = created_date.date()
            dias_activo = (datetime.now().date() - created_date).days

        # Checks de suscripción (desde schema público, relación OneToOne)
        tiene_suscripcion = 0
        try:
            sub = getattr(tenant, 'subscription', None)
            if sub is not None and hasattr(sub, 'estado'):
                tiene_suscripcion = 1 if sub.estado in ('ACTIVO', 'TRIAL') else 0
        except Exception:  # noqa: BLE001
            pass

        with schema_context(schema):
            total_citas = total_canceladas = total_pendientes = total_atendidas = 0
            total_pacientes = total_consultas = total_cirugias = 0
            total_postop = total_bitacora = 0

            # Pacientes
            try:
                from apps.pacientes.pacientes.models import Paciente  # noqa: PLC0415
                total_pacientes = Paciente.objects.count()
            except Exception:  # noqa: BLE001
                pass

            # Citas
            try:
                from apps.atencionClinica.citas.models import Cita  # noqa: PLC0415
                total_citas = Cita.objects.count()
                total_canceladas = Cita.objects.filter(
                    estado__in=['CANCELADA', 'NO_ASISTIO'],
                ).count()
                total_pendientes = Cita.objects.filter(estado='PENDIENTE').count()
                total_atendidas  = Cita.objects.filter(estado='ATENDIDA').count()
            except Exception:  # noqa: BLE001
                pass

            # Consultas
            try:
                from apps.atencionClinica.consultas.models import Consulta  # noqa: PLC0415
                total_consultas = Consulta.objects.count()
            except Exception:  # noqa: BLE001
                pass

            # Cirugías
            try:
                from apps.atencionClinica.cirugias.models import Cirugia  # noqa: PLC0415
                total_cirugias = Cirugia.objects.count()
            except Exception:  # noqa: BLE001
                pass

            # Postoperatorio
            try:
                from apps.atencionClinica.postoperatorio.models import Postoperatorio  # noqa: PLC0415
                total_postop = Postoperatorio.objects.count()
            except Exception:  # noqa: BLE001
                pass

            # Bitácora (auditoría)
            try:
                from apps.bitacora.models import Bitacora  # noqa: PLC0415
                total_bitacora = Bitacora.objects.count()
            except Exception:  # noqa: BLE001
                pass

        pct_canceladas = (total_canceladas / total_citas * 100) if total_citas > 0 else 0.0
        citas_por_paciente = (total_citas / total_pacientes) if total_pacientes > 0 else 0.0

        return {
            'tenant_schema':      schema,
            'tenant_nombre':      nombre,
            'total_pacientes':    total_pacientes,
            'total_citas':        total_citas,
            'citas_canceladas':   total_canceladas,
            'citas_pendientes':   total_pendientes,
            'citas_atendidas':    total_atendidas,
            'pct_canceladas':     round(pct_canceladas, 2),
            'total_consultas':    total_consultas,
            'total_cirugias':     total_cirugias,
            'total_postoperatorio': total_postop,
            'total_bitacora':     total_bitacora,
            'citas_por_paciente': round(citas_por_paciente, 2),
            'dias_activo':        dias_activo,
            'tiene_suscripcion':  tiene_suscripcion,
        }

    def _empty_features(self, tenant: Any) -> dict:
        """Features vacías para tenant que no pudo ser procesado."""
        return {
            'tenant_schema':      tenant.schema_name,
            'tenant_nombre':      getattr(tenant, 'nombre', tenant.schema_name),
            'total_pacientes':    0,
            'total_citas':        0,
            'citas_canceladas':   0,
            'citas_pendientes':   0,
            'citas_atendidas':    0,
            'pct_canceladas':     0.0,
            'total_consultas':    0,
            'total_cirugias':     0,
            'total_postoperatorio': 0,
            'total_bitacora':     0,
            'citas_por_paciente': 0.0,
            'dias_activo':        0,
            'tiene_suscripcion':  0,
        }

    # ──────────────────────────────────────────────────────────────────────
    # 2. CONSTRUCCIÓN DE FEATURES Y ETIQUETAS
    # ──────────────────────────────────────────────────────────────────────

    def build_features(self, raw_data: list[dict]) -> tuple:
        """
        Construye DataFrame de features y genera etiquetas de entrenamiento.

        NOTA ACADÉMICA:
          Las etiquetas son generadas por reglas heurísticas.
          En un sistema en producción deben reemplazarse por etiquetas
          históricas verificadas o feedback de expertos.

        Returns:
            (df_features, labels, df_full) — feature matrix, label array, df completo
        """
        if not ML_AVAILABLE:
            raise RuntimeError('Dependencias ML no instaladas.')

        df = pd.DataFrame(raw_data)

        # Generar etiquetas académicas de riesgo operativo
        df['riesgo_operativo'] = df.apply(self._generate_label, axis=1)

        # Separar features de metadatos
        df_features = df[FEATURE_NAMES].fillna(0)
        labels = df['riesgo_operativo'].values

        return df_features, labels, df

    def _generate_label(self, row: Any) -> str:
        """
        Regla heurística para generar etiqueta de riesgo operativo.

        Criterios ALTO (máximo riesgo):
          - Muy pocos pacientes (< 5)
          - % citas canceladas > 40%
          - Tiene cirugías pero pocos postoperatorios de seguimiento (< 30%)
          - Sin actividad en bitácora (posible tenant inactivo)

        Criterios BAJO (riesgo mínimo):
          - Más de 20 pacientes
          - % canceladas < 15%
          - Buena cobertura postoperatoria (≥ 70% de cirugías con seguimiento)
          - Actividad de auditoría presente

        Todo lo demás: MEDIO
        """
        total_pac  = row.get('total_pacientes', 0) or 0
        pct_cancel = row.get('pct_canceladas', 0)  or 0
        total_cir  = row.get('total_cirugias', 0)  or 0
        total_post = row.get('total_postoperatorio', 0) or 0
        total_bit  = row.get('total_bitacora', 0)  or 0

        cobertura_post = (total_post / total_cir) if total_cir > 0 else 1.0

        # Riesgo ALTO
        if (
            total_pac < 5
            or pct_cancel > 40
            or (total_cir > 3 and cobertura_post < 0.30)
            or (total_pac > 0 and total_bit == 0)
        ):
            return 'alto'

        # Riesgo BAJO
        if (
            total_pac >= 20
            and pct_cancel < 15
            and (total_cir == 0 or cobertura_post >= 0.70)
            and total_bit > 0
        ):
            return 'bajo'

        # Riesgo MEDIO (intermedio por defecto)
        return 'medio'

    # ──────────────────────────────────────────────────────────────────────
    # 3. ENTRENAMIENTO
    # ──────────────────────────────────────────────────────────────────────

    def train_model(self) -> dict:
        """
        Entrena el RandomForestClassifier con datos actuales de la plataforma.

        Si hay menos de 5 tenants reales, genera muestras sintéticas académicas
        para poder mostrar un entrenamiento funcional (documentado explícitamente).

        Returns:
            dict con métricas y metadata del entrenamiento.
        """
        if not ML_AVAILABLE:
            raise RuntimeError(
                'Dependencias ML no instaladas. '
                'Ejecutar: pip install scikit-learn pandas numpy joblib'
            )

        raw_data = self.collect_training_data()
        real_count = len(raw_data)
        synthetic_added = 0

        # Completar con sintéticos si no hay suficiente data real
        if real_count < 10:
            synthetic = self._generate_synthetic_samples(10 - real_count)
            raw_data.extend(synthetic)
            synthetic_added = len(synthetic)
            logger.info(
                'Datos insuficientes (%d tenants reales). '
                'Se agregaron %d muestras sintéticas académicas.',
                real_count, synthetic_added,
            )

        df_features, labels, df_full = self.build_features(raw_data)

        # Codificar etiquetas → 0 (alto), 1 (bajo), 2 (medio)
        le = LabelEncoder()
        y_encoded = le.fit_transform(labels)
        X = df_features.values

        # División entrenamiento/prueba (80/20)
        # Con pocas muestras (< 15) usamos todo para entrenamiento para evitar
        # que stratify falle cuando hay menos muestras de test que clases.
        n_clases = len(np.unique(y_encoded))
        min_para_split = max(15, n_clases * 5)   # al menos 5 muestras por clase en test

        if len(X) < min_para_split:
            X_train, X_test, y_train, y_test = X, X, y_encoded, y_encoded
        else:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y_encoded, test_size=0.20, random_state=42, stratify=y_encoded,
            )

        # Entrenar Random Forest
        clf = RandomForestClassifier(
            n_estimators=100,
            max_depth=5,
            min_samples_split=2,
            random_state=42,
            class_weight='balanced',   # manejo de clases desbalanceadas
        )
        clf.fit(X_train, y_train)

        # Evaluar
        y_pred = clf.predict(X_test)
        acc  = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, average='macro', zero_division=0))
        rec  = float(recall_score(y_test, y_pred, average='macro', zero_division=0))
        f1   = float(f1_score(y_test, y_pred, average='macro', zero_division=0))

        # Importancia de variables
        feature_importance = {
            name: float(imp)
            for name, imp in sorted(
                zip(FEATURE_NAMES, clf.feature_importances_),
                key=lambda x: x[1],
                reverse=True,
            )
        }

        # Guardar modelo y encoder
        self._model   = clf
        self._encoder = le
        self.save_model(clf, le)

        mensaje = (
            f'Modelo entrenado con {len(X_train)} muestras '
            f'({real_count} tenants reales + {synthetic_added} sintéticas académicas). '
            f'Accuracy: {acc:.2%}'
        )

        return {
            'accuracy':                    round(acc, 4),
            'precision':                   round(prec, 4),
            'recall':                      round(rec, 4),
            'f1_score':                    round(f1, 4),
            'total_registros':             len(X),
            'tenants_reales':              real_count,
            'muestras_sinteticas':         synthetic_added,
            'feature_importance':          feature_importance,
            'clases':                      list(le.classes_),
            'modelo_path':                 MODEL_PATH,
            'mensaje':                     mensaje,
        }

    def _generate_synthetic_samples(self, n: int) -> list[dict]:
        """
        Genera muestras sintéticas para entrenamiento cuando hay pocos tenants.

        NOTA ACADÉMICA:
          Estas muestras NO representan datos reales de pacientes.
          Son generadas programáticamente para garantizar que el clasificador
          pueda entrenarse con al menos un ejemplo de cada clase.
          Deben eliminarse cuando existan suficientes datos reales.
        """
        import random  # noqa: PLC0415
        random.seed(42)

        samples = []
        perfiles = [
            # Perfil ALTO riesgo
            {
                'total_pacientes': 2, 'total_citas': 5, 'citas_canceladas': 3,
                'citas_pendientes': 2, 'citas_atendidas': 0, 'pct_canceladas': 60.0,
                'total_consultas': 1, 'total_cirugias': 3, 'total_postoperatorio': 0,
                'total_bitacora': 0, 'citas_por_paciente': 2.5, 'dias_activo': 30,
                'tiene_suscripcion': 0,
            },
            # Perfil BAJO riesgo
            {
                'total_pacientes': 50, 'total_citas': 120, 'citas_canceladas': 10,
                'citas_pendientes': 5, 'citas_atendidas': 105, 'pct_canceladas': 8.3,
                'total_consultas': 90, 'total_cirugias': 20, 'total_postoperatorio': 18,
                'total_bitacora': 200, 'citas_por_paciente': 2.4, 'dias_activo': 400,
                'tiene_suscripcion': 1,
            },
            # Perfil MEDIO riesgo
            {
                'total_pacientes': 12, 'total_citas': 30, 'citas_canceladas': 6,
                'citas_pendientes': 8, 'citas_atendidas': 16, 'pct_canceladas': 20.0,
                'total_consultas': 20, 'total_cirugias': 5, 'total_postoperatorio': 3,
                'total_bitacora': 40, 'citas_por_paciente': 2.5, 'dias_activo': 180,
                'tiene_suscripcion': 1,
            },
        ]

        for i in range(n):
            base = perfiles[i % len(perfiles)].copy()
            # Pequeña variación aleatoria para diversidad
            noise = lambda v: max(0, v + random.randint(-2, 2))  # noqa: E731
            base.update({
                k: noise(v) if isinstance(v, int) else round(v + random.uniform(-2, 2), 1)
                for k, v in base.items()
                if k not in ('pct_canceladas',)
            })
            base['tenant_schema'] = f'synthetic_{i:03d}'
            base['tenant_nombre'] = f'[Sintético {i+1}]'
            samples.append(base)

        return samples

    # ──────────────────────────────────────────────────────────────────────
    # 4. PERSISTENCIA DEL MODELO
    # ──────────────────────────────────────────────────────────────────────

    def save_model(self, clf: Any, encoder: Any) -> str:
        """Guarda el modelo y encoder en disco usando joblib."""
        os.makedirs(MODEL_DIR, exist_ok=True)
        payload = {'model': clf, 'encoder': encoder, 'features': FEATURE_NAMES}
        joblib.dump(payload, MODEL_PATH)
        logger.info('Modelo guardado en %s', MODEL_PATH)
        return MODEL_PATH

    def load_model(self) -> bool:
        """
        Carga el modelo desde disco.

        Returns:
            True si se cargó correctamente, False si no existe o falló.
        """
        if not ML_AVAILABLE:
            return False
        if not os.path.exists(MODEL_PATH):
            logger.warning('Modelo no encontrado en %s', MODEL_PATH)
            return False
        try:
            payload = joblib.load(MODEL_PATH)
            self._model   = payload['model']
            self._encoder = payload['encoder']
            logger.info('Modelo cargado desde %s', MODEL_PATH)
            return True
        except Exception as exc:  # noqa: BLE001
            logger.error('Error cargando modelo: %s', exc)
            return False

    # ──────────────────────────────────────────────────────────────────────
    # 5. PREDICCIÓN
    # ──────────────────────────────────────────────────────────────────────

    def predict(self, tenant_schema: str | None = None) -> list[dict]:
        """
        Predice el riesgo operativo de todos los tenants (o uno específico).

        Si el modelo no está en memoria, intenta cargarlo desde disco.
        Si no existe modelo entrenado, levanta RuntimeError con mensaje claro.

        Args:
            tenant_schema: schema específico a predecir, o None para todos.

        Returns:
            Lista de dicts con predicciones por tenant.
        """
        if not ML_AVAILABLE:
            raise RuntimeError('Dependencias ML no instaladas.')

        if self._model is None:
            loaded = self.load_model()
            if not loaded:
                raise RuntimeError(
                    'No hay modelo entrenado. '
                    'Ejecutar primero POST /api/public/platform/predictions/train/'
                )

        raw_data = self.collect_training_data()

        if tenant_schema:
            raw_data = [d for d in raw_data if d['tenant_schema'] == tenant_schema]
            if not raw_data:
                raise ValueError(f'Tenant "{tenant_schema}" no encontrado.')

        results = []
        for row in raw_data:
            try:
                pred_result = self._predict_single(row)
                results.append(pred_result)
            except Exception as exc:  # noqa: BLE001
                logger.warning('Error prediciendo para %s: %s', row.get('tenant_schema'), exc)

        return results

    def _predict_single(self, row: dict) -> dict:
        """Predice el riesgo para un único tenant."""
        features = [row.get(f, 0) or 0 for f in FEATURE_NAMES]
        X = np.array(features).reshape(1, -1)

        pred_encoded = self._model.predict(X)[0]
        proba = self._model.predict_proba(X)[0]

        pred_label = self._encoder.inverse_transform([pred_encoded])[0]
        clases = list(self._encoder.classes_)

        probabilidades = {c: round(float(p), 4) for c, p in zip(clases, proba)}
        probabilidad_max = round(float(max(proba)), 4)

        return {
            'tenant_schema':     row['tenant_schema'],
            'tenant_nombre':     row.get('tenant_nombre', row['tenant_schema']),
            'prediccion':        pred_label,
            'probabilidad':      probabilidad_max,
            'probabilidades':    probabilidades,
            'features':          {f: row.get(f, 0) for f in FEATURE_NAMES},
        }

    # ──────────────────────────────────────────────────────────────────────
    # 6. IMPORTANCIA DE VARIABLES
    # ──────────────────────────────────────────────────────────────────────

    def get_feature_importance(self) -> list[dict]:
        """
        Devuelve la importancia de variables del modelo cargado.

        Returns:
            Lista ordenada descendente: [{feature, importance, importance_pct}]
        """
        if not ML_AVAILABLE:
            raise RuntimeError('Dependencias ML no instaladas.')

        if self._model is None:
            loaded = self.load_model()
            if not loaded:
                raise RuntimeError('No hay modelo entrenado. Entrene primero.')

        importances = self._model.feature_importances_
        total = sum(importances)

        return sorted(
            [
                {
                    'feature':        name,
                    'importance':     round(float(imp), 6),
                    'importance_pct': round(float(imp / total * 100), 2) if total > 0 else 0,
                }
                for name, imp in zip(FEATURE_NAMES, importances)
            ],
            key=lambda x: x['importance'],
            reverse=True,
        )
