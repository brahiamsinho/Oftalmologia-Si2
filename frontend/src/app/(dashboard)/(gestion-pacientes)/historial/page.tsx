'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, Search, FileText,
  Loader2, X, AlertCircle, Hash,
  ChevronRight, Plus, Eye, Edit2, Shield, Calendar, User, AlignLeft
} from 'lucide-react';
import axios from 'axios';
import { fetchAll } from '@/lib/api';
import { historialService } from '@/lib/services';
import type { HistoriaClinica, HistoriaClinicaCreate, HistoriaClinicaDetalle } from '@/lib/services/historial';
import type { Paciente } from '@/lib/types';

function formatHistoriaApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'No se pudo guardar la historia clínica.';
  const o = data as Record<string, unknown>;
  if (typeof o.detail === 'string') return o.detail;
  const parts: string[] = [];
  for (const [k, v] of Object.entries(o)) {
    if (k === 'non_field_errors' && Array.isArray(v)) {
      parts.push(v.map(String).join(' '));
    } else if (Array.isArray(v)) {
      parts.push(`${k}: ${v.map(String).join(', ')}`);
    } else if (typeof v === 'string') {
      parts.push(`${k}: ${v}`);
    }
  }
  return parts.length ? parts.join(' ') : 'Revisá los datos e intentá de nuevo.';
}

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
  pacienteIdsConHistoria,
  onClose,
  onSuccess,
}: {
  historia?: HistoriaClinica;
  /** Pacientes que ya tienen historia (modelo OneToOne: solo una HC por paciente). */
  pacienteIdsConHistoria: Set<number>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [form, setForm] = useState<HistoriaClinicaCreate>({
    id_paciente: historia?.id_paciente || 0,
    estado: historia?.estado || 'ACTIVA',
    motivo_apertura: historia?.motivo_apertura ?? '',
    observaciones: historia?.observaciones ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!historia) {
      fetchAll<Paciente>('/pacientes/')
        .then(setPacientes)
        .catch(console.error);
    }
  }, [historia]);

  const pacienteYaTieneHistoria = (id: number) =>
    pacienteIdsConHistoria.has(id) && (!historia || id !== historia.id_paciente);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!historia && (!form.id_paciente || pacienteYaTieneHistoria(form.id_paciente))) {
      setFormError('Elegí un paciente que aún no tenga historia clínica.');
      return;
    }
    setSaving(true);
    try {
      if (historia) {
        await historialService.update(historia.id_historia_clinica, form);
      } else {
        await historialService.create(form);
      }
      onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        setFormError(formatHistoriaApiError(err.response.data));
      } else {
        setFormError('Error de red o del servidor.');
      }
    } finally {
      setSaving(false);
    }
  };

  const fieldCls =
    'w-full text-[13px] rounded-xl border border-gray-200 bg-gray-50 text-gray-900 px-3.5 py-2.5 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ' +
    '[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_rgb(249,250,251)] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain
        bg-black/40 backdrop-blur-sm px-3 py-8 sm:items-center sm:py-10 sm:px-4"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border border-gray-100
          max-h-[min(92dvh,720px)] my-auto"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <h3 className="text-[15px] font-bold text-gray-900">
            {historia ? 'Editar historia clínica' : 'Nueva historia clínica'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            {formError && (
              <div className="flex gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {!historia && (
              <div>
                <label className="block text-[12.5px] font-medium text-gray-700 mb-1.5">Paciente</label>
                <select
                  required
                  value={form.id_paciente || ''}
                  onChange={(e) =>
                    setForm({ ...form, id_paciente: Number(e.target.value) || 0 })
                  }
                  className={`${fieldCls} appearance-none pr-9`}
                >
                  <option value="">Seleccionar paciente…</option>
                  {pacientes.map((p) => {
                    const blocked = pacienteYaTieneHistoria(p.id_paciente);
                    return (
                      <option key={p.id_paciente} value={p.id_paciente} disabled={blocked}>
                        {p.nombres} {p.apellidos}
                        {blocked ? ' — ya tiene historia' : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="mt-2 text-[11.5px] text-gray-400 leading-relaxed">
                  En el sistema cada paciente tiene una sola historia clínica. Si ya figura en la tabla,
                  usá <strong>Editar</strong> en esa fila.
                </p>
                {pacientes.length > 0 &&
                  pacientes.every((p) => pacienteYaTieneHistoria(p.id_paciente)) && (
                    <p className="mt-2 text-[12px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      Todos los pacientes ya tienen historia. Podés crear un paciente nuevo en{' '}
                      <strong>Pacientes</strong> o editar un expediente existente desde la tabla.
                    </p>
                  )}
              </div>
            )}

            <div>
              <label className="block text-[12.5px] font-medium text-gray-700 mb-1.5">
                Motivo de apertura
              </label>
              <textarea
                className={`${fieldCls} resize-y min-h-[80px] max-h-36`}
                rows={3}
                value={form.motivo_apertura ?? ''}
                onChange={(e) => setForm({ ...form, motivo_apertura: e.target.value })}
                placeholder="Motivo principal de la apertura del expediente…"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-gray-700 mb-1.5">Estado</label>
              <select
                value={form.estado ?? 'ACTIVA'}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className={fieldCls}
              >
                <option value="ACTIVA">Activa</option>
                <option value="CERRADA">Cerrada</option>
                <option value="ARCHIVADA">Archivada</option>
              </select>
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-gray-700 mb-1.5">Observaciones</label>
              <textarea
                className={`${fieldCls} resize-y min-h-[72px] max-h-32`}
                rows={3}
                value={form.observaciones ?? ''}
                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                placeholder="Notas adicionales (opcional)…"
              />
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 disabled:opacity-55 transition-colors flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Guardando…' : 'Guardar'}
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
          pacienteIdsConHistoria={new Set(historias.map((h) => h.id_paciente))}
          onClose={() => {
            setCreateModal(false);
            setEditModal(null);
          }}
          onSuccess={() => {
            setCreateModal(false);
            setEditModal(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}