'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2, Plus, Power, PowerOff, RefreshCw, Settings2,
} from 'lucide-react';
import { AxiosError } from 'axios';
import { PlatformTokenStorage, fetchPlatformAll, platformApi } from '@/lib/platformApi';

type PlanCodigo = 'FREE' | 'PLUS' | 'PRO';

interface TenantRow {
  id?: number;
  id_tenant?: number;
  slug: string;
  nombre: string;
  activo: boolean;
  schema_name?: string;
  is_public?: boolean;
  subscription?: {
    plan?: {
      codigo: string;
      nombre: string;
      precio_mensual?: number | string;
    };
    estado?: string;
  } | null;
}

interface PlanOption {
  id_plan?: number;
  codigo: PlanCodigo;
  nombre: string;
  precio_mensual: number;
}

function apiErrorMessage(err: unknown): string {
  if (err instanceof AxiosError && err.response?.data) {
    const d = err.response.data as Record<string, unknown>;
    if (typeof d.detail === 'string') return d.detail;
    const first = Object.values(d)[0];
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'detail' in first) {
      const inner = (first as { detail?: string }).detail;
      if (typeof inner === 'string') return inner;
    }
  }
  return 'Ocurrió un error. Intentá de nuevo.';
}

export default function PlatformDashboardPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    slug: '',
    nombre: '',
    email_contacto: '',
    plan: 'FREE' as PlanCodigo,
    trial_days: 14,
  });
  const [createError, setCreateError] = useState('');

  const [planModal, setPlanModal] = useState<{ tenant: TenantRow } | null>(null);
  const [planCodigo, setPlanCodigo] = useState<PlanCodigo>('FREE');
  const [confirmDowngrade, setConfirmDowngrade] = useState(false);
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planError, setPlanError] = useState('');

  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!PlatformTokenStorage.getAccess()) {
      router.replace('/platform/login');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const [list, planList] = await Promise.all([
        fetchPlatformAll<TenantRow>('tenants/'),
        fetchPlatformAll<PlanOption>('plans/'),
      ]);
      const visible = list.filter((row) => row.slug !== 'public');
      setTenants(visible);
      setPlans(planList.sort((a, b) => a.precio_mensual - b.precio_mensual));
    } catch {
      setError('No se pudo cargar el listado. Revisá tu sesión o los permisos.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const tenantPk = (row: TenantRow) => row.id ?? row.id_tenant;

  const handleActivar = async (row: TenantRow) => {
    const id = tenantPk(row);
    if (id == null) return;
    setBusyId(id);
    try {
      await platformApi.post(`tenants/${id}/activar/`);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const handleSuspender = async (row: TenantRow) => {
    const id = tenantPk(row);
    if (id == null) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(`¿Suspender la organización "${row.nombre}" (${row.slug})?`)) return;
    setBusyId(id);
    try {
      await platformApi.post(`tenants/${id}/suspender/`);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const openPlanModal = (row: TenantRow) => {
    const current = (row.subscription?.plan?.codigo as PlanCodigo) || 'FREE';
    setPlanCodigo(current);
    setConfirmDowngrade(false);
    setPlanError('');
    setPlanModal({ tenant: row });
  };

  const submitPlanChange = async () => {
    if (!planModal) return;
    const id = tenantPk(planModal.tenant);
    if (id == null) return;
    setPlanSubmitting(true);
    setPlanError('');
    try {
      await platformApi.post(`tenants/${id}/cambiar-plan/`, {
        plan: planCodigo,
        confirmar_downgrade: confirmDowngrade,
      });
      setPlanModal(null);
      await load();
    } catch (e) {
      const msg = apiErrorMessage(e);
      if (
        msg.includes('confirmar_downgrade')
        || (e instanceof AxiosError && JSON.stringify(e.response?.data).includes('confirmar_downgrade'))
      ) {
        setPlanError('Para bajar de plan marcá “Confirmo la bajada de plan”.');
      } else {
        setPlanError(msg);
      }
    } finally {
      setPlanSubmitting(false);
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSubmitting(true);
    try {
      await platformApi.post('tenants/', {
        slug: createForm.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        nombre: createForm.nombre.trim(),
        email_contacto: createForm.email_contacto.trim() || undefined,
        plan: createForm.plan,
        trial_days: createForm.trial_days,
      });
      setCreateOpen(false);
      setCreateForm({
        slug: '',
        nombre: '',
        email_contacto: '',
        plan: 'FREE',
        trial_days: 14,
      });
      await load();
    } catch (err) {
      setCreateError(apiErrorMessage(err));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const planPrice = (codigo: PlanCodigo, fallbackFromTenant?: number | string | undefined) => {
    const fromList = plans.find((p) => p.codigo === codigo)?.precio_mensual;
    if (fromList != null) return Number(fromList);
    if (fallbackFromTenant != null) return Number(fallbackFromTenant);
    return 0;
  };

  const needsDowngradeConfirm = planModal
    ? planPrice(
        planCodigo,
      ) < planPrice(
        (planModal.tenant.subscription?.plan?.codigo as PlanCodigo) || 'FREE',
        planModal.tenant.subscription?.plan?.precio_mensual,
      )
    : false;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Organizaciones</h1>
          <p className="text-sm text-gray-600">
            Gestión central (solo metadatos). Los datos clínicos siguen en el schema de cada organización.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setCreateError('');
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Nueva clínica
          </button>
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => setError('')}
          >
            Cerrar
          </button>
        </p>
      ) : null}

      {!loading ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.map((row) => {
                const pk = tenantPk(row);
                const busy = pk != null && busyId === pk;
                return (
                  <tr key={String(pk ?? row.slug)} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.nombre}</td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{row.slug}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.subscription?.plan?.codigo ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          row.activo
                            ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 ring-1 ring-emerald-600/20'
                            : 'rounded-full bg-red-50 px-2 py-0.5 text-red-800 ring-1 ring-red-600/20'
                        }
                      >
                        {row.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          disabled={busy || row.activo}
                          onClick={() => handleActivar(row)}
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-40"
                          title="Activar organización"
                        >
                          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
                          Activar
                        </button>
                        <button
                          type="button"
                          disabled={busy || !row.activo}
                          onClick={() => handleSuspender(row)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-medium text-red-800 hover:bg-red-100 disabled:opacity-40"
                          title="Suspender organización"
                        >
                          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <PowerOff className="h-3 w-3" />}
                          Suspender
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => openPlanModal(row)}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-40"
                          title="Cambiar plan"
                        >
                          <Settings2 className="h-3 w-3" />
                          Plan
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {tenants.length === 0 ? (
            <p className="px-4 py-8 text-center text-gray-500">No hay organizaciones cargadas.</p>
          ) : null}
        </div>
      ) : null}

      {/* Modal crear */}
      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Nueva clínica</h2>
            <p className="mt-1 text-sm text-gray-600">
              Se crea el tenant, dominio y suscripción. El schema se genera en el servidor.
            </p>
            <form onSubmit={submitCreate} className="mt-4 space-y-3">
              {createError ? (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {createError}
                </p>
              ) : null}
              <div>
                <label className="block text-xs font-medium text-gray-600">Slug (workspace)</label>
                <input
                  required
                  value={createForm.slug}
                  onChange={(ev) => setCreateForm((f) => ({ ...f, slug: ev.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  placeholder="mi-clinica"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Nombre visible</label>
                <input
                  required
                  value={createForm.nombre}
                  onChange={(ev) => setCreateForm((f) => ({ ...f, nombre: ev.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  placeholder="Clínica Norte"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Contacto (opcional)</label>
                <input
                  type="email"
                  value={createForm.email_contacto}
                  onChange={(ev) => setCreateForm((f) => ({ ...f, email_contacto: ev.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  placeholder="contacto@clinica.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Plan inicial</label>
                  <select
                    value={createForm.plan}
                    onChange={(ev) =>
                      setCreateForm((f) => ({ ...f, plan: ev.target.value as PlanCodigo }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  >
                    {plans.length > 0
                      ? plans.map((p) => (
                          <option key={p.codigo} value={p.codigo}>
                            {p.nombre} ({p.codigo})
                          </option>
                        ))
                      : (
                          <>
                            <option value="FREE">Free</option>
                            <option value="PLUS">Plus</option>
                            <option value="PRO">Pro</option>
                          </>
                        )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Días de trial</label>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={createForm.trial_days}
                    onChange={(ev) =>
                      setCreateForm((f) => ({ ...f, trial_days: Number(ev.target.value) }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {createSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal cambiar plan */}
      {planModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Cambiar plan</h2>
            <p className="mt-1 text-sm text-gray-600">
              {planModal.tenant.nombre}{' '}
              <span className="font-mono text-gray-500">({planModal.tenant.slug})</span>
            </p>
            {planError ? (
              <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {planError}
              </p>
            ) : null}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">Nuevo plan</label>
                <select
                  value={planCodigo}
                  onChange={(ev) => {
                    setPlanCodigo(ev.target.value as PlanCodigo);
                    setConfirmDowngrade(false);
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                >
                  {plans.length > 0
                    ? plans.map((p) => (
                        <option key={p.codigo} value={p.codigo}>
                          {p.nombre} — {p.codigo} ({p.precio_mensual})
                        </option>
                      ))
                    : (
                        <>
                          <option value="FREE">FREE</option>
                          <option value="PLUS">PLUS</option>
                          <option value="PRO">PRO</option>
                        </>
                      )}
                </select>
              </div>
              {needsDowngradeConfirm ? (
                <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={confirmDowngrade}
                    onChange={(ev) => setConfirmDowngrade(ev.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    Confirmo la bajada de plan (puede verse bloqueada si el uso supera los límites del plan nuevo).
                  </span>
                </label>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPlanModal(null)}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  planSubmitting || (needsDowngradeConfirm && !confirmDowngrade)
                }
                onClick={() => void submitPlanChange()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {planSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Guardar plan
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
