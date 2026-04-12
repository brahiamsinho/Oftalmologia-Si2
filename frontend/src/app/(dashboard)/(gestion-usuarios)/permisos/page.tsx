'use client';

import { useState, useEffect, useCallback } from 'react';
import { KeyRound, Search, Filter, CheckCircle2, XCircle, Loader2, ChevronDown, Info } from 'lucide-react';
import { permisosService } from '@/lib/services';
import type { Permiso } from '@/lib/types';

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

/**
 * Catálogo de permisos de solo lectura: el backend define los códigos (seed / migraciones).
 * Los roles se arman en «Roles» eligiendo entradas de esta lista.
 */
export default function PermisosPage() {
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modFilter, setModFilter] = useState('');

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

  const modulos = [...new Set(permisos.map(p => p.modulo))].sort();

  const filtered = permisos.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || p.nombre.toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q);
    const matchM = !modFilter || p.modulo === modFilter;
    return matchQ && matchM;
  });

  const grouped = filtered.reduce<Record<string, Permiso[]>>((acc, p) => {
    if (!acc[p.modulo]) acc[p.modulo] = [];
    acc[p.modulo].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Permisos</h2>
          <p className="text-[12.5px] text-gray-400 mt-0.5">Catálogo del sistema (solo lectura)</p>
        </div>
      </div>

      <div className="flex gap-3 items-start p-4 rounded-xl border border-blue-100 bg-blue-50/60 text-[13px] text-blue-900">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p>
          Los permisos son <strong>estáticos</strong>: se cargan con el comando de seed del backend
          (<code className="text-[12px] bg-white/80 px-1 rounded">seed --only permisos</code>).
          Para asignarlos a un rol, usá <strong>Usuarios → Roles</strong>.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total permisos',  value: loading ? '—' : permisos.length,                        color: 'text-gray-900'  },
          { label: 'Activos',         value: loading ? '—' : permisos.filter(p => p.activo !== false).length,  color: 'text-green-600' },
          { label: 'Inactivos',       value: loading ? '—' : permisos.filter(p => p.activo === false).length, color: 'text-red-500'   },
          { label: 'Módulos',         value: loading ? '—' : modulos.length,                         color: 'text-blue-600'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3.5">
            <p className="text-[11.5px] text-gray-400 mb-1">{s.label}</p>
            <p className={`text-[28px] font-bold leading-none ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

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
            <button type="button" onClick={() => { setSearch(''); setModFilter(''); }}
              className="text-[12.5px] text-blue-500 hover:underline mt-1">Limpiar filtros</button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([modulo, items]) => (
            <div key={modulo} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
                <span className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold border ${moduloColor(modulo)}`}>
                  {modulo}
                </span>
                <span className="text-[12px] text-gray-400">{items.length} permisos</span>
              </div>
              <div className="divide-y divide-gray-100">
                {items.map(p => (
                  <div key={p.id_permiso} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13.5px] font-semibold text-gray-900">{p.nombre}</span>
                        {p.activo !== false
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
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
