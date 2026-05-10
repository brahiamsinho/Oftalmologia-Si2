'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Building2, Loader2, Lock, Mail } from 'lucide-react';
import { resolveApiOrigin } from '@/lib/api';
import { PlatformTokenStorage } from '@/lib/platformApi';

interface PlatformLoginResponse {
  access: string;
  administrator: { id: number; email: string; nombre: string };
}

export default function PlatformLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl backdrop-blur">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
            <Building2 className="h-8 w-8" aria-hidden />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Acceso plataforma</h1>
          <p className="mt-2 text-sm text-slate-400">
            Administración de clínicas (SaaS). No uses esta pantalla para entrar a una clínica.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error ? (
            <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="plat-email" className="block text-sm font-medium text-slate-300">
              Correo
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="plat-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="admin@tu-dominio.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="plat-pass" className="block text-sm font-medium text-slate-300">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="plat-pass"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ingresando…
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Volver al login de clínica
          </Link>
        </p>
      </div>
    </div>
  );
}
