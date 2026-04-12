'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, Loader2, ScrollText, LogIn, LogOut, Plus, Edit2, Trash2, Key, AlertTriangle, RefreshCw, Calendar } from 'lucide-react';
import { bitacoraService } from '@/lib/services';
import type { RegistroBitacora, AccionBitacora } from '@/lib/types';

const TZ_BO = 'America/La_Paz';

const ACCION: Record<AccionBitacora, { label: string; color: string; icon: React.ReactNode }> = {
  LOGIN:             { label: 'Login',              color: 'bg-green-100 text-green-700',   icon: <LogIn   className="w-3 h-3" /> },
  LOGOUT:            { label: 'Logout',             color: 'bg-gray-100 text-gray-500',     icon: <LogOut  className="w-3 h-3" /> },
  LOGIN_FALLIDO:     { label: 'Login fallido',      color: 'bg-red-100 text-red-700',       icon: <AlertTriangle className="w-3 h-3" /> },
  CREAR:             { label: 'Crear',              color: 'bg-blue-100 text-blue-700',     icon: <Plus    className="w-3 h-3" /> },
  EDITAR:            { label: 'Editar',             color: 'bg-yellow-100 text-yellow-700', icon: <Edit2   className="w-3 h-3" /> },
  ELIMINAR:          { label: 'Eliminar',           color: 'bg-red-100 text-red-700',       icon: <Trash2  className="w-3 h-3" /> },
  CAMBIAR_PASSWORD:  { label: 'Cambiar contraseña', color: 'bg-purple-100 text-purple-700', icon: <Key     className="w-3 h-3" /> },
  RECUPERAR_PASSWORD:{ label: 'Recuperar contraseña',color: 'bg-orange-100 text-orange-700',icon: <Key    className="w-3 h-3" /> },
  REPROGRAMAR:       { label: 'Reprogramar',        color: 'bg-indigo-100 text-indigo-700', icon: <RefreshCw className="w-3 h-3" /> },
  CANCELAR:          { label: 'Cancelar',           color: 'bg-red-100 text-red-700',       icon: <AlertTriangle className="w-3 h-3" /> },
  CONFIRMAR:         { label: 'Confirmar',          color: 'bg-green-100 text-green-700',   icon: <Calendar className="w-3 h-3" /> },
};

/** Valores de `modulo` que envía el backend (inglés técnico en varios puntos). */
const MODULOS = [
  'Todos', 'auth', 'patients', 'consultas', 'estudios', 'appointments', 'users', 'roles', 'specialists', 'bitacora',
];

type StatExtra = { logins: number; errores: number; cambios: number };

