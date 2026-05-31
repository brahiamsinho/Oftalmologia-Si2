/**
 * Servicio frontend para el módulo de predicciones Random Forest del superadmin.
 *
 * Usa `platformApi` (autenticado con token de plataforma) para consumir:
 *   POST /api/public/platform/predictions/train/
 *   GET  /api/public/platform/predictions/runs/
 *   GET  /api/public/platform/predictions/results/
 *   POST /api/public/platform/predictions/predict/
 *   GET  /api/public/platform/predictions/feature-importance/
 */
import { platformApi } from './platformApi';

// ── Tipos de dominio ────────────────────────────────────────────────────

export type EstadoRun = 'pendiente' | 'entrenando' | 'completado' | 'fallido';
export type NivelRiesgo = 'bajo' | 'medio' | 'alto';

export interface PredictionModelRun {
  id: string;
  nombre: string;
  objetivo_prediccion: string;
  estado: EstadoRun;
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1_score: number | null;
  total_registros_entrenamiento: number;
  modelo_path: string;
  mensaje_resultado: string;
  feature_importance_json: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface PredictionResult {
  id: string;
  run: string;
  run_nombre: string;
  entidad_tipo: string;
  entidad_id: string;
  tenant_schema: string;
  tenant_nombre: string;
  prediccion: NivelRiesgo;
  probabilidad: number;
  probabilidades_json: Record<string, number>;
  features_json: Record<string, number>;
  created_at: string;
}

export interface TrainResponse {
  run: PredictionModelRun;
  clases: string[];
  tenants_reales: number;
  muestras_sinteticas: number;
  mensaje: string;
}

export interface PredictResponse {
  total: number;
  predicciones: Array<{
    tenant_schema: string;
    tenant_nombre: string;
    prediccion: NivelRiesgo;
    probabilidad: number;
    probabilidades: Record<string, number>;
    features: Record<string, number>;
  }>;
  guardadas: number;
  run_id: string | null;
}

export interface FeatureImportanceResponse {
  run_id?: string;
  run_nombre?: string;
  features: Array<{
    feature: string;
    importance: number;
    importance_pct: number;
  }>;
}

// ── Servicio ────────────────────────────────────────────────────────────

export const platformPredictionsService = {
  /**
   * Entrena el modelo Random Forest con datos actuales de la plataforma.
   * Puede tardar varios segundos.
   */
  async train(): Promise<TrainResponse> {
    // platformApi.baseURL ya es /api/public → solo agregar el sufijo del módulo
    const { data } = await platformApi.post<TrainResponse>(
      '/platform/predictions/train/',
    );
    return data;
  },

  /** Lista todas las ejecuciones de entrenamiento (últimas 50). */
  async getRuns(): Promise<PredictionModelRun[]> {
    const { data } = await platformApi.get<PredictionModelRun[]>(
      '/platform/predictions/runs/',
    );
    return data;
  },

  /** Lista resultados de predicción del último run completado (o por run_id). */
  async getResults(runId?: string): Promise<PredictionResult[]> {
    const params = runId ? { run_id: runId } : {};
    const { data } = await platformApi.get<PredictionResult[]>(
      '/platform/predictions/results/',
      { params },
    );
    return data;
  },

  /**
   * Ejecuta predicción para todos los tenants (o solo uno).
   * Requiere modelo entrenado previamente.
   */
  async predict(tenantSchema?: string): Promise<PredictResponse> {
    const body = tenantSchema ? { tenant_schema: tenantSchema } : {};
    const { data } = await platformApi.post<PredictResponse>(
      '/platform/predictions/predict/',
      body,
    );
    return data;
  },

  /** Obtiene la importancia de variables del modelo entrenado. */
  async getFeatureImportance(): Promise<FeatureImportanceResponse> {
    const { data } = await platformApi.get<FeatureImportanceResponse>(
      '/platform/predictions/feature-importance/',
    );
    return data;
  },
};
