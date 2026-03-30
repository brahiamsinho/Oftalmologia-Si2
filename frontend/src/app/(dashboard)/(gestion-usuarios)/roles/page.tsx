'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Shield, ChevronDown, ChevronRight,
  Pencil, Trash2, Loader2, X, CheckCircle2, Search,
} from 'lucide-react';
import { rolesService } from '@/lib/services';
import type { Permiso, Rol } from '@/lib/types';

// ── Paleta de colores por índice ───────────────────────────────────────────────
const COLORS = [
  { icon: 'bg-purple-100 text-purple-600', badge: 'bg-purple-50 text-purple-600 border-purple-100' },
  { icon: 'bg-blue-100 text-blue-600',     badge: 'bg-blue-50 text-blue-600 border-blue-100'       },
  { icon: 'bg-indigo-100 text-indigo-600', badge: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  { icon: 'bg-teal-100 text-teal-600',     badge: 'bg-teal-50 text-teal-600 border-teal-100'       },
  { icon: 'bg-yellow-100 text-yellow-700', badge: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
  { icon: 'bg-cyan-100 text-cyan-600',     badge: 'bg-cyan-50 text-cyan-600 border-cyan-100'       },
];

const MODULO_COLORS: Record<string, string> = {
  USUARIOS:  'bg-blue-50   text-blue-700   border-blue-100',
  PACIENTES: 'bg-green-50  text-green-700  border-green-100',
  ROLES:     'bg-purple-50 text-purple-700 border-purple-100',
  BITACORA:  'bg-orange-50 text-orange-700 border-orange-100',
  AGENDA:    'bg-cyan-50   text-cyan-700   border-cyan-100',
  REPORTES:  'bg-rose-50   text-rose-700   border-rose-100',
  SISTEMA:   'bg-gray-100  text-gray-700   border-gray-200',
};
const moduloColor = (m: string) =>
  MODULO_COLORS[m?.toUpperCase()] ?? 'bg-gray-100 text-gray-600 border-gray-200';

// ── Modal Rol ─────────────────────────────────────────────────────────────────
interface ModalProps {
  rol: Rol | null;            // null = crear
  allPermisos: Permiso[];
  onClose: () => void;
  onSaved: () => void;
}

function RolModal({ rol, allPermisos, onClose, onSaved }: ModalProps) {
  const isEdit = rol !== null;

  const [form, setForm] = useState({
    nombre:      rol?.nombre      ?? '',
    descripcion: rol?.descripcion ?? '',
    activo:      rol?.activo      ?? true,
  });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(rol?.permisos?.map(p => p.id_permiso) ?? [])
  );
  const [errors,    setErrors]  = useState<Record<string, string>>({});
  const [loading,   setLoading] = useState(false);
  const [permSearch, setPermSearch] = useState('');

  const set = (k: string, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const togglePerm = (id: number) =>
    setSelectedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      let rolId: number;

      if (isEdit) {
        await rolesService.update(rol!.id_rol, {
          nombre:      form.nombre,
          descripcion: form.descripcion || undefined,
          activo:      form.activo,
        });
        rolId = rol!.id_rol;

        // Diff de permisos: añadir los nuevos, quitar los removidos
        const prev = new Set(rol!.permisos?.map(p => p.id_permiso) ?? []);
        const adds    = [...selectedIds].filter(id => !prev.has(id));
        const removes = [...prev].filter(id => !selectedIds.has(id));
        await Promise.all([
          ...adds.map(id    => rolesService.addPermiso(rolId, id)),
          ...removes.map(id => rolesService.removePermiso(rolId, id)),
        ]);
      } else {
        const created = await rolesService.create({
          nombre:      form.nombre,
          descripcion: form.descripcion || undefined,
        });
        rolId = created.id_rol;
        // Asignar permisos seleccionados al rol recién creado
        await Promise.all([...selectedIds].map(id => rolesService.addPermiso(rolId, id)));
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

  // Agrupar permisos por módulo, filtrados por búsqueda
  const filteredPermisos = allPermisos.filter(p =>
    !permSearch ||
    p.nombre.toLowerCase().includes(permSearch.toLowerCase()) ||
    p.modulo.toLowerCase().includes(permSearch.toLowerCase())
  );
  const grouped = filteredPermisos.reduce<Record<string, Permiso[]>>((acc, p) => {
    if (!acc[p.modulo]) acc[p.modulo] = [];
    acc[p.modulo].push(p);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <h3 className="text-[15px] font-bold text-gray-900">
              {isEdit ? 'Editar rol' : 'Nuevo rol'}
            </h3>
          </div>
          <button onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* Nombre */}
            <div>
              <label className="block text-[12.5px] font-medium text-gray-700 mb-1.5">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                placeholder="ej. Médico, Recepcionista..."
                className={`w-full h-10 px-3.5 rounded-xl border text-[13px] bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
                  ${errors.nombre ? 'border-red-300' : 'border-gray-200'}`}
              />
              {errors.nombre && (
                <p className="text-[11.5px] text-red-500 mt-1">{errors.nombre}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-[12.5px] font-medium text-gray-700 mb-1.5">
                Descripción
              </label>
              <textarea
                value={form.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                placeholder="Descripción del rol y sus responsabilidades..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] bg-gray-50 resize-none
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Activo — solo edición */}
            {isEdit && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={e => set('activo', e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-600"
                />
                <span className="text-[13px] text-gray-700">Rol activo</span>
              </label>
            )}

            {/* Permisos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12.5px] font-medium text-gray-700">
                  Permisos
                  {selectedIds.size > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold border border-blue-100">
                      {selectedIds.size} seleccionados
                    </span>
                  )}
                </label>
                {selectedIds.size > 0 && (
                  <button type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="text-[11.5px] text-gray-400 hover:text-red-500 transition-colors">
                    Limpiar
                  </button>
                )}
              </div>

              {allPermisos.length === 0 ? (
                <p className="text-[12.5px] text-gray-400 italic py-3 text-center">
                  No hay permisos disponibles
                </p>
              ) : (
                <>
                  {/* Buscador permisos */}
                  <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      value={permSearch}
                      onChange={e => setPermSearch(e.target.value)}
                      placeholder="Buscar permiso..."
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-gray-200 bg-gray-50 text-[12.5px]
                        focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  {/* Lista agrupada */}
                  <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                    {Object.entries(grouped).map(([modulo, perms]) => (
                      <div key={modulo}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${moduloColor(modulo)}`}>
                            {modulo}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {perms.filter(p => selectedIds.has(p.id_permiso)).length}/{perms.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                          {perms.map(p => (
                            <label key={p.id_permiso}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer
                                transition-colors select-none text-[12.5px]
                                ${selectedIds.has(p.id_permiso)
                                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                                  : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(p.id_permiso)}
                                onChange={() => togglePerm(p.id_permiso)}
                                className="w-3.5 h-3.5 accent-blue-600 flex-shrink-0"
                              />
                              <span className="truncate">{p.nombre}</span>
                              {selectedIds.has(p.id_permiso) && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 ml-auto flex-shrink-0" />
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    {Object.keys(grouped).length === 0 && (
                      <p className="text-[12px] text-gray-400 text-center py-4">Sin resultados</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2.5 px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-[13px] font-medium
                text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-1.5">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function RolesPage() {
  const [roles,       setRoles]       = useState<Rol[]>([]);
  const [allPermisos, setAllPermisos] = useState<Permiso[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [expanded,    setExpanded]    = useState<number | null>(null);
  const [modal, setModal] = useState<{ open: boolean; rol: Rol | null }>({ open: false, rol: null });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        rolesService.list(),
        rolesService.listarPermisos(),
      ]);
      setRoles(r);
      setAllPermisos(p.filter(p => p.activo));
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este rol? Se desasignará de todos los usuarios.')) return;
    try {
      await rolesService.delete(id);
      setRoles(prev => prev.filter(r => r.id_rol !== id));
    } catch {
      alert('No se pudo eliminar el rol.');
    }
  };

  const openCreate = () => setModal({ open: true, rol: null });
  const openEdit   = (rol: Rol) => setModal({ open: true, rol });
  const closeModal = () => setModal({ open: false, rol: null });
  const onSaved    = () => { closeModal(); fetchAll(); };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Roles</h2>
          <p className="text-[12.5px] text-gray-400 mt-0.5">
            Define el nivel de acceso de cada tipo de usuario
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white
            px-4 py-2 rounded-lg text-[13.5px] font-semibold transition-colors shadow-sm">
          <Plus className="w-4 h-4" strokeWidth={2.5} /> Nuevo Rol
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-[12px] text-gray-400 mb-1">Total roles</p>
          <p className="text-[30px] font-bold text-gray-900 leading-none">
            {loading ? '—' : roles.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-[12px] text-gray-400 mb-1">Roles activos</p>
          <p className="text-[30px] font-bold text-green-600 leading-none">
            {loading ? '—' : roles.filter(r => r.activo).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-[12px] text-gray-400 mb-1">Permisos totales</p>
          <p className="text-[30px] font-bold text-blue-600 leading-none">
            {loading ? '—' : roles.reduce((a, r) => a + (r.permisos?.length ?? 0), 0)}
          </p>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando roles...</span>
        </div>
      ) : roles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center
          justify-center py-20 gap-2">
          <Shield className="w-8 h-8 text-gray-200" />
          <p className="text-sm text-gray-400">No hay roles registrados</p>
          <button onClick={openCreate}
            className="mt-2 text-[12.5px] text-blue-500 hover:underline">
            Crear el primer rol
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {roles.map((rol, i) => {
            const C     = COLORS[i % COLORS.length];
            const isOpen = expanded === rol.id_rol;
            return (
              <div key={rol.id_rol}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 flex items-center gap-3">

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : rol.id_rol)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                    {isOpen
                      ? <ChevronDown  className="w-4 h-4 text-gray-500" />
                      : <ChevronRight className="w-4 h-4 text-gray-500" />}
                  </button>

                  {/* Icono */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${C.icon}`}>
                    <Shield className="w-[17px] h-[17px]" strokeWidth={1.8} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold text-gray-900">{rol.nombre}</span>
                      {rol.permisos && (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${C.badge}`}>
                          {rol.permisos.length} permisos
                        </span>
                      )}
                      {!rol.activo && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-400">
                          Inactivo
                        </span>
                      )}
                    </div>
                    {rol.descripcion && (
                      <p className="text-[12.5px] text-gray-400 mt-0.5 truncate">{rol.descripcion}</p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(rol)}
                      className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-blue-500"
                      title="Editar rol">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(rol.id_rol)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-400"
                      title="Eliminar rol">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Permisos expandidos */}
                {isOpen && rol.permisos && rol.permisos.length > 0 && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                      Permisos asignados
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      {rol.permisos.map(p => (
                        <div key={p.id_permiso}
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${moduloColor(p.modulo)}`}>
                            {p.modulo}
                          </span>
                          <span className="text-[12.5px] text-gray-700 truncate">{p.nombre}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isOpen && (!rol.permisos || rol.permisos.length === 0) && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50 text-center">
                    <p className="text-[12.5px] text-gray-400">Sin permisos asignados</p>
                    <button onClick={() => openEdit(rol)}
                      className="mt-1.5 text-[12px] text-blue-500 hover:underline">
                      Asignar permisos
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <RolModal
          rol={modal.rol}
          allPermisos={allPermisos}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