export default function BitacoraPage() {
  const [registros, setRegistros] = useState<RegistroBitacora[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [statExtra, setStatExtra] = useState<StatExtra>({ logins: 0, errores: 0, cambios: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modulo, setModulo] = useState('');
  const [accion, setAccion] = useState('');

  const fetchBitacora = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bitacoraService.list({
        search:   search  || undefined,
        modulo:   modulo  || undefined,
        accion:   accion  || undefined,
        ordering: '-fecha_evento',
      });
      setRegistros(res.results);
      setTotal(res.count);
    } catch {
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  }, [search, modulo, accion]);

  useEffect(() => { fetchBitacora(); }, [fetchBitacora]);

  useEffect(() => {
    let cancelled = false;
    const base = { search: search || undefined, modulo: modulo || undefined, page: 1 };

    async function loadStats() {
      setStatsLoading(true);
      try {
        const [l, f, c, e, el] = await Promise.all([
          bitacoraService.list({ ...base, accion: 'LOGIN' }),
          bitacoraService.list({ ...base, accion: 'LOGIN_FALLIDO' }),
          bitacoraService.list({ ...base, accion: 'CREAR' }),
          bitacoraService.list({ ...base, accion: 'EDITAR' }),
          bitacoraService.list({ ...base, accion: 'ELIMINAR' }),
        ]);
        if (cancelled) return;
        setStatExtra({
          logins: l.count,
          errores: f.count,
          cambios: c.count + e.count + el.count,
        });
      } catch {
        if (!cancelled) setStatExtra({ logins: 0, errores: 0, cambios: 0 });
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }
    loadStats();
    return () => { cancelled = true; };
  }, [search, modulo]);

  const fmtBo = useCallback((iso: string) => {
    const d = new Date(iso);
    return {
      time: d.toLocaleTimeString('es-BO', { timeZone: TZ_BO, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: d.toLocaleDateString('es-BO', { timeZone: TZ_BO, day: 'numeric', month: 'numeric', year: 'numeric' }),
    };
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Bitácora del sistema</h2>
          <p className="text-[12.5px] text-gray-400 mt-0.5">Auditoría (hora en Bolivia — {TZ_BO})</p>
        </div>
        <button type="button" className="flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-[13.5px] font-semibold transition-colors shadow-sm opacity-60 cursor-not-allowed" title="Próximamente">
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Total eventos', v: loading ? '—' : total, c: 'text-gray-900' },
          { label: 'Logins',        v: statsLoading ? '—' : statExtra.logins, c: 'text-green-600' },
          { label: 'Errores',       v: statsLoading ? '—' : statExtra.errores, c: 'text-red-600' },
          { label: 'Cambios data',  v: statsLoading ? '—' : statExtra.cambios, c: 'text-blue-600' },
        ].map(({ label, v, c }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-[12px] text-gray-400 mb-1">{label}</p>
            <p className={`text-[30px] font-bold leading-none ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-white border border-gray-200 rounded-lg text-[13px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
        </div>
        <SlidersHorizontal className="w-[15px] h-[15px] text-gray-400 flex-shrink-0" />
        <select value={modulo} onChange={e => setModulo(e.target.value)}
          className="h-9 pl-2.5 pr-6 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none max-w-[200px]">
          {MODULOS.map(m => <option key={m} value={m === 'Todos' ? '' : m}>{m === 'Todos' ? 'Todos los módulos' : m}</option>)}
        </select>
        <select value={accion} onChange={e => setAccion(e.target.value)}
          className="h-9 pl-2.5 pr-6 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none">
          <option value="">Todas las acciones</option>
          {(Object.entries(ACCION) as [AccionBitacora, { label: string }][]).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-gray-900">Registro de eventos</p>
          <span className="text-[12px] text-gray-400">{loading ? '...' : `${total} evento${total !== 1 ? 's' : ''}`}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Cargando registros...</span>
          </div>
        ) : registros.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <ScrollText className="w-8 h-8 text-gray-200" />
            <p className="text-sm text-gray-400">No hay eventos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['#','Hora','Usuario','Módulo','Acción','Descripción','IP'].map(h => (
                    <th key={h} className="px-4 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {registros.map(r => {
                  const { time, date } = fmtBo(r.fecha_evento);
                  const A = ACCION[r.accion] ?? { label: r.accion, color: 'bg-gray-100 text-gray-600', icon: null };
                  const who = r.usuario_nombre ?? r.usuario_email ?? (r.id_usuario != null ? `ID ${r.id_usuario}` : 'Sistema');
                  return (
                    <tr key={r.id_bitacora} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 sm:px-5 py-3 text-[11px] font-mono text-gray-300">{r.id_bitacora}</td>
                      <td className="px-4 sm:px-5 py-3 whitespace-nowrap">
                        <p className="text-[12.5px] font-semibold text-gray-900 font-mono">{time}</p>
                        <p className="text-[11px] text-gray-400">{date}</p>
                      </td>
                      <td className="px-4 sm:px-5 py-3 max-w-[140px] sm:max-w-[200px]">
                        <p className="text-[12.5px] text-gray-700 truncate" title={who}>{who}</p>
                      </td>
                      <td className="px-4 sm:px-5 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11.5px] font-medium">{r.modulo}</span>
                      </td>
                      <td className="px-4 sm:px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[11.5px] font-medium ${A.color}`}>
                          {A.icon}{A.label}
                        </span>
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-[12.5px] text-gray-600 max-w-[200px] sm:max-w-[280px]">
                        <span className="line-clamp-2">{r.descripcion}</span>
                      </td>
                      <td className="px-4 sm:px-5 py-3 text-[11.5px] font-mono text-gray-400 whitespace-nowrap">{r.ip_origen ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
