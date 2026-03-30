'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Shield, CheckCircle, XCircle, Lock,
         Mail, Phone, SlidersHorizontal, Loader2, Users, X, Eye, EyeOff,
         Pencil, UserCheck, UserX, Trash2 } from 'lucide-react';
import { usuariosService } from '@/lib/services';
import { useAuth } from '@/context/AuthContext';
import type { Usuario, TipoUsuario, EstadoUsuario } from '@/lib/types';

// ── Constantes ────────────────────────────────────────────────────────────────
const TIPO_BADGE: Record<TipoUsuario, string> = {
  ADMIN:          'bg-purple-100 text-purple-700',
  MEDICO:         'bg-blue-100 text-blue-700',
  ESPECIALISTA:   'bg-indigo-100 text-indigo-700',
  ADMINISTRATIVO: 'bg-yellow-100 text-yellow-700',
  PACIENTE:       'bg-gray-100 text-gray-500',
};
const TIPO_LABEL: Record<TipoUsuario, string> = {
  ADMIN: 'Administrador', MEDICO: 'Médico', ESPECIALISTA: 'Especialista',
  ADMINISTRATIVO: 'Administrativo', PACIENTE: 'Paciente',
};
const ESTADO_CFG: Record<EstadoUsuario, { icon: React.ReactNode; badge: string; label: string }> = {
  ACTIVO:    { icon: <CheckCircle className="w-3.5 h-3.5 text-green-500" />, badge: 'bg-green-100 text-green-700', label: 'Activo'    },
  INACTIVO:  { icon: <XCircle     className="w-3.5 h-3.5 text-gray-400"  />, badge: 'bg-gray-100 text-gray-500',  label: 'Inactivo'  },
  BLOQUEADO: { icon: <Lock        className="w-3.5 h-3.5 text-red-500"   />, badge: 'bg-red-100 text-red-700',    label: 'Bloqueado' },
};

// ── Formulario ────────────────────────────────────────────────────────────────
interface FormData {
  username: string;
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  tipo_usuario: TipoUsuario;
  estado: EstadoUsuario;
  is_staff: boolean;
}

const EMPTY_FORM: FormData = {
  username: '', email: '', password: '', nombres: '', apellidos: '',
  telefono: '', tipo_usuario: 'MEDICO', estado: 'ACTIVO', is_staff: false,
};

// ── Field + inputCls fuera del modal para evitar remount en cada keystroke ─────
const inputCls = (err?: string) =>
  `w-full h-9 px-3 bg-white border ${err ? 'border-red-400' : 'border-gray-200'} rounded-lg text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`;

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[12.5px] font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-[11.5px] text-red-600">{error}</p>}
    </div>
  );
}

interface ModalProps {
  usuario: Usuario | null;   // null → crear
  onClose: () => void;
  onSaved: () => void;
}

