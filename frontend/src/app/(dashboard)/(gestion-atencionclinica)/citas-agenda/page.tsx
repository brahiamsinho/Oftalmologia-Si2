'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon, Clock, User, Stethoscope, Search,
  Loader2, X, Plus, Edit2, Trash2, CalendarDays, Shield, Filter
} from 'lucide-react';
import {
  citasService, pacientesService, especialistasService
} from '@/lib/services';
import type { Cita, CitaCreate, TipoCita } from '@/lib/services/citas';
import type { Paciente } from '@/lib/types';
import type { Especialista } from '@/lib/services/especialistas';

const ESTADOS = [
  'PROGRAMADA', 'CONFIRMADA', 'REPROGRAMADA', 'CANCELADA', 'ATENDIDA', 'NO_ASISTIO'
];

const ESTADO_STYLE: Record<string, string> = {
  PROGRAMADA:   'bg-blue-50 text-blue-700 border-blue-100',
  CONFIRMADA:   'bg-emerald-50 text-emerald-700 border-emerald-100',
  REPROGRAMADA: 'bg-orange-50 text-orange-700 border-orange-100',
  CANCELADA:    'bg-red-50 text-red-700 border-red-100',
  ATENDIDA:     'bg-indigo-50 text-indigo-700 border-indigo-100',
  NO_ASISTIO:   'bg-gray-100 text-gray-600 border-gray-200',
};

