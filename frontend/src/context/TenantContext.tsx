'use client';

/**
 * TenantContext
 *
 * Centraliza el estado del tenant activo en el dashboard.
 * Carga GET /t/<slug>/api/organization/me/ UNA sola vez al montar el layout
 * y lo comparte con todos los componentes hijos (Sidebar, páginas, header...).
 *
 * Beneficios:
 *  - El Sidebar puede mostrar el nombre/logo real de la clínica.
 *  - El Sidebar puede mostrar/ocultar módulos según el plan y los flags.
 *  - Las páginas (usuarios, pacientes, citas) obtienen el plan sin hacer
 *    su propia llamada a organization/me/ → cero duplicados de red.
 *  - El header puede mostrar el estado de suscripción (TRIAL, SUSPENDIDA…).
 */

import {
  createContext, useContext, useEffect, useState, useCallback,
  type ReactNode,
} from 'react';
import api, { TenantStorage } from '@/lib/api';
import type { TenantOrgData, TenantSubscriptionPlan, TenantFlags } from '@/lib/types';

// ── Shape del contexto ────────────────────────────────────────────────────────
interface TenantUsage {
  usuarios_actuales:     number;
  pacientes_actuales:    number;
  citas_mes_actual:      number;
  almacenamiento_usado_mb: number;
}

interface TrialInfo {
  /** true si la suscripción está en período de prueba */
  isTrial:    boolean;
  /** días restantes del trial (null si no hay fecha de vencimiento) */
  diasRestantes: number | null;
}

interface TenantContextValue {
  /** Datos completos del tenant (branding, plan, config, usage…). null mientras carga. */
  orgData:    TenantOrgData | null;
  /** Plan activo del tenant. Atajo de orgData.subscription.plan. */
  planInfo:   TenantSubscriptionPlan | null;
  /** Flags de módulos activos (mostrar_modulo_crm, mostrar_notificaciones…). */
  flags:      TenantFlags;
  /** Contadores reales de uso del tenant (del backend, sin llamadas extra). */
  usage:      TenantUsage | null;
  /** Info del período de prueba. */
  trial:      TrialInfo;
  /** true mientras se está cargando la primera vez. */
  loading:    boolean;
  /** Recarga organization/me/ manualmente (útil tras cambiar el plan). */
  refresh:    () => void;
}

const DEFAULT_FLAGS: TenantFlags = {
  permite_reserva_online: false,
  mostrar_modulo_crm: false,
  mostrar_notificaciones: false,
};

const DEFAULT_TRIAL: TrialInfo = { isTrial: false, diasRestantes: null };

const TenantCtx = createContext<TenantContextValue>({
  orgData:  null,
  planInfo: null,
  flags:    DEFAULT_FLAGS,
  usage:    null,
  trial:    DEFAULT_TRIAL,
  loading:  true,
  refresh:  () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────
export function TenantProvider({ children }: { children: ReactNode }) {
  const [orgData,  setOrgData]  = useState<TenantOrgData | null>(null);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    // Solo intentar si hay slug guardado (usuario ha hecho login con tenant)
    if (!TenantStorage.getSlug()) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<TenantOrgData>('organization/me/');
      setOrgData(data);
      // Actualizar TenantStorage con los datos frescos del backend
      if (data.branding || data.subscription) {
        TenantStorage.setTenantData({
          id: data.id,
          slug: data.slug,
          nombre: data.nombre,
          branding: data.branding,
          subscription: data.subscription ?? null,
        });
      }
    } catch {
      // Si falla (ej. 403 ya fue manejado por el interceptor), dejamos orgData en null.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derivados ──
  const planInfo = orgData?.subscription?.plan ?? null;

  // Los flags vienen de dos lugares posibles:
  // 1. orgData.config  (campo "config" de organization/me/)
  // 2. orgData.settings.flags (campo "settings" → "flags")
  const rawFlags =
    (orgData?.settings as { flags?: Partial<TenantFlags> } | undefined)?.flags ??
    (orgData?.config as Partial<TenantFlags> | undefined) ??
    {};

  const flags: TenantFlags = {
    permite_reserva_online: rawFlags.permite_reserva_online ?? false,
    mostrar_modulo_crm:
      (planInfo?.permite_crm ?? false) &&
      (rawFlags.mostrar_modulo_crm ?? true),
    mostrar_notificaciones:
      (planInfo?.permite_notificaciones ?? false) &&
      (rawFlags.mostrar_notificaciones ?? true),
  };

  // ── Usage (contadores reales del backend) ──
  const usage: TenantUsage | null = orgData?.usage ?? null;

  // ── Trial ──
  const subEstado      = orgData?.subscription?.estado ?? null;
  const isTrial        = subEstado === 'TRIAL';
  const fechaVenc      = orgData?.subscription?.fecha_vencimiento ?? null;
  const diasRestantes: number | null = (() => {
    if (!isTrial || !fechaVenc) return null;
    const diff = new Date(fechaVenc).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();
  const trial: TrialInfo = { isTrial, diasRestantes };

  return (
    <TenantCtx.Provider value={{ orgData, planInfo, flags, usage, trial, loading, refresh: load }}>
      {children}
    </TenantCtx.Provider>
  );
}

// ── Hook público ──────────────────────────────────────────────────────────────
export function useTenant(): TenantContextValue {
  return useContext(TenantCtx);
}