function UsuarioModal({ usuario, onClose, onSaved }: ModalProps) {
  const isEdit = !!usuario;
  const [form,     setForm]     = useState<FormData>(
    isEdit
      ? { ...EMPTY_FORM, ...usuario, password: '', telefono: usuario.telefono ?? '' }
      : EMPTY_FORM,
  );
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  const set = (k: keyof FormData, v: string | boolean) =>
    setForm(p => ({ ...p, [k]: v }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.username.trim()) e.username = 'El nombre de usuario es requerido';
    if (!form.email.trim())    e.email    = 'El correo es requerido';
    if (!isEdit && !form.password) e.password = 'La contraseña es requerida';
    if (form.password && form.password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (!form.nombres.trim())  e.nombres  = 'El nombre es requerido';
    if (!form.apellidos.trim())e.apellidos= 'El apellido es requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form, telefono: form.telefono || undefined };
      if (isEdit) {
        const { password, ...rest } = payload;
        await usuariosService.update(usuario!.id, password ? payload : rest);
      } else {
        await usuariosService.create(payload);
      }
      onSaved();
    } catch (err: unknown) {
      // Mapear errores del backend al formulario
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      if (data) {
        const mapped: Record<string, string> = {};
        Object.entries(data).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : String(v); });
        setErrors(mapped);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-[16px] font-bold text-gray-900">{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</h3>
            <p className="text-[12px] text-gray-400 mt-0.5">{isEdit ? `Modificando a ${usuario!.nombres} ${usuario!.apellidos}` : 'Completá los datos del nuevo usuario'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form id="user-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Nombres */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombres *" id="nombres" error={errors.nombres}>
              <input id="nombres" type="text" value={form.nombres} onChange={e => set('nombres', e.target.value)}
                placeholder="Ej: Carlos" className={inputCls(errors.nombres)} />
            </Field>
            <Field label="Apellidos *" id="apellidos" error={errors.apellidos}>
              <input id="apellidos" type="text" value={form.apellidos} onChange={e => set('apellidos', e.target.value)}
                placeholder="Ej: López" className={inputCls(errors.apellidos)} />
            </Field>
          </div>

          {/* Username + Email */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Usuario *" id="username" error={errors.username}>
              <input id="username" type="text" value={form.username} onChange={e => set('username', e.target.value)}
                placeholder="Ej: carlos.lopez" className={inputCls(errors.username)} />
            </Field>
            <Field label="Correo electrónico *" id="email" error={errors.email}>
              <input id="email" type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="carlos@clinica.com" className={inputCls(errors.email)} />
            </Field>
          </div>

          {/* Teléfono */}
          <Field label="Teléfono" id="telefono" error={errors.telefono}>
            <input id="telefono" type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)}
              placeholder="+34 600 000 000" className={inputCls(errors.telefono)} />
          </Field>

          {/* Password */}
          <Field label={isEdit ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'} id="password" error={errors.password}>
            <div className="relative">
              <input id="password" type={showPass ? 'text' : 'password'} value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder={isEdit ? '••••••••' : 'Mín. 8 caracteres'}
                className={`${inputCls(errors.password)} pr-9`} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </Field>

          {/* Tipo + Estado */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo de usuario *" id="tipo_usuario" error={errors.tipo_usuario}>
              <select id="tipo_usuario" value={form.tipo_usuario}
                onChange={e => set('tipo_usuario', e.target.value)}
                className={`${inputCls(errors.tipo_usuario)} appearance-none`}>
                {(Object.entries(TIPO_LABEL) as [TipoUsuario, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Estado" id="estado" error={errors.estado}>
              <select id="estado" value={form.estado}
                onChange={e => set('estado', e.target.value as EstadoUsuario)}
                className={`${inputCls(errors.estado)} appearance-none`}>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="BLOQUEADO">Bloqueado</option>
              </select>
            </Field>
          </div>

          {/* Staff */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={form.is_staff} onChange={e => set('is_staff', e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600" />
            <span className="text-[13px] text-gray-700">
              <span className="font-medium">Acceso al admin de Django</span>
              <span className="text-gray-400 ml-1">(is_staff)</span>
            </span>
          </label>

          {/* Error general */}
          {errors.non_field_errors && (
            <p className="text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {errors.non_field_errors}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-[13.5px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Cancelar
          </button>
          <button type="submit" form="user-form" disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[13.5px] font-semibold rounded-lg transition-colors shadow-sm">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const [usuarios,    setUsuarios]    = useState<Usuario[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [total,       setTotal]       = useState(0);
  const [search,      setSearch]      = useState('');
  const [tipoFilter,  setTipoFilter]  = useState('');
  const [estadoFilter,setEstadoFilter]= useState('');
  const [modal,       setModal]       = useState<{ open: boolean; usuario: Usuario | null }>({ open: false, usuario: null });

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usuariosService.list({
        search:        search      || undefined,
        tipo_usuario:  tipoFilter  || undefined,
        estado:        estadoFilter|| undefined,
      });
      setUsuarios(res.results);
      setTotal(res.count);
    } catch {
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, [search, tipoFilter, estadoFilter]);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  const handleAction = async (action: 'activar' | 'bloquear', id: number) => {
    try {
      if (action === 'activar')  await usuariosService.activar(id);
      if (action === 'bloquear') await usuariosService.bloquear(id);
      fetchUsuarios();
    } catch { /* ignorar */ }
  };

  const handleDelete = async (u: Usuario) => {
    // Un admin no puede eliminar a otro admin
    if (u.tipo_usuario === 'ADMIN') return;
    if (!confirm(`¿Eliminar a ${u.nombres} ${u.apellidos}? Esta acción no se puede deshacer.`)) return;
    try {
      await usuariosService.delete(u.id);
      fetchUsuarios();
    } catch {
      alert('No se pudo eliminar el usuario.');
    }
  };

  const counts = {
    total:     total,
    activos:   usuarios.filter(u => u.estado === 'ACTIVO').length,
    inactivos: usuarios.filter(u => u.estado === 'INACTIVO').length,
    bloqueados:usuarios.filter(u => u.estado === 'BLOQUEADO').length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Usuarios</h2>
          <p className="text-[12.5px] text-gray-400 mt-0.5">Gestión de cuentas y accesos del sistema</p>
        </div>
        <button
          onClick={() => setModal({ open: true, usuario: null })}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[13.5px] font-semibold transition-colors shadow-sm">
          <Plus className="w-4 h-4" strokeWidth={2.5} /> Nuevo Usuario
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Total',      value: loading ? '—' : counts.total,      color: 'text-gray-900'  },
          { label: 'Activos',    value: loading ? '—' : counts.activos,    color: 'text-green-600' },
          { label: 'Inactivos',  value: loading ? '—' : counts.inactivos,  color: 'text-gray-500'  },
          { label: 'Bloqueados', value: loading ? '—' : counts.bloqueados, color: 'text-red-600'   },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-[12px] text-gray-400 mb-1">{label}</p>
            <p className={`text-[30px] font-bold leading-none ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
          <input type="text" placeholder="Buscar por nombre o email..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-white border border-gray-200 rounded-lg text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
        </div>
        <SlidersHorizontal className="w-[15px] h-[15px] text-gray-400 flex-shrink-0" />
        <select value={tipoFilter} onChange={e => setTipoFilter(e.target.value)}
          className="h-9 pl-2.5 pr-6 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none">
          <option value="">Todos los tipos</option>
          {(Object.entries(TIPO_LABEL) as [TipoUsuario, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}
          className="h-9 pl-2.5 pr-6 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none">
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
          <option value="BLOQUEADO">Bloqueado</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-gray-900">Lista de usuarios</p>
          <span className="text-[12px] text-gray-400">{loading ? '...' : `${total} usuario${total !== 1 ? 's' : ''}`}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Cargando usuarios...</span>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Users className="w-8 h-8 text-gray-200" />
            <p className="text-sm text-gray-400">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Usuario','Contacto','Tipo','Estado','Último acceso',''].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Usuario */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-bold text-blue-700">
                            {u.nombres[0]}{u.apellidos[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-[13.5px] font-semibold text-gray-900">{u.nombres} {u.apellidos}</p>
                          <p className="text-[11px] text-gray-400">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    {/* Contacto */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                        <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />{u.email}
                      </div>
                      {u.telefono && (
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mt-0.5">
                          <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />{u.telefono}
                        </div>
                      )}
                    </td>
                    {/* Tipo */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-[3px] rounded-full text-[11.5px] font-medium ${TIPO_BADGE[u.tipo_usuario]}`}>
                        {TIPO_LABEL[u.tipo_usuario]}
                      </span>
                    </td>
                    {/* Estado */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {ESTADO_CFG[u.estado].icon}
                        <span className={`px-2.5 py-[3px] rounded-full text-[11.5px] font-medium ${ESTADO_CFG[u.estado].badge}`}>
                          {ESTADO_CFG[u.estado].label}
                        </span>
                      </div>
                    </td>
                    {/* Acceso */}
                    <td className="px-5 py-3.5 text-[12px] text-gray-400 whitespace-nowrap">
                      {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es') : 'Nunca'}
                    </td>
                    {/* Acciones */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">

                        {/* Editar */}
                        <button
                          onClick={() => setModal({ open: true, usuario: u })}
                          title="Editar usuario"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                          <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>

                        {/* Activar (solo si no está activo) */}
                        {u.estado !== 'ACTIVO' && (
                          <button
                            onClick={() => handleAction('activar', u.id)}
                            title="Activar usuario"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-green-500 hover:bg-green-50 hover:text-green-700 transition-colors">
                            <UserCheck className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                        )}

                        {/* Bloquear (solo si no está bloqueado) */}
                        {u.estado !== 'BLOQUEADO' && (
                          <button
                            onClick={() => handleAction('bloquear', u.id)}
                            title="Bloquear usuario"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-orange-400 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                            <UserX className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                        )}

                        {/* Eliminar — deshabilitado si el target es ADMIN */}
                        {u.tipo_usuario === 'ADMIN' ? (
                          <button
                            disabled
                            title="No se puede eliminar un administrador"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-200 cursor-not-allowed">
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDelete(u)}
                            title="Eliminar usuario"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.open && (
        <UsuarioModal
          usuario={modal.usuario}
          onClose={() => setModal({ open: false, usuario: null })}
          onSaved={() => { setModal({ open: false, usuario: null }); fetchUsuarios(); }}
        />
      )}
    </div>
  );
}
