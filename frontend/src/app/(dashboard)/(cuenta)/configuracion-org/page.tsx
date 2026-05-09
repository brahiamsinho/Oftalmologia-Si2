'use client';

import { useState, useEffect } from 'react';
import {
  Settings, Palette, Globe, ToggleLeft, ToggleRight,
  Save, Loader2, CheckCircle2, AlertCircle, Upload, X,
} from 'lucide-react';
import api from '@/lib/api';
import { useTenant } from '@/context/TenantContext';
import type { TenantOrgSettings } from '@/lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <h2 className="text-[14.5px] font-bold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[12.5px] font-semibold text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-[11.5px] text-gray-400">{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 w-full py-2 hover:bg-gray-50 rounded-lg px-1 transition-colors"
    >
      {checked
        ? <ToggleRight className="w-9 h-9 text-blue-600 flex-shrink-0" />
        : <ToggleLeft  className="w-9 h-9 text-gray-300 flex-shrink-0" />
      }
      <span className={`text-[13px] font-medium ${checked ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
    </button>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
const TIMEZONES = [
  'America/La_Paz', 'America/Lima', 'America/Bogota', 'America/Santiago',
  'America/Buenos_Aires', 'America/Caracas', 'America/Mexico_City',
  'America/New_York', 'America/Los_Angeles', 'Europe/Madrid', 'UTC',
];

const IDIOMAS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];

export default function ConfiguracionOrgPage() {
  const { refresh } = useTenant();

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const [form, setForm] = useState<{
    branding_nombre:          string;
    branding_color_primario:  string;
    branding_color_secundario: string;
    branding_logo_url:        string;
    timezone:                 string;
    idioma:                   string;
    flags: {
      permite_reserva_online: boolean;
      mostrar_modulo_crm:     boolean;
      mostrar_notificaciones: boolean;
    };
  }>({
    branding_nombre:           '',
    branding_color_primario:   '#2563eb',
    branding_color_secundario: '#0f172a',
    branding_logo_url:         '',
    timezone:                  'America/La_Paz',
    idioma:                    'es',
    flags: {
      permite_reserva_online: false,
      mostrar_modulo_crm:     false,
      mostrar_notificaciones: false,
    },
  });

  // Carga settings actuales
  useEffect(() => {
    api.get<TenantOrgSettings>('organization/settings/')
      .then(res => {
        const s = res.data;
        setForm({
          branding_nombre:           s.branding_nombre           ?? '',
          branding_color_primario:   s.branding_color_primario   ?? '#2563eb',
          branding_color_secundario: s.branding_color_secundario ?? '#0f172a',
          branding_logo_url:         s.branding_logo_url         ?? '',
          timezone:                  s.timezone                   ?? 'America/La_Paz',
          idioma:                    s.idioma                     ?? 'es',
          flags: {
            permite_reserva_online: s.flags?.permite_reserva_online ?? false,
            mostrar_modulo_crm:     s.flags?.mostrar_modulo_crm     ?? false,
            mostrar_notificaciones: s.flags?.mostrar_notificaciones  ?? false,
          },
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('organization/settings/', {
        branding_nombre:           form.branding_nombre,
        branding_color_primario:   form.branding_color_primario,
        branding_color_secundario: form.branding_color_secundario,
        branding_logo_url:         form.branding_logo_url || null,
        timezone:                  form.timezone,
        idioma:                    form.idioma,
        flags:                     form.flags,
      });
      showToast('Configuración guardada correctamente.', 'ok');
      // Refresca el TenantContext para que el Sidebar y todo el dashboard
      // reflejen inmediatamente los nuevos colores, nombre y flags.
      refresh();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      showToast(detail ?? 'No se pudo guardar la configuración.', 'err');
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const setFlag = (key: keyof typeof form.flags, value: boolean) =>
    setForm(f => ({ ...f, flags: { ...f.flags, [key]: value } }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-[14px]">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900">Configuración de la organización</h1>
        <p className="text-[12.5px] text-gray-400 mt-0.5">
          Personaliza la apariencia, idioma y módulos visibles de tu clínica.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Branding ── */}
        <Section title="Identidad visual" icon={Palette}>
          <div className="space-y-4">
            <Field label="Nombre de la clínica" hint="Se muestra en el Sidebar y en la pantalla de login.">
              <input
                type="text"
                value={form.branding_nombre}
                onChange={e => set('branding_nombre', e.target.value)}
                placeholder="Ej: Clínica Visión Norte"
                className="w-full h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-50 text-[13px]
                           focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </Field>

            <Field
              label="URL del logo"
              hint="URL pública de la imagen del logo (PNG/SVG recomendado). Déjalo vacío para usar el ícono por defecto."
            >
              <div className="flex gap-2">
                <input
                  type="url"
                  value={form.branding_logo_url}
                  onChange={e => set('branding_logo_url', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="flex-1 h-10 px-3.5 rounded-xl border border-gray-200 bg-gray-50 text-[13px]
                             focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                {form.branding_logo_url && (
                  <button type="button" onClick={() => set('branding_logo_url', '')}
                    className="px-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              {form.branding_logo_url && (
                <div className="mt-2 flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.branding_logo_url}
                    alt="Preview logo"
                    className="w-10 h-10 rounded-lg border border-gray-200 object-contain bg-gray-50"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span className="text-[11.5px] text-gray-400">Preview</span>
                </div>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Color primario" hint="Botones y acentos.">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.branding_color_primario}
                    onChange={e => set('branding_color_primario', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={form.branding_color_primario}
                    onChange={e => set('branding_color_primario', e.target.value)}
                    className="flex-1 h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-[13px] font-mono
                               focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    maxLength={7}
                  />
                </div>
              </Field>

              <Field label="Color secundario" hint="Fondos y texto oscuro.">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.branding_color_secundario}
                    onChange={e => set('branding_color_secundario', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={form.branding_color_secundario}
                    onChange={e => set('branding_color_secundario', e.target.value)}
                    className="flex-1 h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-[13px] font-mono
                               focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    maxLength={7}
                  />
                </div>
              </Field>
            </div>

            {/* Preview en tiempo real */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ backgroundColor: form.branding_color_primario }}
              >
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-[13px] font-semibold">
                  {form.branding_nombre || 'Nombre de la clínica'}
                </span>
              </div>
              <div
                className="px-4 py-2"
                style={{ backgroundColor: form.branding_color_secundario }}
              >
                <span className="text-white/60 text-[11px]">Vista previa del header</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Localización ── */}
        <Section title="Localización" icon={Globe}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Zona horaria">
              <select
                value={form.timezone}
                onChange={e => set('timezone', e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-[13px]
                           focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </Field>

            <Field label="Idioma de la interfaz">
              <select
                value={form.idioma}
                onChange={e => set('idioma', e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-gray-50 text-[13px]
                           focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
              >
                {IDIOMAS.map(i => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        {/* ── Módulos visibles ── */}
        <Section title="Módulos del sistema" icon={Settings}>
          <p className="text-[12.5px] text-gray-500 mb-4">
            Activa los módulos que tu clínica usa. Los módulos requieren que el plan de suscripción los incluya.
          </p>
          <div className="divide-y divide-gray-100">
            <Toggle
              checked={form.flags.permite_reserva_online}
              onChange={v => setFlag('permite_reserva_online', v)}
              label="Reserva de citas online (portal de pacientes)"
            />
            <Toggle
              checked={form.flags.mostrar_modulo_crm}
              onChange={v => setFlag('mostrar_modulo_crm', v)}
              label="Módulo CRM (campañas y contactos)"
            />
            <Toggle
              checked={form.flags.mostrar_notificaciones}
              onChange={v => setFlag('mostrar_notificaciones', v)}
              label="Notificaciones automáticas"
            />
          </div>
        </Section>

        {/* ── Guardar ── */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                       text-white text-[13.5px] font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />
            }
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl
                         shadow-lg border text-[13px] font-medium
                         ${toast.type === 'ok'
                           ? 'bg-green-50 border-green-200 text-green-800'
                           : 'bg-red-50  border-red-200  text-red-800'}`}>
          {toast.type === 'ok'
            ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            : <AlertCircle  className="w-4 h-4 text-red-500  flex-shrink-0" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
