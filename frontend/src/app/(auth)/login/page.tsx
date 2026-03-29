'use client';

import { useState } from 'react';
import { Activity, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const DEMOS = [
  { role: 'Administrador', email: 'admin@clinica.com',   pass: 'admin123'    },
  { role: 'Doctor',        email: 'doctor@clinica.com',  pass: 'doctor123'   },
  { role: 'Paciente',      email: 'paciente@email.com',  pass: 'paciente123' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
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
      await login(email, password);
      // AuthContext redirige automáticamente al dashboard
    } catch {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ══════════ LEFT PANEL ══════════ */}
      <div className="flex flex-col items-center justify-center w-full max-w-[460px] flex-shrink-0 bg-white px-8 py-10">

        {/* Logo + title */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-[52px] h-[52px] rounded-2xl bg-blue-600 flex items-center justify-center shadow-md mb-4">
            <Activity className="w-[26px] h-[26px] text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">CRM Oftalmológico</h1>
          <p className="text-[13px] text-gray-400 mt-1">Sistema de Gestión Clínica con IA</p>
        </div>

        {/* ── Form card ── */}
        <div className="w-full max-w-[360px] bg-white rounded-2xl border border-gray-200 shadow-md px-6 py-6 mb-5">
        <form
          className="space-y-4"
          onSubmit={handleSubmit}
        >
            {/* Email */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@clinica.com"
                className="w-full h-10 px-3.5 bg-white border border-gray-200 rounded-lg text-[13.5px] text-gray-900 placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 px-3.5 pr-10 bg-white border border-gray-200 rounded-lg text-[13.5px] text-gray-900 placeholder:text-gray-400
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-blue-600"
                />
                <span className="text-[13px] text-gray-600">Recordar sesión</span>
              </label>
              <a href="#" className="text-[13px] text-blue-600 hover:text-blue-700 font-medium transition-colors">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-semibold rounded-lg
                         transition-colors duration-150 shadow-sm mt-1"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>

        {/* ── Demo credentials ── */}
        <div className="w-full max-w-[360px]">
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              {/* info icon */}
              <div className="w-4 h-4 rounded-full bg-orange-400 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[9px] font-bold">i</span>
              </div>
              <span className="text-[12.5px] font-semibold text-orange-700">Credenciales de Demostración</span>
            </div>
            <div className="space-y-1.5">
              {DEMOS.map(d => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => { setEmail(d.email); setPassword(d.pass); }}
                  className="w-full text-left px-3 py-2 bg-white rounded-lg border border-orange-100 hover:border-orange-300 hover:bg-orange-50/60 transition-colors"
                >
                  <span className="text-[12px] text-gray-700">
                    <span className="font-semibold">{d.role}:</span> {d.email} / {d.pass}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ RIGHT PANEL ══════════ */}
      <div className="flex-1 relative overflow-hidden">
        {/* Real-looking medical background using gradient layers + subtle pattern */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1400&q=80&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Blue overlay */}
        <div className="absolute inset-0 bg-blue-700/80" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center h-full px-14 pb-8">
          <h2 className="text-[34px] font-bold text-white leading-snug mb-4 max-w-[420px]">
            Gestión médica inteligente<br />con IA
          </h2>
          <p className="text-blue-100 text-[15px] leading-relaxed mb-10 max-w-[400px]">
            Simplifica la administración de tu clínica oftalmológica con tecnología de última generación.
          </p>

          <ul className="space-y-6">
            {[
              { title: 'Gestión de Pacientes',   sub: 'Historiales clínicos digitalizados'            },
              { title: 'Asistente con IA',        sub: 'Documentación automática y alertas inteligentes' },
              { title: 'Control Quirúrgico',      sub: 'Pre y postoperatorio digital'                  },
            ].map(({ title, sub }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-[5px] w-2 h-2 rounded-full bg-blue-300 flex-shrink-0" />
                <div>
                  <p className="text-[15px] font-semibold text-white">{title}</p>
                  <p className="text-[13px] text-blue-200 mt-0.5">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
