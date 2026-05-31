'use client';

/**
 * Página: Reportes Predictivos — Superadmin
 * Ruta: /platform/dashboard/predicciones
 *
 * Permite al superadmin:
 *  1. Entrenar el modelo Random Forest con datos actuales de la plataforma.
 *  2. Ver métricas del modelo (accuracy / precision / recall / f1).
 *  3. Ejecutar predicción y ver el riesgo operativo de cada tenant.
 *  4. Ver importancia de variables del modelo.
 *  5. Revisar historial de ejecuciones de entrenamiento.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock,
  Loader2,
  Play,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { AxiosError } from 'axios';
import {
  type FeatureImportanceResponse,
  type NivelRiesgo,
  type PredictResponse,
  type PredictionModelRun,
  platformPredictionsService,
} from '@/lib/platformPredictions';

// ── Helpers ────────────────────────────────────────────────────────────

function apiError(err: unknown): string {
  if (err instanceof AxiosError && err.response?.data) {
    const d = err.response.data as Record<string, unknown>;
    if (typeof d.error === 'string') return d.error;
    if (typeof d.detail === 'string') return d.detail;
  }
  if (err instanceof Error) return err.message;
  return 'Error desconocido';
}

function pct(v: number | null): string {
  if (v === null || v === undefined) return '—';
  return `${(v * 100).toFixed(1)}%`;
}

// ── Componentes pequeños ───────────────────────────────────────────────

function Badge({ nivel }: { nivel: NivelRiesgo }) {
  const map: Record<NivelRiesgo, { bg: string; text: string; icon: React.ElementType; label: string }> = {
    bajo:  { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: TrendingDown,  label: 'Bajo' },
    medio: { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: Activity,       label: 'Medio' },
    alto:  { bg: 'bg-red-50',     text: 'text-red-700',      icon: TrendingUp,     label: 'Alto' },
  };
  const cfg = map[nivel] ?? map.medio;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <Icon className="h-3 w-3" strokeWidth={2.2} />
      {cfg.label}
    </span>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" strokeWidth={2} />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: PredictionModelRun['estado'] }) {
  const map = {
    pendiente:  { bg: 'bg-gray-100',    text: 'text-gray-600',  label: 'Pendiente' },
    entrenando: { bg: 'bg-blue-100',    text: 'text-blue-700',  label: 'Entrenando' },
    completado: { bg: 'bg-green-100',   text: 'text-green-700', label: 'Completado' },
    fallido:    { bg: 'bg-red-100',     text: 'text-red-700',   label: 'Fallido' },
  };
  const cfg = map[estado] ?? map.pendiente;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

// ── Página principal ───────────────────────────────────────────────────

export default function PrediccionesPage() {
  const [activeTab, setActiveTab] = useState<'predicciones' | 'features' | 'historial'>('predicciones');

  // Estado entrenamiento
  const [training, setTraining]     = useState(false);
  const [trainMsg, setTrainMsg]     = useState('');
  const [trainError, setTrainError] = useState('');

  // Estado predicciones
  const [predicting, setPredicting]     = useState(false);
  const [predResult, setPredResult]     = useState<PredictResponse | null>(null);
  const [predError, setPredError]       = useState('');
  const [loadingPred, setLoadingPred]   = useState(false);

  // Estado último run
  const [lastRun, setLastRun] = useState<PredictionModelRun | null>(null);

  // Feature importance
  const [importance, setImportance]       = useState<FeatureImportanceResponse | null>(null);
  const [loadingImport, setLoadingImport] = useState(false);

  // Historial
  const [runs, setRuns]           = useState<PredictionModelRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);

  // ── Cargar datos iniciales ──────────────────────────────────────────

  const loadRuns = useCallback(async () => {
    setLoadingRuns(true);
    try {
      const r = await platformPredictionsService.getRuns();
      setRuns(r);
      const completed = r.find(x => x.estado === 'completado');
      if (completed) setLastRun(completed);
    } catch {
      // silencioso
    } finally {
      setLoadingRuns(false);
    }
  }, []);

  const loadResults = useCallback(async () => {
    setLoadingPred(true);
    try {
      const r = await platformPredictionsService.getResults();
      if (r.length > 0) {
        setPredResult({
          total: r.length,
          predicciones: r.map(x => ({
            tenant_schema: x.tenant_schema,
            tenant_nombre: x.tenant_nombre,
            prediccion:   x.prediccion,
            probabilidad: x.probabilidad,
            probabilidades: x.probabilidades_json,
            features: x.features_json,
          })),
          guardadas: r.length,
          run_id: r[0]?.run ?? null,
        });
      }
    } catch {
      // no hay predicciones aún
    } finally {
      setLoadingPred(false);
    }
  }, []);

  const loadImportance = useCallback(async () => {
    setLoadingImport(true);
    try {
      const r = await platformPredictionsService.getFeatureImportance();
      setImportance(r);
    } catch {
      // sin modelo
    } finally {
      setLoadingImport(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();
    loadResults();
  }, [loadRuns, loadResults]);

  useEffect(() => {
    if (activeTab === 'features') loadImportance();
  }, [activeTab, loadImportance]);

  // ── Acciones ────────────────────────────────────────────────────────

  const handleTrain = async () => {
    setTraining(true);
    setTrainMsg('');
    setTrainError('');
    try {
      const r = await platformPredictionsService.train();
      setTrainMsg(r.mensaje);
      setLastRun(r.run);
      await loadRuns();
    } catch (err) {
      setTrainError(apiError(err));
    } finally {
      setTraining(false);
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    setPredError('');
    try {
      const r = await platformPredictionsService.predict();
      setPredResult(r);
    } catch (err) {
      setPredError(apiError(err));
    } finally {
      setPredicting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────

  const riesgoCount = predResult
    ? {
        bajo:  predResult.predicciones.filter(p => p.prediccion === 'bajo').length,
        medio: predResult.predicciones.filter(p => p.prediccion === 'medio').length,
        alto:  predResult.predicciones.filter(p => p.prediccion === 'alto').length,
      }
    : { bajo: 0, medio: 0, alto: 0 };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 shadow-sm">
            <Brain className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reportes Predictivos</h1>
            <p className="text-[12px] text-gray-400">
              Random Forest · Riesgo Operativo por Tenant
            </p>
          </div>
        </div>

        {/* Panel de acciones */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleTrain}
            disabled={training}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
          >
            {training ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {training ? 'Entrenando…' : 'Entrenar modelo'}
          </button>

          <button
            onClick={handlePredict}
            disabled={predicting || !lastRun}
            title={!lastRun ? 'Entrena primero el modelo' : undefined}
            className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-4 py-2 text-[13px] font-medium text-violet-700 shadow-sm transition hover:bg-violet-50 disabled:opacity-50"
          >
            {predicting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {predicting ? 'Prediciendo…' : 'Ejecutar predicción'}
          </button>

          <button
            onClick={() => { loadResults(); loadRuns(); }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
            title="Recargar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Mensajes ── */}
      {trainMsg && (
        <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-[13px] text-green-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {trainMsg}
        </div>
      )}
      {trainError && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-[13px] text-red-700">
          <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {trainError}
        </div>
      )}
      {predError && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-[13px] text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {predError}
        </div>
      )}

      {/* ── Métricas del último modelo ── */}
      {lastRun && lastRun.estado === 'completado' && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Métricas — Último modelo entrenado
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard
              label="Accuracy"
              value={pct(lastRun.accuracy)}
              icon={CheckCircle2}
              color="bg-violet-500"
            />
            <MetricCard
              label="Precision"
              value={pct(lastRun.precision)}
              icon={Shield}
              color="bg-blue-500"
            />
            <MetricCard
              label="Recall"
              value={pct(lastRun.recall)}
              icon={Activity}
              color="bg-amber-500"
            />
            <MetricCard
              label="F1-Score"
              value={pct(lastRun.f1_score)}
              icon={BarChart3}
              color="bg-emerald-500"
            />
          </div>
          <p className="mt-1.5 text-[11px] text-gray-400">
            {lastRun.mensaje_resultado}
          </p>
        </div>
      )}

      {/* ── Tabs ── */}
      <div>
        <div className="flex border-b border-gray-200">
          {(
            [
              { id: 'predicciones', label: 'Predicciones', icon: TrendingUp },
              { id: 'features',     label: 'Variables',    icon: BarChart3 },
              { id: 'historial',    label: 'Historial',    icon: Clock },
            ] as const
          ).map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                  active
                    ? 'border-violet-600 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-[14px] w-[14px]" strokeWidth={active ? 2.2 : 1.8} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── TAB: Predicciones ── */}
        {activeTab === 'predicciones' && (
          <div className="mt-4 space-y-4">
            {/* Resumen de riesgo */}
            {predResult && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{riesgoCount.bajo}</p>
                  <p className="text-[11px] font-semibold text-emerald-600">Riesgo Bajo</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-center">
                  <p className="text-2xl font-bold text-amber-700">{riesgoCount.medio}</p>
                  <p className="text-[11px] font-semibold text-amber-600">Riesgo Medio</p>
                </div>
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">{riesgoCount.alto}</p>
                  <p className="text-[11px] font-semibold text-red-600">Riesgo Alto</p>
                </div>
              </div>
            )}

            {/* Tabla */}
            {loadingPred ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              </div>
            ) : predResult && predResult.predicciones.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-left">
                        <th className="px-4 py-3 font-semibold text-gray-600">Clínica / Tenant</th>
                        <th className="px-4 py-3 font-semibold text-gray-600">Riesgo</th>
                        <th className="px-4 py-3 font-semibold text-gray-600">Probabilidad</th>
                        <th className="px-4 py-3 font-semibold text-gray-600">Pacientes</th>
                        <th className="px-4 py-3 font-semibold text-gray-600">Citas</th>
                        <th className="px-4 py-3 font-semibold text-gray-600">% Canceladas</th>
                        <th className="px-4 py-3 font-semibold text-gray-600">Días activo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {predResult.predicciones.map(p => (
                        <tr key={p.tenant_schema} className="hover:bg-gray-50/60">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">
                              {p.tenant_nombre || p.tenant_schema}
                            </p>
                            <p className="text-[11px] text-gray-400">{p.tenant_schema}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge nivel={p.prediccion} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className={`h-full rounded-full ${
                                    p.prediccion === 'bajo' ? 'bg-emerald-500'
                                    : p.prediccion === 'medio' ? 'bg-amber-500'
                                    : 'bg-red-500'
                                  }`}
                                  style={{ width: `${(p.probabilidad * 100).toFixed(0)}%` }}
                                />
                              </div>
                              <span className="text-gray-700">
                                {(p.probabilidad * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {p.features?.total_pacientes ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {p.features?.total_citas ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {p.features?.pct_canceladas != null
                              ? `${p.features.pct_canceladas}%`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {p.features?.dias_activo ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center">
                <Brain className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-[13px] font-medium text-gray-500">Sin predicciones aún</p>
                <p className="mt-1 text-[12px] text-gray-400">
                  Entrena el modelo y luego presiona &ldquo;Ejecutar predicción&rdquo;
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Variables (Feature Importance) ── */}
        {activeTab === 'features' && (
          <div className="mt-4">
            {loadingImport ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              </div>
            ) : importance && importance.features.length > 0 ? (
              <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">
                  Importancia de variables — Random Forest
                </p>
                <p className="text-[12px] text-gray-500">
                  Variables que más influyen en la predicción de riesgo operativo.
                </p>
                {importance.features.map((f, idx) => (
                  <div key={f.feature} className="flex items-center gap-3">
                    <span className="w-5 text-right text-[10px] font-medium text-gray-400">
                      {idx + 1}
                    </span>
                    <span className="w-44 truncate text-[12px] font-medium text-gray-700">
                      {f.feature}
                    </span>
                    <div className="flex-1">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all"
                          style={{ width: `${Math.min(f.importance_pct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-12 text-right text-[12px] text-gray-600">
                      {f.importance_pct.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center">
                <BarChart3 className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-[13px] font-medium text-gray-500">
                  Sin datos de importancia de variables
                </p>
                <p className="mt-1 text-[12px] text-gray-400">Entrena el modelo primero</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Historial ── */}
        {activeTab === 'historial' && (
          <div className="mt-4">
            {loadingRuns ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              </div>
            ) : runs.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left">
                      <th className="px-4 py-3 font-semibold text-gray-600">Nombre</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Estado</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Accuracy</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">F1</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Muestras</th>
                      <th className="px-4 py-3 font-semibold text-gray-600">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {runs.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{r.nombre}</p>
                          <p className="text-[11px] text-gray-400">{r.objetivo_prediccion}</p>
                        </td>
                        <td className="px-4 py-3">
                          <EstadoBadge estado={r.estado} />
                        </td>
                        <td className="px-4 py-3 text-gray-700">{pct(r.accuracy)}</td>
                        <td className="px-4 py-3 text-gray-700">{pct(r.f1_score)}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {r.total_registros_entrenamiento}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(r.created_at).toLocaleString('es-ES', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center">
                <Clock className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-[13px] font-medium text-gray-500">Sin ejecuciones previas</p>
                <p className="mt-1 text-[12px] text-gray-400">Entrena el modelo para comenzar</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Nota académica ── */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
          <div className="text-[12px] text-blue-700">
            <span className="font-semibold">Nota académica:</span> Las etiquetas de entrenamiento
            (bajo/medio/alto) son generadas por reglas heurísticas al no existir un dataset
            histórico etiquetado. Si hay menos de 10 tenants reales, se complementa con muestras
            sintéticas documentadas. En un entorno productivo, las etiquetas deberían provenir de
            datos históricos verificados por expertos del negocio.
          </div>
        </div>
      </div>
    </div>
  );
}
