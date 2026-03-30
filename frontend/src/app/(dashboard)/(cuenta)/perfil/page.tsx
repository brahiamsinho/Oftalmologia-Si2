'use client';

import { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Phone, Lock, Save, Eye, EyeOff,
  CheckCircle2, AlertCircle, Camera, Loader2, KeyRound,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/lib/services';

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(n: string, a: string) {
  return ((n?.[0] ?? '') + (a?.[0] ?? '')).toUpperCase() || '?';
}

function Toast({ msg, type, onDone }: { msg: string; type: 'ok' | 'err'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-[13px] font-medium
      ${type === 'ok'
        ? 'bg-green-50 border-green-200 text-green-800'
        : 'bg-red-50  border-red-200  text-red-800'}`}>
      {type === 'ok'
        ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
        : <AlertCircle  className="w-4 h-4 text-red-500  flex-shrink-0" />}
      {msg}
    </div>
  );
}

// ── Sección card wrapper ───────────────────────────────────────────────────────
function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-blue-600" strokeWidth={1.8} />
        </div>
        <h3 className="text-[14.5px] font-bold text-gray-900">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Input helper ──────────────────────────────────────────────────────────────
function InputField({
  label, id, type = 'text', value, onChange, error, placeholder, icon: Icon, disabled = false,
  rightSlot,
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; error?: string; placeholder?: string;
  icon?: React.ElementType; disabled?: boolean; rightSlot?: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[12.5px] font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" strokeWidth={1.8} />}
        <input
          id={id} type={type} value={value} placeholder={placeholder}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
          className={`w-full h-10 ${Icon ? 'pl-9' : 'pl-3.5'} ${rightSlot ? 'pr-10' : 'pr-3.5'} rounded-xl border text-[13px] bg-gray-50
            transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${error ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}
            ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
      {error && <p className="mt-1 text-[11.5px] text-red-500">{error}</p>}
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function PerfilPage() {
  const { user, refreshUser } = useAuth();

  // ── Estado info personal ──
  const [info, setInfo] = useState({
    nombres:   user?.nombres   ?? '',
    apellidos: user?.apellidos ?? '',
    telefono:  user?.telefono  ?? '',
  });
  const [infoErrors,  setInfoErrors]  = useState<Record<string, string>>({});
  const [infoLoading, setInfoLoading] = useState(false);

  // Sync si el user carga después del primer render
  useEffect(() => {
    if (user) {
      setInfo({ nombres: user.nombres, apellidos: user.apellidos, telefono: user.telefono ?? '' });
    }
  }, [user]);

  // ── Estado contraseña ──
  const [pwd, setPwd] = useState({ old: '', new1: '', new2: '' });
  const [showPwd, setShowPwd] = useState({ old: false, new1: false, new2: false });
  const [pwdErrors,  setPwdErrors]  = useState<Record<string, string>>({});
  const [pwdLoading, setPwdLoading] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const showToast = (msg: string, type: 'ok' | 'err') => setToast({ msg, type });

  if (!user) return null;

  const init = initials(user.nombres, user.apellidos);
  const fullName = `${user.nombres} ${user.apellidos}`.trim();
  const roleLabel = user.tipo_usuario.toLowerCase().replace(/_/g, ' ');

  // ── Guardar info ──
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!info.nombres.trim())   errs.nombres   = 'El nombre es obligatorio';
    if (!info.apellidos.trim()) errs.apellidos = 'El apellido es obligatorio';
    setInfoErrors(errs);
    if (Object.keys(errs).length) return;

    setInfoLoading(true);
    try {
      await authService.updateMe({
        nombres:   info.nombres,
        apellidos: info.apellidos,
        telefono:  info.telefono || undefined,
      });
      await refreshUser();
      showToast('Perfil actualizado correctamente', 'ok');
    } catch {
      showToast('No se pudo actualizar el perfil', 'err');
    } finally {
      setInfoLoading(false);
    }
  };

  // ── Cambiar contraseña ──
  const handleSavePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!pwd.old)              errs.old  = 'Ingresá tu contraseña actual';
    if (!pwd.new1)             errs.new1 = 'Ingresá la nueva contraseña';
    else if (pwd.new1.length < 8) errs.new1 = 'Mínimo 8 caracteres';
    if (pwd.new1 !== pwd.new2) errs.new2 = 'Las contraseñas no coinciden';
    setPwdErrors(errs);
    if (Object.keys(errs).length) return;

    setPwdLoading(true);
    try {
      await authService.changePassword(pwd.old, pwd.new1);
      setPwd({ old: '', new1: '', new2: '' });
      showToast('Contraseña cambiada correctamente', 'ok');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      if (data?.old_password) {
        setPwdErrors({ old: 'Contraseña actual incorrecta' });
      } else {
        showToast('No se pudo cambiar la contraseña', 'err');
      }
    } finally {
      setPwdLoading(false);
    }
  };

  const toggler = (k: keyof typeof showPwd) => (
    <button type="button" onClick={() => setShowPwd(s => ({ ...s, [k]: !s[k] }))}
      className="text-gray-400 hover:text-gray-600 transition-colors">
      {showPwd[k] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div>
        <h2 className="text-[22px] font-bold text-gray-900">Mi Perfil</h2>
        <p className="text-[12.5px] text-gray-400 mt-0.5">Gestiona tu información personal y seguridad</p>
      </div>

      {/* ── Avatar + info básica ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
            <span className="text-[22px] font-bold text-white">{init}</span>
          </div>
          <button
            title="Cambiar foto (próximamente)"
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-100 border border-gray-200 rounded-full
              flex items-center justify-center hover:bg-gray-200 transition-colors">
            <Camera className="w-3 h-3 text-gray-500" />
          </button>
        </div>
        <div className="min-w-0">
          <p className="text-[17px] font-bold text-gray-900 truncate">{fullName}</p>
          <p className="text-[13px] text-gray-400 capitalize mt-0.5">{roleLabel}</p>
          <p className="text-[12px] text-gray-400 mt-1">@{user.username} · {user.email}</p>
        </div>
        <div className="ml-auto flex-shrink-0">
          <span className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold border
            ${user.estado === 'ACTIVO'
              ? 'bg-green-50 text-green-700 border-green-100'
              : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {user.estado}
          </span>
        </div>
      </div>

      {/* ── Info personal ── */}
      <Card title="Información personal" icon={User}>
        <form onSubmit={handleSaveInfo} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Nombres *" id="nombres" value={info.nombres}
              onChange={v => setInfo(s => ({ ...s, nombres: v }))}
              error={infoErrors.nombres} placeholder="Ej: Carlos" />
            <InputField label="Apellidos *" id="apellidos" value={info.apellidos}
              onChange={v => setInfo(s => ({ ...s, apellidos: v }))}
              error={infoErrors.apellidos} placeholder="Ej: López" />
          </div>
          <InputField label="Correo electrónico" id="email" type="email"
            value={user.email} onChange={() => {}} icon={Mail}
            disabled placeholder={user.email} />
          <InputField label="Teléfono" id="telefono" type="tel"
            value={info.telefono} onChange={v => setInfo(s => ({ ...s, telefono: v }))}
            icon={Phone} placeholder="+34 600 000 000" />

          <div className="flex justify-end pt-1">
            <button type="submit" disabled={infoLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                text-white text-[13.5px] font-semibold rounded-xl transition-colors shadow-sm">
              {infoLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Save className="w-4 h-4" strokeWidth={2} />}
              Guardar cambios
            </button>
          </div>
        </form>
      </Card>

      {/* ── Cambiar contraseña ── */}
      <Card title="Cambiar contraseña" icon={KeyRound}>
        <form onSubmit={handleSavePwd} className="space-y-4">
          <InputField label="Contraseña actual" id="old" type={showPwd.old ? 'text' : 'password'}
            value={pwd.old} onChange={v => setPwd(s => ({ ...s, old: v }))}
            error={pwdErrors.old} placeholder="••••••••" icon={Lock}
            rightSlot={toggler('old')} />

          <div className="grid grid-cols-2 gap-3">
            <InputField label="Nueva contraseña" id="new1" type={showPwd.new1 ? 'text' : 'password'}
              value={pwd.new1} onChange={v => setPwd(s => ({ ...s, new1: v }))}
              error={pwdErrors.new1} placeholder="Mín. 8 caracteres" icon={Lock}
              rightSlot={toggler('new1')} />
            <InputField label="Confirmar contraseña" id="new2" type={showPwd.new2 ? 'text' : 'password'}
              value={pwd.new2} onChange={v => setPwd(s => ({ ...s, new2: v }))}
              error={pwdErrors.new2} placeholder="Repetir contraseña" icon={Lock}
              rightSlot={toggler('new2')} />
          </div>

          <div className="flex justify-end pt-1">
            <button type="submit" disabled={pwdLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                text-white text-[13.5px] font-semibold rounded-xl transition-colors shadow-sm">
              {pwdLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Lock className="w-4 h-4" strokeWidth={2} />}
              Cambiar contraseña
            </button>
          </div>
        </form>
      </Card>

      {/* ── Info de cuenta (solo lectura) ── */}
      <Card title="Información de cuenta" icon={Mail}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3.5 text-[13px]">
          {[
            { label: 'Nombre de usuario', value: `@${user.username}`                           },
            { label: 'Correo',            value: user.email                                     },
            { label: 'Tipo',              value: user.tipo_usuario                              },
            { label: 'Acceso admin',      value: user.is_staff ? 'Sí' : 'No'                   },
            { label: 'Último acceso',     value: user.ultimo_acceso
                ? new Date(user.ultimo_acceso).toLocaleString('es-ES')
                : 'Desconocido'                                                                  },
            { label: 'Miembro desde',     value: new Date(user.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[11.5px] text-gray-400 mb-0.5">{label}</p>
              <p className="font-medium text-gray-800 truncate">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
