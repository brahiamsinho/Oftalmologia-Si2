'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, Search, FileText,
  Loader2, X, AlertCircle, Hash,
  ChevronRight, Plus, Eye, Edit2, Shield, Calendar, User, AlignLeft
} from 'lucide-react';
import { historialService, pacientesService } from '@/lib/services';
import type { HistoriaClinica, HistoriaClinicaCreate, HistoriaClinicaDetalle } from '@/lib/services/historial';
import type { Paciente } from '@/lib/types';

const ESTADO_STYLE: Record<string, string> = {
  ACTIVA:    'bg-green-50 text-green-700 border-green-100',
  CERRADA:   'bg-gray-100 text-gray-500 border-gray-200',
  ARCHIVADA: 'bg-orange-50 text-orange-700 border-orange-100',
};

function DetalleModal({ 
  historia, 
  onClose 
}: { 
  historia: HistoriaClinica; 
  onClose: () => void; 
}) {
  const [detalle, setDetalle] = useState<HistoriaClinicaDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    historialService.get(historia.id_historia_clinica)
      .then(setDetalle)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [historia.id_historia_clinica]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-gray-900">
                Historial: {historia.paciente_nombre}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-[12px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                  HC-{historia.id_paciente}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border
                  ${ESTADO_STYLE[historia.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                  {historia.estado}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : !detalle ? (
            <div className="text-red-500 text-sm">Error cargando detalles.</div>
          ) : (
            <>
              {/* Información */}
              <Section title="Apertura y Motivo">
                <Row icon={Calendar} label="Fecha de Apertura">
                  {new Date(detalle.fecha_apertura).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </Row>
                <Row icon={FileText} label="Motivo de Apertura">
                  {detalle.motivo_apertura || 'No especificado'}
                </Row>
                <Row icon={AlignLeft} label="Observaciones">
                  {detalle.observaciones || 'Ninguna'}
                </Row>
              </Section>
              
              <Section title="Antecedentes">
                {detalle.antecedentes.length > 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-700">
                    Hay {detalle.antecedentes.length} antecedente(s) registrado(s).
                  </div>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-400">Sin antecedentes registrados</div>
                )}
              </Section>

              <Section title="Diagnósticos">
                {detalle.diagnosticos.length > 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-700">
                    Hay {detalle.diagnosticos.length} diagnóstico(s) registrado(s).
                  </div>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-400">Sin diagnósticos</div>
                )}
              </Section>

              <Section title="Evoluciones">
                {detalle.evoluciones.length > 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-700">
                    Hay {detalle.evoluciones.length} evolución(es) registrada(s).
                  </div>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-400">Sin evoluciones</div>
                )}
              </Section>

              <Section title="Recetas">
                {detalle.recetas.length > 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-700">
                    Hay {detalle.recetas.length} receta(s) emitidas.
                  </div>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-400">Sin recetas</div>
                )}
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateUpdateModal({
  historia,
  onClose,
  onSuccess
}: {
  historia?: HistoriaClinica;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [form, setForm] = useState<HistoriaClinicaCreate>({
    id_paciente: historia?.id_paciente || 0,
    estado: historia?.estado || 'ACTIVA',
    motivo_apertura: historia?.motivo_apertura || '',
    observaciones: historia?.observaciones || ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!historia) {
      pacientesService.list().then(res => setPacientes(res.results)).catch(console.error);
    }
  }, [historia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id_paciente) return alert('Seleccione un paciente');
    setSaving(true);
    try {
      if (historia) {
        await historialService.update(historia.id_historia_clinica, form);
      } else {
        await historialService.create(form);
      }
      onSuccess();
    } catch (err: any) {
      alert('Error guardando historia clínica: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">{historia ? 'Editar Historia' : 'Nueva Historia'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!historia && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Paciente</label>
              <select
                required
                value={form.id_paciente}
                onChange={e => setForm({ ...form, id_paciente: Number(e.target.value) })}
                className="w-full text-sm rounded-lg border border-gray-200 p-2.5 focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Seleccionar paciente...</option>
                {pacientes.map(p => (
                  <option key={p.id_paciente} value={p.id_paciente}>{p.nombres} {p.apellidos}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Motivo de Apertura</label>
            <textarea
              className="w-full text-sm rounded-lg border border-gray-200 p-2.5 focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={form.motivo_apertura}
              onChange={e => setForm({ ...form, motivo_apertura: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Estado</label>
            <select
              value={form.estado}
              onChange={e => setForm({ ...form, estado: e.target.value })}
              className="w-full text-sm rounded-lg border border-gray-200 p-2.5 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIVA">ACTIVA</option>
              <option value="CERRADA">CERRADA</option>
              <option value="ARCHIVADA">ARCHIVADA</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Observaciones</label>
            <textarea
              className="w-full text-sm rounded-lg border border-gray-200 p-2.5 focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={form.observaciones}
              onChange={e => setForm({ ...form, observaciones: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-50 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-100">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{title}</p>
      <div className="bg-gray-50/60 rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Row({
  icon: Icon, label, children,
}: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
        <p className="text-[13px] text-gray-800 font-medium">{children}</p>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function HistorialClinicoPage() {
  const [historias, setHistorias] = useState<HistoriaClinica[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [viewModal, setViewModal] = useState<HistoriaClinica | null>(null);
  const [editModal, setEditModal] = useState<HistoriaClinica | null>(null);
  const [createModal, setCreateModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await historialService.list({ search: search || undefined });
      setHistorias(res.results);
      setTotal(res.count);
    } catch {
      setHistorias([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Historial Clínico</h2>
          <p className="text-[12.5px] text-gray-400 mt-0.5">Gestión integral de expedientes</p>
        </div>
        <button 
          onClick={() => setCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Nuevo Historial
        </button>
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o paciente..."
          className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-gray-200 bg-white text-[13px]
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : historias.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20 gap-2">
          <ClipboardList className="w-8 h-8 text-gray-200" />
          <p className="text-sm text-gray-400">No se encontraron historiales</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Paciente</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">Apertura</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Motivo</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historias.map(h => (
                <tr key={h.id_historia_clinica} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-[11px]">
                        HC
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">{h.paciente_nombre}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-[13px] text-gray-600">
                    {new Date(h.fecha_apertura).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-600 truncate max-w-[200px]">
                    {h.motivo_apertura || '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border
                      ${ESTADO_STYLE[h.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                      {h.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-2 text-gray-400">
                      <button onClick={() => setViewModal(h)} className="p-1.5 hover:bg-gray-100 hover:text-blue-600 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditModal(h)} className="p-1.5 hover:bg-gray-100 hover:text-orange-500 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40">
            <p className="text-[12px] text-gray-400">Total: {total}</p>
          </div>
        </div>
      )}

      {/* Modals */}
      {viewModal && <DetalleModal historia={viewModal} onClose={() => setViewModal(null)} />}
      
      {(createModal || editModal) && (
        <CreateUpdateModal 
          historia={editModal || undefined} 
          onClose={() => { setCreateModal(false); setEditModal(null); }} 
          onSuccess={() => { setCreateModal(false); setEditModal(null); fetchData(); }} 
        />
      )}
    </div>
  );
}