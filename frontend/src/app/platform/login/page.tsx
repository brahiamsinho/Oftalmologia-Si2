'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { resolveApiOrigin } from '@/lib/api';
import { PlatformTokenStorage } from '@/lib/platformApi';

interface PlatformLoginResponse {
  access: string;
  administrator: { id: number; email: string; nombre: string };
}

/**
 * Login superadmin — tema oscuro y acento distintivo del login de clínica;
 * mismos patrones de formulario (labels visibles, touch targets, show password).
 */
export default function PlatformLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post<PlatformLoginResponse>(
        `${resolveApiOrigin()}/api/public/platform/auth/login/`,
        { email: email.trim().toLowerCase(), password },
        { timeout: 20_000 },
      );
      PlatformTokenStorage.setAccess(data.access);
      router.replace('/platform/dashboard');
    } catch {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      {/* Fondo: capas suaves (no compiten con el contenido) */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.22),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[min(100%,42rem)] -translate-x-1/2 translate-y-1/2 rounded-full bg-indigo-600/10 blur-3xl"
        aria-hidden
      />

      <main className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5 backdrop-blur-md">
          <header className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-900/40">
              <ShieldCheck className="h-8 w-8" aria-hidden strokeWidth={1.75} />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-300/90">
              Operador del SaaS
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Acceso plataforma
            </h1>
            <p className="mx-auto mt-2 max-w-[28ch] text-[13px] leading-relaxed text-slate-400">
              Gestioná organizaciones y planes.{' '}
              <span className="text-slate-500">No es el acceso de una clínica.</span>
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-red-500/40 bg-red-950/50 px-3 py-2.5 text-sm text-red-100"
              >
                {error}
              </p>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="plat-email" className="block text-sm font-medium text-slate-200">
                Correo
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden
                />
                <input
                  id="plat-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-slate-600/80 bg-slate-950/80 py-3 pl-10 pr-3 text-[15px] text-white placeholder:text-slate-500 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="admin@tu-dominio.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="plat-pass" className="block text-sm font-medium text-slate-200">
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden
                />
                <input
                  id="plat-pass"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-slate-600/80 bg-slate-950/80 py-3 pl-10 pr-12 text-[15px] text-white placeholder:text-slate-500 transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2 top-1/2 flex h-10 min-h-[44px] w-10 min-w-[44px] -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-md shadow-indigo-950/30 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Ingresando…
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <footer className="mt-8 space-y-4 border-t border-white/10 pt-6 text-center">
            <Link
              href="/login"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <Building2 className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
              Ir al login de clínica
            </Link>
            <p>
              <Link
                href="/"
                className="text-xs text-slate-500 underline-offset-2 transition hover:text-slate-400 hover:underline"
              >
                Volver al inicio
              </Link>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
