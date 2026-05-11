"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowLeft,
  Building2,
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TenantStorage, resolveApiOrigin } from "@/lib/api";
import type { TenantPublicData } from "@/lib/types";
import SnellenEvaluation from "@/components/SnellenEvaluation";
import MinimalIris from "@/components/MinimalIris";

// ── Lookup público: no pasa por el interceptor de tenant ──────────────────────
// Se usa axios directamente (sin la instancia `api`) para que el interceptor
// de tenant no intente reescribir esta URL pública.
async function lookupTenant(slug: string): Promise<TenantPublicData> {
  const { data } = await axios.get<TenantPublicData>(
    `${resolveApiOrigin()}/api/public/tenants/${slug.trim().toLowerCase()}/`,
    { timeout: 15_000 },
  );
  return data;
}

// ── Componente principal (useSearchParams → envolver en Suspense para prerender) ─
function LoginPageInner() {
  const { login, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  /** Sesión ya válida (validada en AuthProvider): ir al panel sin depender del middleware. */
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  // Estado compartido
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sysMsg, setSysMsg] = useState("");

  // Detecta si fue redirigido por tenant inactivo (motivo=tenant_inactivo)
  useEffect(() => {
    const motivo = searchParams.get("motivo");
    if (motivo === "tenant_inactivo") {
      setSysMsg(
        "Tu organización fue suspendida o está inactiva. Contactá al administrador del sistema.",
      );
    }
  }, [searchParams]);

  // Paso 1
  const [slugInput, setSlugInput] = useState("");
  const [tenantData, setTenantData] = useState<TenantPublicData | null>(null);

  // Paso 2
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // ── Colores dinámicos del tenant ──────────────────────────────────────────
  const colorPrimario = tenantData?.branding.color_primario ?? "#2563eb";

  // ── Paso 1: validar workspace ─────────────────────────────────────────────
  const handleCheckWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slugInput.trim()) {
      setError("Escribí el nombre de tu workspace.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await lookupTenant(slugInput);
      TenantStorage.setSlug(data.slug);
      TenantStorage.setTenantData(data);
      setTenantData(data);
      setStep(2);
    } catch {
      setError("No encontramos esa clínica. Verificá el nombre del workspace.");
    } finally {
      setLoading(false);
    }
  };

  // ── Volver al paso 1 ──────────────────────────────────────────────────────
  const handleBack = () => {
    TenantStorage.clear();
    setTenantData(null);
    setStep(1);
    setError("");
    setEmail("");
    setPassword("");
  };

  // ── Paso 2: iniciar sesión ────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  // ── Renderizado ──────────────────────────────────────────────────────────
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 px-4 py-10">
      {/* Círculos decorativos — reducidos si el usuario pide menos movimiento */}
      <div
        className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] -translate-y-1/3 translate-x-1/3 rounded-full bg-blue-500/20 motion-reduce:opacity-40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-[380px] w-[380px] translate-y-1/3 -translate-x-1/4 rounded-full bg-blue-900/40 motion-reduce:opacity-40"
        aria-hidden
      />

      {/* Contenido principal (un solo landmark main) */}
      <main className="relative z-10 grid w-full max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-2">
        {/* ══ IZQUIERDA ══ */}
        <aside
          className="flex flex-col items-center gap-8 lg:items-start"
          aria-labelledby="login-marketing-title"
        >
          <div className="flex w-full max-w-[380px] flex-col items-center gap-6">
            <MinimalIris />
            <SnellenEvaluation />
          </div>
          <div className="text-center lg:text-left">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-blue-200/90">
              Portal de clínica
            </p>
            <h2
              id="login-marketing-title"
              className="mb-1 text-[26px] font-bold text-white"
            >
              OftalmoCRM
            </h2>
            <p className="text-[13.5px] leading-relaxed text-blue-100/90">
              Sistema de gestión para tu organización. Ingresá con el workspace
              que te asignaron.
            </p>
          </div>
        </aside>

        {/* ══ DERECHA: tarjeta dinámica ══ */}
        <div className="w-full">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-blue-950/20 ring-1 ring-black/5">
            {/* ── Paso 1: Elegir workspace ── */}
            {step === 1 && (
              <div className="px-8 py-8">
                <div className="flex justify-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md">
                    <Building2
                      className="w-7 h-7 text-white"
                      strokeWidth={1.8}
                    />
                  </div>
                </div>
                <h1 className="text-[22px] font-bold text-gray-900 text-center mb-1">
                  Acceder a tu clínica
                </h1>
                <p className="text-[13px] text-gray-400 text-center mb-7">
                  Ingresá el nombre del workspace de tu organización
                </p>

                {sysMsg && (
                  <div
                    role="alert"
                    className="mb-5 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5 text-[12.5px] text-orange-800"
                  >
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-orange-500"
                      aria-hidden
                    />
                    {sysMsg}
                  </div>
                )}

                <form onSubmit={handleCheckWorkspace} className="space-y-4">
                  <div>
                    <label
                      htmlFor="login-workspace-slug"
                      className="mb-1.5 block text-[13px] font-medium text-gray-800"
                    >
                      Nombre del workspace
                    </label>
                    <div className="relative">
                      <Building2
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                        aria-hidden
                      />
                      <input
                        id="login-workspace-slug"
                        type="text"
                        value={slugInput}
                        onChange={(e) => {
                          setSlugInput(e.target.value);
                          setError("");
                        }}
                        placeholder="ej: clinica-vision"
                        autoComplete="organization"
                        autoFocus
                        className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-9 pr-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <p className="mt-1.5 text-[11.5px] text-gray-400">
                      El workspace es el identificador único de tu clínica en el
                      sistema.
                    </p>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] text-red-800"
                    >
                      <AlertCircle
                        className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                        aria-hidden
                      />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !slugInput.trim()}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Continuar</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/"
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Volver al inicio
                  </Link>
                  <p className="mt-2 text-[12px] leading-relaxed text-gray-500">
                    ¿Sos operador del SaaS (no una clínica)?{" "}
                    <Link
                      href="/platform/login"
                      className="font-semibold text-blue-600 underline-offset-2 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/40 rounded"
                    >
                      Acceso plataforma
                    </Link>
                  </p>
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
                      <Building2
                        className="w-5 h-5 text-white"
                        strokeWidth={1.8}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-gray-900 truncate">
                      {tenantData.branding.nombre}
                    </p>
                    <p className="text-[11.5px] text-gray-400 mt-0.5">
                      Workspace:{" "}
                      <span className="font-mono font-semibold">
                        {tenantData.slug}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    aria-label="Cambiar de clínica o workspace"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Cambiar
                  </button>
                </div>

                {/* Formulario de credenciales */}
                <div className="px-8 py-7">
                  <h1 className="mb-1 text-[20px] font-bold text-gray-900">
                    Iniciar sesión
                  </h1>
                  <p className="mb-6 text-[13px] leading-relaxed text-gray-500">
                    Credenciales del personal de{" "}
                    <span className="font-medium text-gray-700">
                      {tenantData.branding.nombre}
                    </span>
                    .
                  </p>

                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Correo */}
                    <div>
                      <label
                        htmlFor="login-clinic-email"
                        className="mb-1.5 block text-[13px] font-medium text-gray-800"
                      >
                        Correo electrónico
                      </label>
                      <div className="relative">
                        <Mail
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                          aria-hidden
                        />
                        <input
                          id="login-clinic-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="correo@clinica.com"
                          autoComplete="username"
                          autoFocus
                          className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-9 pr-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Contraseña */}
                    <div>
                      <label
                        htmlFor="login-clinic-password"
                        className="mb-1.5 block text-[13px] font-medium text-gray-800"
                      >
                        Contraseña
                      </label>
                      <div className="relative">
                        <Lock
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                          aria-hidden
                        />
                        <input
                          id="login-clinic-password"
                          type={showPass ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-9 pr-12 text-[15px] text-gray-900 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-2 top-1/2 flex h-10 min-h-[44px] w-10 min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          aria-label={
                            showPass
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                        >
                          {showPass ? (
                            <EyeOff className="h-4 w-4" aria-hidden />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <div
                        role="alert"
                        className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] text-red-800"
                      >
                        <AlertCircle
                          className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                          aria-hidden
                        />
                        {error}
                      </div>
                    )}

                    {/* Demo */}
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3">
                      <p className="mb-1.5 text-[11.5px] font-medium text-gray-500">
                        Solo desarrollo — credenciales demo
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEmail("admin@oftalmologia.local");
                          setPassword("admin123");
                        }}
                        className="w-full rounded-lg py-2 text-left text-[12px] text-blue-700 transition-colors hover:bg-white hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      >
                        <span className="font-semibold">Administrador:</span>{" "}
                        <span className="font-mono text-[11px]">
                          admin@oftalmologia.local
                        </span>{" "}
                        / admin123
                      </button>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading || !email.trim() || !password}
                      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        backgroundColor:
                          loading || !email.trim() || !password
                            ? "#9ca3af"
                            : colorPrimario,
                      }}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Iniciar Sesión"
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white">
          <Loader2 className="h-9 w-9 animate-spin opacity-90" aria-hidden />
          <span className="sr-only">Cargando inicio de sesión…</span>
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