// Formatear fechas locales (para inputs type="datetime-local")
function toLocalISOString(dateStr: string) {
  const d = new Date(dateStr);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function CreateUpdateModal({
  cita,
  onClose,
  onSuccess
}: {
  cita?: Cita;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [especialistas, setEspecialistas] = useState<Especialista[]>([]);
  const [tiposCita, setTiposCita] = useState<TipoCita[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [form, setForm] = useState<CitaCreate>({
    id_paciente: cita?.id_paciente || 0,
    id_especialista: cita?.id_especialista || 0,
    id_tipo_cita: cita?.id_tipo_cita || 0,
    fecha_hora_inicio: cita?.fecha_hora_inicio ? toLocalISOString(cita.fecha_hora_inicio) : '',
    fecha_hora_fin: cita?.fecha_hora_fin ? toLocalISOString(cita.fecha_hora_fin) : '',
    estado: cita?.estado || 'PROGRAMADA',
    motivo: cita?.motivo || '',
    observaciones: cita?.observaciones || ''
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      pacientesService.list().then(res => setPacientes(res.results)),
      especialistasService.list().then(res => setEspecialistas(res.results)),
      citasService.listTipos().then(res => setTiposCita(res.results))
    ]).finally(() => setLoadingConfig(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id_paciente) return alert('Seleccione un paciente');
    if (!form.id_especialista) return alert('Seleccione un especialista');
    if (!form.id_tipo_cita) return alert('Seleccione el tipo de cita');
    if (!form.fecha_hora_inicio || !form.fecha_hora_fin) return alert('Fechas incompletas');

    setSaving(true);
    try {
      if (cita) {
        await citasService.update(cita.id_cita, form);
      } else {
        await citasService.create(form);
      }
      onSuccess();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { detail?: string; [key: string]: unknown } }; message?: string };
      alert('Error guardando cita: ' + (errorResponse.response?.data?.detail || JSON.stringify(errorResponse.response?.data) || errorResponse.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col my-8">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-[16px] text-gray-900">{cita ? 'Editar Cita' : 'Agendar Cita'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingConfig ? (
           <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Paciente y Especialista */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Paciente</label>
                  <select
                    required
                    value={form.id_paciente}
                    onChange={e => setForm({ ...form, id_paciente: Number(e.target.value) })}
                    className="w-full text-[13px] rounded-xl border border-gray-200 p-2.5 focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                  >
                    <option value={0}>Seleccionar paciente...</option>
                    {pacientes.map(p => (
                      <option key={p.id_paciente} value={p.id_paciente}>{p.nombres} {p.apellidos}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Especialista</label>
                  <select
                    required
                    value={form.id_especialista}
                    onChange={e => setForm({ ...form, id_especialista: Number(e.target.value) })}
                    className="w-full text-[13px] rounded-xl border border-gray-200 p-2.5 focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                  >
                    <option value={0}>Seleccionar especialista...</option>
                    {especialistas.map(e => (
                      <option key={e.id_especialista} value={e.id_especialista}>{e.usuario_nombre} ({e.especialidad})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tipo de Cita</label>
                  <select
                    required
                    value={form.id_tipo_cita}
                    onChange={e => setForm({ ...form, id_tipo_cita: Number(e.target.value) })}
                    className="w-full text-[13px] rounded-xl border border-gray-200 p-2.5 focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                  >
                    <option value={0}>Tipo de consulta...</option>
                    {tiposCita.map(tc => (
                      <option key={tc.id_tipo_cita} value={tc.id_tipo_cita}>{tc.nombre_display}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fechas y Estados */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Fecha y Hora (Inicio)</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.fecha_hora_inicio}
                    onChange={e => setForm({ ...form, fecha_hora_inicio: e.target.value })}
                    className="w-full text-[13px] rounded-xl border border-gray-200 p-2.5 focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Fecha y Hora (Fin)</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.fecha_hora_fin}
                    onChange={e => setForm({ ...form, fecha_hora_fin: e.target.value })}
                    className="w-full text-[13px] rounded-xl border border-gray-200 p-2.5 focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Estado</label>
                  <select
                    value={form.estado}
                    onChange={e => setForm({ ...form, estado: e.target.value })}
                    className="w-full text-[13px] rounded-xl border border-gray-200 p-2.5 focus:ring-2 focus:ring-blue-500 bg-gray-50/50 font-medium text-gray-700"
                  >
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Motivo / Notas rápidas</label>
                <textarea
                  className="w-full text-[13px] rounded-xl border border-gray-200 p-3 focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                  rows={2}
                  value={form.motivo}
                  onChange={e => setForm({ ...form, motivo: e.target.value })}
                  placeholder="Razón por la que asiste el paciente..."
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Observaciones adicionales</label>
                <textarea
                  className="w-full text-[13px] rounded-xl border border-gray-200 p-3 focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                  rows={2}
                  value={form.observaciones}
                  onChange={e => setForm({ ...form, observaciones: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-5 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
              <button type="button" onClick={onClose}
                className="flex-1 bg-white border border-gray-200 text-gray-700 rounded-xl py-2.5 text-[13px] font-semibold hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-[13px] font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
                {saving ? 'Guardando...' : (cita ? 'Actualizar Cita' : 'Agendar Cita')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Componente Principal ───────────────────────────────────────────────────────
export default function CitasAgendaPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  
  const [editModal, setEditModal] = useState<Cita | null>(null);
  const [createModal, setCreateModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await citasService.list({ 
        search: search || undefined,
        estado: filterEstado || undefined
      });
      setCitas(res.results);
      setTotal(res.count);
    } catch {
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterEstado]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de cancelar/eliminar esta cita?')) return;
    try {
      await citasService.delete(id);
      fetchData();
    } catch (e: unknown) {
      const eResponse = e as { message?: string };
      alert('Error: No se pudo eliminar. ' + eResponse.message);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-extrabold text-gray-900 tracking-tight">Citas y Agenda Médica</h2>
          <p className="text-[13.5px] text-gray-500 mt-1">Programación y seguimiento del calendario de especialistas</p>
        </div>
        <button 
          onClick={() => setCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-200"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} /> agendar Cita
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: 'Total Citas',  value: loading ? '—' : total, icon: CalendarDays, color: 'text-gray-900', bg: 'bg-gray-100' },
          { label: 'Programadas',  value: loading ? '—' : citas.filter(c => c.estado === 'PROGRAMADA').length, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Confirmadas',  value: loading ? '—' : citas.filter(c => c.estado === 'CONFIRMADA').length, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Canceladas',   value: loading ? '—' : citas.filter(c => c.estado === 'CANCELADA').length, icon: X, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 lg:p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-[26px] font-black leading-none mt-1 ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar paciente, especialista..."
            className="w-full h-[42px] pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm" 
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select 
            value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
            className="w-full h-[42px] pl-10 pr-8 rounded-xl border border-gray-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* ── Lista de Citas (Card View) ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-[14px] font-medium">Cargando agenda...</span>
        </div>
      ) : citas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-24 gap-3">
          <CalendarDays className="w-10 h-10 text-gray-200" />
          <div className="text-center">
            <p className="text-[15px] font-semibold text-gray-900">No hay citas en la agenda</p>
            <p className="text-[13px] text-gray-500 mt-1 pb-4">No se encontraron registros activos para sus filtros.</p>
          </div>
          {(search || filterEstado) && (
            <button onClick={() => { setSearch(''); setFilterEstado(''); }} className="text-[13px] font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg">
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {citas.map(cita => (
            <div key={cita.id_cita} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
              
              {/* Header de la Tarjeta */}
              <div className="p-4 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-200/50 px-2 py-0.5 rounded">
                      {cita.tipo_cita_nombre}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border
                      ${ESTADO_STYLE[cita.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                      {cita.estado_display}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[15px] font-bold text-gray-900">
                    {new Date(cita.fecha_hora_inicio).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                    <span className="text-gray-300 font-normal">|</span>
                    <span className="text-blue-600 font-black">
                      {new Date(cita.fecha_hora_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <button onClick={() => setEditModal(cita)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cita.id_cita)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body de la Tarjeta */}
              <div className="p-4 flex-1 space-y-4">
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Paciente</p>
                    <p className="text-[13.5px] font-semibold text-gray-900 truncate">{cita.paciente_nombre}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Especialista</p>
                    <p className="text-[13.5px] font-semibold text-gray-900 truncate">{cita.especialista_nombre}</p>
                  </div>
                </div>

                {cita.motivo && (
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Motivo</p>
                    <p className="text-[12.5px] text-gray-700 leading-relaxed line-clamp-2">{cita.motivo}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {(createModal || editModal) && (
        <CreateUpdateModal 
          cita={editModal || undefined} 
          onClose={() => { setCreateModal(false); setEditModal(null); }} 
          onSuccess={() => { setCreateModal(false); setEditModal(null); fetchData(); }} 
        />
      )}
    </div>
  );
}