'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import {
  Eye, EyeOff, Lock, Mail, ArrowLeft, Building2, Loader2,
  AlertCircle, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TenantStorage, resolveApiOrigin } from '@/lib/api';
import type { TenantPublicData } from '@/lib/types';
import SnellenEvaluation from '@/components/SnellenEvaluation';
import MinimalIris from '@/components/MinimalIris';

// ── Lookup público: no pasa por el interceptor de tenant ──────────────────────
// Se usa axios directamente (sin la instancia `api`) para que el interceptor
// de tenant no intente reescribir esta URL pública.
async function lookupTenant(slug: string): Promise<TenantPublicData> {
  const { data } = await axios.get<TenantPublicData>(
    `${resolveApiOrigin()}/api/tenants/${slug.trim().toLowerCase()}/`,
    { timeout: 15_000 },
  );
  return data;
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuth();
  const searchParams = useSearchParams();

  // Estado compartido
  const [step,    setStep]    = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sysMsg,  setSysMsg]  = useState('');

  // Detecta si fue redirigido por tenant inactivo (motivo=tenant_inactivo)
  useEffect(() => {
    const motivo = searchParams.get('motivo');
    if (motivo === 'tenant_inactivo') {
      setSysMsg('Tu organización fue suspendida o está inactiva. Contactá al administrador del sistema.');
    }
  }, [searchParams]);

  // Paso 1
  const [slugInput,   setSlugInput]   = useState('');
  const [tenantData,  setTenantData]  = useState<TenantPublicData | null>(null);

  // Paso 2
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // ── Colores dinámicos del tenant ──────────────────────────────────────────
  const colorPrimario   = tenantData?.branding.color_primario   ?? '#2563eb';
  const colorSecundario = tenantData?.branding.color_secundario ?? '#0f172a';

  // ── Paso 1: validar workspace ─────────────────────────────────────────────
  const handleCheckWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slugInput.trim()) {
      setError('Escribí el nombre de tu workspace.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await lookupTenant(slugInput);
      TenantStorage.setSlug(data.slug);
      TenantStorage.setTenantData(data);
      setTenantData(data);
      setStep(2);
    } catch {
      setError('No encontramos esa clínica. Verificá el nombre del workspace.');
    } finally {
      setLoading(false);
    }
  };

  // ── Volver al paso 1 ──────────────────────────────────────────────────────
  const handleBack = () => {
    TenantStorage.clear();
    setTenantData(null);
    setStep(1);
    setError('');
    setEmail('');
    setPassword('');
  };

  // ── Paso 2: iniciar sesión ────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  // ── Renderizado ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center relative overflow-hidden px-4 py-10">

      {/* Círculos decorativos */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/20 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[380px] h-[380px] rounded-full bg-blue-900/40 translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Layout principal */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

        {/* ══ IZQUIERDA ══ */}
        <div className="flex flex-col items-center lg:items-start gap-8">
          <div className="w-full max-w-[380px] flex flex-col items-center gap-6">
            <MinimalIris />
            <SnellenEvaluation />
          </div>
          <div>
            <h2 className="text-[26px] font-bold text-white mb-1">Clínica Oftalmológica</h2>
            <p className="text-blue-200 text-[13.5px]">Sistema de Gestión Médica — Multi-Clínica</p>
          </div>
        </div>

        {/* ══ DERECHA: tarjeta dinámica ══ */}
        <div className="w-full">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

            {/* ── Paso 1: Elegir workspace ── */}
            {step === 1 && (
              <div className="px-8 py-8">
                <div className="flex justify-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md">
                    <Building2 className="w-7 h-7 text-white" strokeWidth={1.8} />
                  </div>
                </div>
                <h1 className="text-[22px] font-bold text-gray-900 text-center mb-1">
                  Acceder a tu clínica
                </h1>
                <p className="text-[13px] text-gray-400 text-center mb-7">
                  Ingresá el nombre del workspace de tu organización
                </p>

                {sysMsg && (
                  <div className="flex items-start gap-2 text-[12.5px] text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5 mb-5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-orange-500" />
                    {sysMsg}
                  </div>
                )}

                <form onSubmit={handleCheckWorkspace} className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                      Nombre del workspace
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={slugInput}
                        onChange={e => { setSlugInput(e.target.value); setError(''); }}
                        placeholder="ej: clinica-vision"
                        autoComplete="off"
                        autoFocus
                        className="w-full h-11 pl-9 pr-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13.5px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                    <p className="mt-1.5 text-[11.5px] text-gray-400">
                      El workspace es el identificador único de tu clínica en el sistema.
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !slugInput.trim()}
                    className="w-full h-11 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-semibold rounded-xl transition-colors shadow-sm"
                  >
                    {loading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><span>Continuar</span><ChevronRight className="w-4 h-4" /></>
                    }
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/"
                    className="inline-flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-600 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Volver al inicio
                  </Link>
                </div>
              </div>
            )}

            {/* ── Paso 2: Ingresar credenciales ── */}
            {step === 2 && tenantData && (
              <>
                {/* Header con branding del tenant */}
                <div
                  className="px-8 py-5 flex items-center gap-4 border-b border-gray-100"
                  style={{ background: `${colorPrimario}12` }}
                >
                  {tenantData.branding.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tenantData.branding.logo_url}
                      alt={tenantData.branding.nombre}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ background: colorPrimario }}
                    >
                      <Building2 className="w-5 h-5 text-white" strokeWidth={1.8} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-gray-900 truncate">
                      {tenantData.branding.nombre}
                    </p>
                    <p className="text-[11.5px] text-gray-400 mt-0.5">
                      Workspace: <span className="font-mono font-semibold">{tenantData.slug}</span>
                    </p>
                  </div>
                  <button
                    onClick={handleBack}
                    title="Cambiar de clínica"
                    className="text-[12px] text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors flex-shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Cambiar
                  </button>
                </div>

                {/* Formulario de credenciales */}
                <div className="px-8 py-7">
                  <h1 className="text-[20px] font-bold text-gray-900 mb-1">
                    Iniciar Sesión
                  </h1>
                  <p className="text-[13px] text-gray-400 mb-6">
                    Ingresá tus credenciales para acceder al sistema
                  </p>

                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Correo */}
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                        Correo electrónico
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="correo@clinica.com"
                          autoComplete="username"
                          autoFocus
                          className="w-full h-11 pl-9 pr-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13.5px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                          style={{ '--tw-ring-color': colorPrimario } as React.CSSProperties}
                          onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${colorPrimario}40`}
                          onBlur={e => e.target.style.boxShadow = ''}
                        />
                      </div>
                    </div>

                    {/* Contraseña */}
                    <div>
                      <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                        Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="w-full h-11 pl-9 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-[13.5px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                          onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${colorPrimario}40`}
                          onBlur={e => e.target.style.boxShadow = ''}
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="flex items-start gap-2 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        {error}
                      </div>
                    )}

                    {/* Demo */}
                    <div className="rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-3">
                      <p className="text-[11.5px] text-gray-400 font-medium mb-1.5">Credenciales de demo</p>
                      <button type="button"
                        onClick={() => { setEmail('admin@oftalmologia.local'); setPassword('admin123'); }}
                        className="w-full text-left text-[12px] text-blue-700 hover:text-blue-900 transition-colors">
                        <span className="font-semibold">Administrador:</span> admin@oftalmologia.local / admin123
                      </button>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading || !email.trim() || !password}
                      className="w-full h-11 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-semibold rounded-xl transition-colors shadow-sm"
                      style={{ backgroundColor: loading || !email.trim() || !password ? '#9ca3af' : colorPrimario }}
                    >
                      {loading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : 'Iniciar Sesión'
                      }
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
