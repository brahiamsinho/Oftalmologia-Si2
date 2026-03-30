'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, KeyRound, Search, Filter, CheckCircle2, XCircle,
  Loader2, Pencil, Trash2, X, ChevronDown,
} from 'lucide-react';
import { permisosService } from '@/lib/services';
import type { Permiso } from '@/lib/types';

// ── Colores por módulo ────────────────────────────────────────────────────────
const MODULO_COLORS: Record<string, string> = {
  USUARIOS:   'bg-blue-50   text-blue-700   border-blue-100',
  PACIENTES:  'bg-green-50  text-green-700  border-green-100',
  ROLES:      'bg-purple-50 text-purple-700 border-purple-100',
  BITACORA:   'bg-orange-50 text-orange-700 border-orange-100',
  AGENDA:     'bg-cyan-50   text-cyan-700   border-cyan-100',
  REPORTES:   'bg-rose-50   text-rose-700   border-rose-100',
  SISTEMA:    'bg-gray-100  text-gray-700   border-gray-200',
};
function moduloColor(m: string) {
  return MODULO_COLORS[m?.toUpperCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';
}

// ── Modal crear / editar ───────────────────────────────────────────────────────
interface ModalProps {
  permiso: Permiso | null;   // null = crear
  onClose: () => void;
  onSaved: () => void;
}

const MODULOS = ['USUARIOS', 'PACIENTES', 'ROLES', 'BITACORA', 'AGENDA', 'REPORTES', 'SISTEMA'];

function PermisoModal({ permiso, onClose, onSaved }: ModalProps) {
  const isEdit = permiso !== null;
  const [form, setForm] = useState({
    nombre:      permiso?.nombre      ?? '',
    descripcion: permiso?.descripcion ?? '',
    modulo:      permiso?.modulo      ?? 'USUARIOS',
    activo:      permiso?.activo      ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim())  e.nombre  = 'El nombre es obligatorio';
    if (!form.modulo)         e.modulo  = 'El módulo es obligatorio';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEdit) {
        await permisosService.update(permiso!.id_permiso, {
          nombre:      form.nombre,
          descripcion: form.descripcion || undefined,
          modulo:      form.modulo,
          activo:      form.activo,
        });
      } else {
        await permisosService.create({
          nombre:      form.nombre,
          descripcion: form.descripcion || undefined,
          modulo:      form.modulo,
        });
      }
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } };
      if (e?.response?.data) {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(e.response.data)) {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        }
        setErrors(mapped);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-[15px] font-bold text-gray-900">
            {isEdit ? 'Editar permiso' : 'Nuevo permiso'}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-[12.5px] font-medium text-gray-700 mb-1.5">Nombre *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
              placeholder="ej. ver_pacientes"
              className={`w-full h-10 px-3.5 rounded-xl border text-[13px] bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
                ${errors.nombre ? 'border-red-300' : 'border-gray-200'}`} />
            {errors.nombre && <p className="text-[11.5px] text-red-500 mt-1">{errors.nombre}</p>}
          </div>

          {/* Módulo */}
          <div>
            <label className="block text-[12.5px] font-medium text-gray-700 mb-1.5">Módulo *</label>
            <div className="relative">
              <select value={form.modulo} onChange={e => set('modulo', e.target.value)}
                className={`w-full h-10 px-3.5 pr-9 rounded-xl border text-[13px] bg-gray-50 appearance-none
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
                  ${errors.modulo ? 'border-red-300' : 'border-gray-200'}`}>
                {MODULOS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.modulo && <p className="text-[11.5px] text-red-500 mt-1">{errors.modulo}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-[12.5px] font-medium text-gray-700 mb-1.5">Descripción</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              placeholder="Descripción opcional del permiso..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] bg-gray-50 resize-none
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
          </div>

          {/* Activo (solo en edición) */}
          {isEdit && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600" />
              <span className="text-[13px] text-gray-700">Permiso activo</span>
            </label>
          )}

          {/* Botones */}
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600
                hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-1.5">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear permiso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function PermisosPage() {
  const [permisos,  setPermisos]  = useState<Permiso[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [modFilter, setModFilter] = useState('');
  const [modal,     setModal]     = useState<{ open: boolean; permiso: Permiso | null }>({ open: false, permiso: null });

  const fetchPermisos = useCallback(async () => {
    setLoading(true);
    try {
      setPermisos(await permisosService.list());
    } catch {
      setPermisos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPermisos(); }, [fetchPermisos]);

  // Módulos únicos para el filtro
  const modulos = [...new Set(permisos.map(p => p.modulo))].sort();

  // Filtrado
  const filtered = permisos.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || p.nombre.toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q);
    const matchM = !modFilter || p.modulo === modFilter;
    return matchQ && matchM;
  });

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este permiso?')) return;
    try {
      await permisosService.delete(id);
      setPermisos(prev => prev.filter(p => p.id_permiso !== id));
    } catch {
      alert('No se pudo eliminar el permiso.');
    }
  };

  // Agrupar por módulo para el listado
  const grouped = filtered.reduce<Record<string, Permiso[]>>((acc, p) => {
    if (!acc[p.modulo]) acc[p.modulo] = [];
    acc[p.modulo].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Permisos</h2>
          <p className="text-[12.5px] text-gray-400 mt-0.5">Gestiona los permisos disponibles del sistema</p>
        </div>
        <button
          onClick={() => setModal({ open: true, permiso: null })}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg
            text-[13.5px] font-semibold transition-colors shadow-sm">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nuevo Permiso
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total permisos',  value: loading ? '—' : permisos.length,                              color: 'text-gray-900'  },
          { label: 'Activos',         value: loading ? '—' : permisos.filter(p => p.activo).length,        color: 'text-green-600' },
          { label: 'Inactivos',       value: loading ? '—' : permisos.filter(p => !p.activo).length,       color: 'text-red-500'   },
          { label: 'Módulos',         value: loading ? '—' : modulos.length,                               color: 'text-blue-600'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3.5">
            <p className="text-[11.5px] text-gray-400 mb-1">{s.label}</p>
            <p className={`text-[28px] font-bold leading-none ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar permiso..."
            className="w-full h-9 pl-9 pr-3.5 rounded-xl border border-gray-200 bg-white text-[13px]
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <select value={modFilter} onChange={e => setModFilter(e.target.value)}
            className="h-9 pl-8 pr-8 rounded-xl border border-gray-200 bg-white text-[13px] appearance-none
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
            <option value="">Todos los módulos</option>
            {modulos.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando permisos...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-20 gap-2">
          <KeyRound className="w-8 h-8 text-gray-200" />
          <p className="text-sm text-gray-400">No se encontraron permisos</p>
          {(search || modFilter) && (
            <button onClick={() => { setSearch(''); setModFilter(''); }}
              className="text-[12.5px] text-blue-500 hover:underline mt-1">Limpiar filtros</button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([modulo, items]) => (
            <div key={modulo} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Cabecera del módulo */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
                <span className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold border ${moduloColor(modulo)}`}>
                  {modulo}
                </span>
                <span className="text-[12px] text-gray-400">{items.length} permisos</span>
              </div>

              {/* Filas */}
              <div className="divide-y divide-gray-100">
                {items.map(p => (
                  <div key={p.id_permiso} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13.5px] font-semibold text-gray-900">{p.nombre}</span>
                        {p.activo
                          ? <span className="flex items-center gap-1 text-[11px] text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Activo
                            </span>
                          : <span className="flex items-center gap-1 text-[11px] text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full font-medium">
                              <XCircle className="w-3 h-3" /> Inactivo
                            </span>
                        }
                      </div>
                      {p.descripcion && (
                        <p className="text-[12px] text-gray-400 mt-0.5 truncate">{p.descripcion}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setModal({ open: true, permiso: p })}
                        className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-blue-500">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p.id_permiso)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <PermisoModal
          permiso={modal.permiso}
          onClose={() => setModal({ open: false, permiso: null })}
          onSaved={() => { setModal({ open: false, permiso: null }); fetchPermisos(); }}
        />
      )}
    </div>
  );
}
