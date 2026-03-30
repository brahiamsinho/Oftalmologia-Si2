'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, Shield, LayoutDashboard, Activity, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import SnellenEvaluation from '@/components/SnellenEvaluation';
import MinimalIris from '@/components/MinimalIris';

const DEMOS = [
  { role: 'Administrador', login: 'admin', pass: 'admin123' },
];

const BULLETS = [
  { icon: Shield,          label: 'Acceso seguro y controlado'       },
  { icon: LayoutDashboard, label: 'Gestión integral de la clínica'   },
  { icon: Activity,        label: 'Historial clínico en tiempo real' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [loginVal, setLoginVal] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginVal, password);
    } catch {
      setError('Usuario o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Fondo full-screen con el mismo gradiente del hero */
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center relative overflow-hidden px-4 py-10">

      {/* ── Círculos decorativos ── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/20 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[380px] h-[380px] rounded-full bg-blue-900/40 translate-y-1/3 -translate-x-1/4 pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* ── Layout principal ── */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

        {/* ══ IZQUIERDA: cartilla Snellen + info ══ */}
        <div className="flex flex-col items-center lg:items-start gap-8">
          <div className="w-full max-w-[380px] flex flex-col items-center gap-6">
            <MinimalIris />
            <SnellenEvaluation />
          </div>

          {/* Nombre + bullets */}
          <div>
            <h2 className="text-[26px] font-bold text-white mb-1">
              Clínica Oftalmológica
            </h2>
            <p className="text-blue-200 text-[13.5px] mb-5">Sistema de Gestión Médica</p>
            <ul className="space-y-3">
              {BULLETS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                  </div>
                  <span className="text-[13.5px] text-blue-100">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ══ DERECHA: tarjeta de login ══ */}
        <div className="w-full">
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-8">

            {/* Encabezado */}
            <h1 className="text-[22px] font-bold text-gray-900 mb-1">Iniciar Sesión</h1>
            <p className="text-[13px] text-gray-400 mb-6">Ingresa tus credenciales para acceder al sistema</p>

            <form className="space-y-4" onSubmit={handleSubmit}>

              {/* Usuario */}
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={loginVal}
                    onChange={e => setLoginVal(e.target.value)}
                    placeholder="correo@clinica.com"
                    autoComplete="username"
                    className="w-full h-11 pl-9 pr-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13.5px] text-gray-900
                               placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
                    className="w-full h-11 pl-9 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-[13.5px] text-gray-900
                               placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Recordar + Olvidé */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-blue-600" />
                  <span className="text-[13px] text-gray-600">Recordarme</span>
                </label>
                <a href="#" className="text-[13px] text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Error */}
              {error && (
                <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  {error}
                </p>
              )}

              {/* Demo credentials */}
              <div className="rounded-xl bg-blue-50 border border-blue-100 px-3.5 py-3">
                <p className="text-[11.5px] text-blue-500 font-medium mb-1.5">Credenciales de demo</p>
                {DEMOS.map(d => (
                  <button key={d.role} type="button"
                    onClick={() => { setLoginVal(d.login); setPassword(d.pass); }}
                    className="w-full text-left text-[12px] text-blue-700 hover:text-blue-900 transition-colors">
                    <span className="font-semibold">{d.role}:</span> {d.login} / {d.pass}
                  </button>
                ))}
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed
                           text-white text-[14px] font-semibold rounded-xl transition-colors shadow-sm">
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>

            {/* Volver al inicio */}
            <div className="mt-5 text-center">
              <Link href="/"
                className="inline-flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
