'use client';

import { useState, useEffect } from 'react';
import { Check, X, Loader2, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import type { TenantSubscriptionPlan } from '@/lib/types';

// ── Tipos ────────────────────────────────────────────────────────────────────
interface PlanAPI extends TenantSubscriptionPlan {
  id_plan: number;
  descripcion: string;
  moneda: string;
}

interface TenantOrgResponse {
  subscription?: {
    plan?: PlanAPI;
    estado?: string;
    esta_activa?: boolean;
  } | null;
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function PlanesPage() {
  const [planes,       setPlanes]       = useState<PlanAPI[]>([]);
  const [planActual,   setPlanActual]   = useState<PlanAPI | null>(null);
  const [loading,      setLoading]      = useState(true);

  // Estado del modal de confirmación de upgrade
  const [upgradePlan,  setUpgradePlan]  = useState<PlanAPI | null>(null);
  const [upgrading,    setUpgrading]    = useState(false);
  const [upgradeOk,    setUpgradeOk]    = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [confirmarDowngrade, setConfirmarDowngrade] = useState(false);

  useEffect(() => {
    Promise.all([
      // Planes disponibles — endpoint público (sin prefijo de tenant)
      api.get<{ results?: PlanAPI[] } | PlanAPI[]>('/plans/')
        .then(res => {
          const data = res.data;
          return Array.isArray(data) ? data : (data.results ?? []);
        }),
      // Plan del tenant actual
      api.get<TenantOrgResponse>('organization/me/')
        .then(res => res.data.subscription?.plan ?? null),
    ])
      .then(([listaPlanes, planTenant]) => {
        setPlanes(listaPlanes);
        setPlanActual(planTenant ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const esDowngrade = (plan: PlanAPI) =>
    planActual !== null && plan.precio_mensual < planActual.precio_mensual;

  const handleCambiarPlan = async () => {
    if (!upgradePlan) return;
    setUpgrading(true);
    setUpgradeError('');
    try {
      await api.post('organization/change-plan/', {
        plan: upgradePlan.codigo,
        confirmar_downgrade: esDowngrade(upgradePlan) ? confirmarDowngrade : undefined,
      });
      // Refrescar plan actual
      const res = await api.get<TenantOrgResponse>('organization/me/');
      setPlanActual(res.data.subscription?.plan ?? null);
      setUpgradeOk(true);
      setTimeout(() => {
        setUpgradePlan(null);
        setUpgradeOk(false);
        setConfirmarDowngrade(false);
      }, 2500);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { detail?: string; confirmar_downgrade?: string } } })?.response?.data;
      setUpgradeError(data?.confirmar_downgrade ?? data?.detail ?? 'No se pudo cambiar el plan. Intentá de nuevo.');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-[14px]">Cargando planes...</span>
      </div>
    );
  }

  const FEATURES: Array<{ key: keyof PlanAPI; label: string }> = [
    { key: 'max_usuarios',         label: 'Usuarios' },
    { key: 'max_pacientes',        label: 'Pacientes' },
    { key: 'max_citas_mes',        label: 'Citas por mes' },
    { key: 'max_almacenamiento_mb',label: 'Almacenamiento' },
    { key: 'permite_crm',          label: 'Módulo CRM' },
    { key: 'permite_notificaciones',label: 'Notificaciones automáticas' },
    { key: 'permite_reportes_avanzados', label: 'Reportes avanzados' },
    { key: 'permite_soporte_prioritario', label: 'Soporte prioritario' },
  ];

  const formatFeatureValue = (key: keyof PlanAPI, value: unknown): React.ReactNode => {
    if (typeof value === 'boolean') return null; // se maneja con Check/X
    if (key === 'max_almacenamiento_mb' && typeof value === 'number') {
      return value >= 1000 ? `${value / 1000} GB` : `${value} MB`;
    }
    if (typeof value === 'number') return value.toLocaleString('es');
    return String(value);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

      {/* Header */}
      <div className="text-center">
        <h1 className="text-[28px] font-extrabold text-gray-900 mb-2">Planes y Suscripción</h1>
        <p className="text-[14px] text-gray-500">
          Elegí el plan que mejor se adapte a tu clínica.
          {planActual && (
            <span className="ml-2 inline-flex items-center gap-1 text-blue-700 font-semibold">
              Plan actual: <span className="bg-blue-100 px-2 py-0.5 rounded-full text-[13px]">{planActual.nombre}</span>
            </span>
          )}
        </p>
      </div>

      {/* Grid de planes */}
      {planes.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-[14px]">
          No hay planes disponibles en este momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planes.map(plan => {
            const esPlanActual   = planActual?.codigo === plan.codigo;
            const esPopular      = plan.codigo === 'PLUS';
            const esEsteDowngrade = esDowngrade(plan);

            return (
              <div
                key={plan.id_plan}
                className={`rounded-2xl border flex flex-col bg-white overflow-hidden transition-shadow duration-300
                  ${esPlanActual
                    ? 'border-blue-500 shadow-xl ring-2 ring-blue-500/40'
                    : 'border-gray-200 shadow-sm hover:shadow-md'}`}
              >
                {esPopular && (
                  <div className="bg-blue-500 text-white text-[11.5px] font-bold uppercase tracking-wider text-center py-1">
                    Más popular
                  </div>
                )}
                {esPlanActual && !esPopular && (
                  <div className="bg-green-500 text-white text-[11.5px] font-bold uppercase tracking-wider text-center py-1">
                    Plan actual
                  </div>
                )}

                <div className="p-7 flex-1">
                  <h2 className="text-[22px] font-bold text-gray-900">{plan.nombre}</h2>
                  {plan.descripcion && (
                    <p className="mt-2 text-gray-500 text-[13px] min-h-[36px]">{plan.descripcion}</p>
                  )}
                  <div className="mt-5 flex items-baseline">
                    <span className="text-[42px] font-extrabold text-gray-900 leading-none">
                      ${Number(plan.precio_mensual).toLocaleString('es')}
                    </span>
                    <span className="ml-1.5 text-[14px] font-medium text-gray-400">/mes {plan.moneda}</span>
                  </div>

                  <button
                    onClick={() => {
                      if (!esPlanActual) {
                        setUpgradePlan(plan);
                        setUpgradeOk(false);
                        setUpgradeError('');
                        setConfirmarDowngrade(false);
                      }
                    }}
                    disabled={esPlanActual}
                    className={`mt-6 w-full py-2.5 px-6 border border-transparent rounded-xl text-center text-[14px] font-semibold transition-colors
                      ${esPlanActual
                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                        : esPopular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : esEsteDowngrade
                            ? 'bg-orange-500 text-white hover:bg-orange-600'
                            : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                  >
                    {esPlanActual ? 'Plan Actual' : esEsteDowngrade ? 'Bajar a este plan' : 'Mejorar Plan'}
                  </button>
                </div>

                {/* Características */}
                <div className="px-7 pb-7 pt-5 bg-gray-50/60 border-t border-gray-100">
                  <h3 className="text-[11.5px] font-bold text-gray-500 uppercase tracking-wider mb-4">
                    Incluye
                  </h3>
                  <ul className="space-y-3">
                    {FEATURES.map(({ key, label }) => {
                      const val = plan[key];
                      const isBool = typeof val === 'boolean';
                      const active = isBool ? val : true;

                      return (
                        <li key={key} className="flex items-center gap-2.5">
                          {active
                            ? <Check className="flex-shrink-0 w-4 h-4 text-green-500" />
                            : <X className="flex-shrink-0 w-4 h-4 text-gray-300" />
                          }
                          <span className={`text-[13px] ${active ? 'text-gray-700' : 'text-gray-400'}`}>
                            {isBool ? label : (
                              <><span className="font-semibold">{formatFeatureValue(key, val)}</span> {label}</>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal de confirmación de cambio de plan ── */}
      {upgradePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">

            {/* Header del modal */}
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-[17px] font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                {esDowngrade(upgradePlan) ? 'Bajar de plan' : 'Mejorar plan'}
              </h3>
              <p className="text-[13px] text-gray-500 mt-1">
                {planActual
                  ? <>Cambiando de <strong>{planActual.nombre}</strong> a <strong>{upgradePlan.nombre}</strong></>
                  : <>Activando plan <strong>{upgradePlan.nombre}</strong></>
                }
              </p>
            </div>

            {/* Cuerpo */}
            <div className="px-6 py-5 space-y-4">
              {upgradeOk ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                  <p className="text-[15px] font-semibold text-gray-900">¡Plan actualizado!</p>
                  <p className="text-[13px] text-gray-500 text-center">
                    Ahora estás en el plan <strong>{upgradePlan.nombre}</strong>.
                  </p>
                </div>
              ) : (
                <>
                  {esDowngrade(upgradePlan) && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                      <p className="text-[13px] text-orange-800 font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        Bajada de plan
                      </p>
                      <p className="text-[12.5px] text-orange-700 mt-1">
                        Bajás de <strong>{planActual?.nombre}</strong> a <strong>{upgradePlan.nombre}</strong>.
                        Si tu uso actual supera los límites del plan nuevo, el cambio será rechazado.
                      </p>
                      <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={confirmarDowngrade}
                          onChange={e => setConfirmarDowngrade(e.target.checked)}
                          className="w-4 h-4 rounded accent-orange-600"
                        />
                        <span className="text-[12.5px] text-orange-800 font-medium">
                          Entiendo los riesgos y confirmo la bajada de plan
                        </span>
                      </label>
                    </div>
                  )}

                  {upgradeError && (
                    <div className="flex items-start gap-2 text-[12.5px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                      {upgradeError}
                    </div>
                  )}

                  <p className="text-[13px] text-gray-600">
                    ¿Confirmás el cambio al plan <strong>{upgradePlan.nombre}</strong> por{' '}
                    <strong>${Number(upgradePlan.precio_mensual).toLocaleString('es')} {upgradePlan.moneda}/mes</strong>?
                  </p>
                </>
              )}
            </div>

            {/* Footer del modal */}
            {!upgradeOk && (
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  onClick={() => { setUpgradePlan(null); setUpgradeError(''); }}
                  disabled={upgrading}
                  className="px-4 py-2 text-[13.5px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleCambiarPlan}
                  disabled={upgrading || (esDowngrade(upgradePlan) && !confirmarDowngrade)}
                  className={`flex items-center gap-2 px-5 py-2 text-white text-[13.5px] font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60
                    ${esDowngrade(upgradePlan) ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {upgrading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {esDowngrade(upgradePlan) ? 'Confirmar bajada' : 'Confirmar mejora'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
