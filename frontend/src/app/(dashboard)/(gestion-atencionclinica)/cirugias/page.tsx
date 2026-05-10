'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Hospital, Plus, Search, X, ChevronDown,
  AlertCircle, Loader2, Trash2, Edit2,
  User, Calendar, FileText, Activity,
  AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Play, Timer, ClipboardList,
  Stethoscope, Info, ShieldCheck,
} from 'lucide-react';
import {
  cirugiasService,
  type Cirugia,
  type CirugiaCreate,
  type CirugiaReprogramar,
} from '@/lib/services/cirugias';
import { fetchAll } from '@/lib/api';
import { historialService } from '@/lib/services/historial';
import { preoperatorioService } from '@/lib/services/preoperatorio';
import type { Paciente } from '@/lib/types';

// ── Interfaces auxiliares ───────────────────────────────────────────────────
interface HistoriaSimple {
  id_historia_clinica: number;
  id_paciente: number;
  motivo_apertura: string | null;
}

interface PreopSimple {
  id_preoperatorio: number;
  id_paciente: number;
  estado_preoperatorio: string;
  fecha_programada_cirugia: string | null;
}

// ── Configuración visual de estados ─────────────────────────────────────────
const ESTADO_CFG: Record<string, {
  bg: string; ring: string; icon: React.ElementType; label: string; dot: string;
}> = {
  PROGRAMADA:   { bg: 'bg-blue-50 text-blue-700 border-blue-200',      ring: 'ring-blue-200',   icon: Calendar,     label: 'Programada',   dot: 'bg-blue-500'    },
  REPROGRAMADA: { bg: 'bg-orange-50 text-orange-700 border-orange-200', ring: 'ring-orange-200', icon: RefreshCw,    label: 'Reprogramada', dot: 'bg-orange-500'  },
  EN_CURSO:     { bg: 'bg-amber-50 text-amber-700 border-amber-200',    ring: 'ring-amber-200',  icon: Play,         label: 'En curso',     dot: 'bg-amber-500'   },
  FINALIZADA:   { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', ring: 'ring-emerald-200', icon: CheckCircle2, label: 'Finalizada', dot: 'bg-emerald-500' },
  CANCELADA:    { bg: 'bg-red-50 text-red-700 border-red-200',          ring: 'ring-red-200',    icon: XCircle,      label: 'Cancelada',    dot: 'bg-red-500'     },
};

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CFG[estado] ?? ESTADO_CFG['PROGRAMADA'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg}`}>
      <Icon className="w-3 h-3" strokeWidth={2} />
      {cfg.label}
    </span>
  );
}

function formatFecha(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatFechaCorta(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// ── Estilos de campos ───────────────────────────────────────────────────────
const inputCls = (err?: string) =>
  `w-full h-10 px-3.5 rounded-xl border text-[13px] bg-gray-50
   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition
   ${err ? 'border-red-300 bg-red-50' : 'border-gray-200'}`;

const textareaCls = (err?: string) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-[13px] bg-gray-50 resize-none
   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition
   ${err ? 'border-red-300 bg-red-50' : 'border-gray-200'}`;

const selectCls = (err?: string) =>
  `w-full h-10 px-3.5 pr-9 rounded-xl border text-[13px] bg-gray-50 appearance-none
   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition
   ${err ? 'border-red-300 bg-red-50' : 'border-gray-200'}`;

function Field({
  label, required, error, children, hint,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <div>
      <label className="block text-[12.5px] font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
      {error && (
        <p className="text-[11.5px] text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

// ── Formulario vacío ─────────────────────────────────────────────────────────
const emptyForm = (): CirugiaCreate => ({
  id_paciente: 0,
  id_historia_clinica: 0,
  id_preoperatorio: null,
  id_cita: null,
  estado_cirugia: 'PROGRAMADA',
  fecha_programada: new Date().toISOString().slice(0, 16),
  fecha_real_inicio: null,
  fecha_real_fin: null,
  procedimiento: '',
  resultado: '',
  complicaciones: '',
  observaciones: '',
  motivo_reprogramacion: '',
});

// ═══════════════════════════════════════════════════════════════════════════
// MINI-MODAL REPROGRAMAR
// ═══════════════════════════════════════════════════════════════════════════
function ModalReprogramar({
  cirugia,
  pacienteNombre,
  onClose,
  onSaved,
}: {
  cirugia: Cirugia;
  pacienteNombre: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fechaProgramada, setFechaProgramada] = useState('');
  const [motivo,          setMotivo]          = useState('');
  const [errors,          setErrors]          = useState<Record<string, string>>({});
  const [saving,          setSaving]          = useState(false);
  const [apiError,        setApiError]        = useState('');

  function validate() {
    const e: Record<string, string> = {};
    if (!fechaProgramada) e.fecha_programada = 'La nueva fecha es obligatoria.';
    if (!motivo.trim())   e.motivo = 'Indica el motivo de la reprogramación.';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setApiError('');
    try {
      const payload: CirugiaReprogramar = {
        fecha_programada:       fechaProgramada,
        motivo_reprogramacion:  motivo.trim(),
      };
      await cirugiasService.reprogramar(cirugia.id_cirugia, payload);
      onSaved();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string; fecha_programada?: string[] } } })
          ?.response?.data?.detail ??
        (err as { response?: { data?: { fecha_programada?: string[] } } })
          ?.response?.data?.fecha_programada?.[0] ??
        'Error al reprogramar. Verifica los datos.';
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-orange-600" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Reprogramar cirugía</h2>
              <p className="text-[11px] text-gray-400">{pacienteNombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {apiError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-[12.5px] text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{apiError}
            </div>
          )}

          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <p className="text-[12.5px] text-orange-700 flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              El estado cambiará automáticamente a <strong className="mx-1">Reprogramada</strong> y se registrará en la bitácora.
            </p>
            <p className="text-[11.5px] text-orange-600 mt-1 ml-6">
              Fecha actual: {formatFechaCorta(cirugia.fecha_programada)}
            </p>
          </div>

          <Field label="Nueva fecha de cirugía" required error={errors.fecha_programada}>
            <input
              type="datetime-local"
              className={inputCls(errors.fecha_programada)}
              value={fechaProgramada}
              onChange={(e) => setFechaProgramada(e.target.value)}
            />
          </Field>

          <Field label="Motivo de reprogramación" required error={errors.motivo}>
            <textarea
              className={textareaCls(errors.motivo)}
              rows={3}
              placeholder="Ej: Paciente no disponible, equipo en mantenimiento, indicación médica…"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </Field>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Reprogramar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL CREAR / EDITAR
// ═══════════════════════════════════════════════════════════════════════════
function ModalCirugia({
  cirugia,
  pacientes,
  historias,
  preoperatorios,
  onClose,
  onSaved,
}: {
  cirugia: Cirugia | null;
  pacientes: Paciente[];
  historias: HistoriaSimple[];
  preoperatorios: PreopSimple[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!cirugia;

  const [form, setForm] = useState<CirugiaCreate>(() =>
    isEdit
      ? {
          id_paciente:          cirugia.id_paciente,
          id_historia_clinica:  cirugia.id_historia_clinica,
          id_preoperatorio:     cirugia.id_preoperatorio,
          id_cita:              cirugia.id_cita,
          estado_cirugia:       cirugia.estado_cirugia,
          fecha_programada:     cirugia.fecha_programada.slice(0, 16),
          fecha_real_inicio:    cirugia.fecha_real_inicio ? cirugia.fecha_real_inicio.slice(0, 16) : null,
          fecha_real_fin:       cirugia.fecha_real_fin    ? cirugia.fecha_real_fin.slice(0, 16)    : null,
          procedimiento:        cirugia.procedimiento,
          resultado:            cirugia.resultado            ?? '',
          complicaciones:       cirugia.complicaciones       ?? '',
          observaciones:        cirugia.observaciones        ?? '',
          motivo_reprogramacion: cirugia.motivo_reprogramacion ?? '',
        }
      : emptyForm(),
  );

  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState('');

  const historiasFiltradas = historias.filter((h) => h.id_paciente === form.id_paciente);
  const preopsFiltrados    = preoperatorios.filter((p) => p.id_paciente === form.id_paciente);

  const set = (field: keyof CirugiaCreate, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handlePacienteChange = (id: number) =>
    setForm((f) => ({
      ...f,
      id_paciente: id,
      id_historia_clinica: 0,
      id_preoperatorio: null,
    }));

  const estadoFinalizada  = form.estado_cirugia === 'FINALIZADA';
  const estadoReprogramada = form.estado_cirugia === 'REPROGRAMADA';

  function validate() {
    const e: Record<string, string> = {};
    if (!form.id_paciente)         e.id_paciente = 'Selecciona un paciente.';
    if (!form.id_historia_clinica) e.id_historia_clinica = 'Selecciona la historia clínica.';
    if (!form.fecha_programada)    e.fecha_programada = 'La fecha programada es obligatoria.';
    if (!form.procedimiento?.trim()) e.procedimiento = 'Describe el procedimiento quirúrgico.';

    if (estadoFinalizada) {
      if (!form.fecha_real_inicio)
        e.fecha_real_inicio = 'Requerida para marcar como Finalizada.';
      if (!form.fecha_real_fin)
        e.fecha_real_fin = 'Requerida para marcar como Finalizada.';
    }

    if (form.fecha_real_inicio && form.fecha_real_fin) {
      if (new Date(form.fecha_real_inicio) > new Date(form.fecha_real_fin)) {
        e.fecha_real_fin = 'Debe ser posterior a la fecha de inicio.';
      }
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setApiError('');
    try {
      const payload: CirugiaCreate = {
        ...form,
        procedimiento:        form.procedimiento.trim(),
        resultado:            form.resultado?.trim() || undefined,
        complicaciones:       form.complicaciones?.trim() || undefined,
        observaciones:        form.observaciones?.trim() || undefined,
        motivo_reprogramacion: form.motivo_reprogramacion?.trim() || undefined,
        id_preoperatorio:     form.id_preoperatorio || null,
        id_cita:              form.id_cita || null,
        fecha_real_inicio:    form.fecha_real_inicio || null,
        fecha_real_fin:       form.fecha_real_fin || null,
      };
      if (isEdit) {
        await cirugiasService.update(cirugia!.id_cirugia, payload);
      } else {
        await cirugiasService.create(payload);
      }
      onSaved();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const msg =
        (data?.detail as string) ??
        (data?.estado_cirugia as string[])?.join(' ') ??
        (data?.procedimiento as string[])?.join(' ') ??
        'Error al guardar. Verifica los datos.';
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Hospital className="w-4 h-4 text-indigo-600" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">
                {isEdit ? 'Editar cirugía' : 'Registrar cirugía'}
              </h2>
              <p className="text-[11px] text-gray-400">CU14 · Gestión quirúrgica oftalmológica</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {apiError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-[12.5px] text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{apiError}
            </div>
          )}

          {/* Aviso FINALIZADA sin fechas reales */}
          {estadoFinalizada && (!form.fecha_real_inicio || !form.fecha_real_fin) && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[12.5px] text-amber-700">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Para marcar como <strong className="mx-1">Finalizada</strong> debes ingresar la
              <strong className="mx-1">fecha real de inicio</strong> y
              <strong className="mx-1">fecha real de fin</strong>.
            </div>
          )}

          {/* ── Sección 1: Paciente y referencias ── */}
          <section>
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />Paciente y referencias
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Paciente" required error={errors.id_paciente}>
                <div className="relative">
                  <select className={selectCls(errors.id_paciente)} value={form.id_paciente || ''}
                    onChange={(e) => handlePacienteChange(Number(e.target.value))}>
                    <option value="">Seleccionar paciente…</option>
                    {pacientes.map((p) => (
                      <option key={p.id_paciente} value={p.id_paciente}>
                        {p.apellidos}, {p.nombres}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Historia clínica" required error={errors.id_historia_clinica}
                hint={!form.id_paciente ? 'Primero selecciona un paciente.' : undefined}>
                <div className="relative">
                  <select className={selectCls(errors.id_historia_clinica)} value={form.id_historia_clinica || ''}
                    onChange={(e) => set('id_historia_clinica', Number(e.target.value))}
                    disabled={!form.id_paciente}>
                    <option value="">Seleccionar historia…</option>
                    {historiasFiltradas.map((h) => (
                      <option key={h.id_historia_clinica} value={h.id_historia_clinica}>
                        HC #{h.id_historia_clinica}{h.motivo_apertura ? ` · ${h.motivo_apertura.slice(0, 30)}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </Field>

              {/* Vínculo CU13 → CU14 */}
              <Field label="Preoperatorio (opcional)"
                hint={
                  !form.id_paciente ? 'Primero selecciona un paciente.' :
                  preopsFiltrados.length === 0 ? 'Sin preoperatorios para este paciente.' : undefined
                }>
                <div className="relative">
                  <select className={selectCls()} value={form.id_preoperatorio ?? ''}
                    onChange={(e) => set('id_preoperatorio', e.target.value ? Number(e.target.value) : null)}
                    disabled={!form.id_paciente || preopsFiltrados.length === 0}>
                    <option value="">Sin vinculación a preoperatorio</option>
                    {preopsFiltrados.map((po) => (
                      <option key={po.id_preoperatorio} value={po.id_preoperatorio}>
                        Preop. #{po.id_preoperatorio} · {po.estado_preoperatorio}
                        {po.fecha_programada_cirugia ? ` · ${formatFechaCorta(po.fecha_programada_cirugia)}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </Field>

              {/* Estado */}
              <Field label="Estado" required error={errors.estado_cirugia}>
                <div className="relative">
                  <select className={selectCls(errors.estado_cirugia)} value={form.estado_cirugia}
                    onChange={(e) => set('estado_cirugia', e.target.value)}>
                    <option value="PROGRAMADA">Programada</option>
                    <option value="REPROGRAMADA">Reprogramada</option>
                    <option value="EN_CURSO">En curso</option>
                    <option value="FINALIZADA">Finalizada</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </Field>
            </div>
          </section>

          {/* ── Sección 2: Programación ── */}
          <section>
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />Programación
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Fecha programada" required error={errors.fecha_programada}>
                <input type="datetime-local" className={inputCls(errors.fecha_programada)}
                  value={form.fecha_programada} onChange={(e) => set('fecha_programada', e.target.value)} />
              </Field>
              <Field label="Fecha real de inicio" error={errors.fecha_real_inicio}
                hint={estadoFinalizada ? 'Requerida al finalizar.' : undefined}>
                <input type="datetime-local" className={inputCls(errors.fecha_real_inicio)}
                  value={form.fecha_real_inicio ?? ''}
                  onChange={(e) => set('fecha_real_inicio', e.target.value || null)} />
              </Field>
              <Field label="Fecha real de fin" error={errors.fecha_real_fin}
                hint={estadoFinalizada ? 'Requerida al finalizar.' : undefined}>
                <input type="datetime-local" className={inputCls(errors.fecha_real_fin)}
                  value={form.fecha_real_fin ?? ''}
                  onChange={(e) => set('fecha_real_fin', e.target.value || null)} />
              </Field>
            </div>
          </section>

          {/* ── Sección 3: Procedimiento (requerido) ── */}
          <section>
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" />Procedimiento quirúrgico
            </h3>
            <Field label="Descripción del procedimiento" required error={errors.procedimiento}
              hint="Tipo de cirugía, técnica, ojo(s) afectado(s), materiales utilizados.">
              <textarea className={textareaCls(errors.procedimiento)} rows={3}
                placeholder="Ej: Facoemulsificación con implante de lente intraocular (LIO) monofocal en ojo derecho. Técnica estándar…"
                value={form.procedimiento}
                onChange={(e) => set('procedimiento', e.target.value)} />
            </Field>
          </section>

          {/* ── Sección 4: Resultado y complicaciones ── */}
          <section>
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />Resultado y complicaciones
            </h3>
            <div className="space-y-3">
              <Field label="Resultado" hint="Resumen de resultados y evolución intraoperatoria.">
                <textarea className={textareaCls()} rows={3}
                  placeholder="Resultado del procedimiento, agudeza visual postoperatoria esperada, hallazgos intraoperatorios…"
                  value={form.resultado as string}
                  onChange={(e) => set('resultado', e.target.value)} />
              </Field>
              <Field label="Complicaciones">
                <textarea className={textareaCls()} rows={2}
                  placeholder="Rupturas, hemorragias, hipotensión, reacción a anestesia, pérdida de vítreo… (dejar vacío si no hubo)."
                  value={form.complicaciones as string}
                  onChange={(e) => set('complicaciones', e.target.value)} />
              </Field>
            </div>
          </section>

          {/* ── Sección 5: Observaciones y reprogramación ── */}
          <section>
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" />Observaciones
            </h3>
            <div className="space-y-3">
              <Field label="Observaciones médicas">
                <textarea className={textareaCls()} rows={2}
                  placeholder="Indicaciones postoperatorias, cuidados, medicamentos, próximo control…"
                  value={form.observaciones as string}
                  onChange={(e) => set('observaciones', e.target.value)} />
              </Field>
              {estadoReprogramada && (
                <Field label="Motivo de reprogramación" error={errors.motivo_reprogramacion}>
                  <textarea className={textareaCls(errors.motivo_reprogramacion)} rows={2}
                    placeholder="Razón por la que se reprogramó…"
                    value={form.motivo_reprogramacion as string}
                    onChange={(e) => set('motivo_reprogramacion', e.target.value)} />
                </Field>
              )}
            </div>
          </section>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="h-9 px-5 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="h-9 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium
                         flex items-center gap-2 transition-colors disabled:opacity-60">
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Guardando…</>
              ) : (
                <><ShieldCheck className="w-4 h-4" />{isEdit ? 'Guardar cambios' : 'Registrar cirugía'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TARJETA DE CIRUGÍA
// ═══════════════════════════════════════════════════════════════════════════
function CirugiaCard({
  cir,
  pacienteNombre,
  onEdit,
  onDelete,
  onReprogramar,
}: {
  cir: Cirugia;
  pacienteNombre: string;
  onEdit: () => void;
  onDelete: () => void;
  onReprogramar: () => void;
}) {
  const cfg = ESTADO_CFG[cir.estado_cirugia] ?? ESTADO_CFG['PROGRAMADA'];
  const mostrarFechasReales = cir.fecha_real_inicio || cir.fecha_real_fin;
  const tieneDuracion = cir.fecha_real_inicio && cir.fecha_real_fin;

  const duracionMin = tieneDuracion
    ? Math.round(
        (new Date(cir.fecha_real_fin!).getTime() - new Date(cir.fecha_real_inicio!).getTime()) / 60000,
      )
    : null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:border-gray-300 transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Ícono de estado */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg.split(' ').slice(0, 1).join(' ')}`}>
            <Hospital className={`w-5 h-5 ${cfg.bg.split(' ').slice(1, 2).join(' ')}`} strokeWidth={2} />
          </div>

          <div className="min-w-0 flex-1">
            {/* Paciente + badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] font-semibold text-gray-900 truncate">
                {pacienteNombre}
              </span>
              <EstadoBadge estado={cir.estado_cirugia} />
            </div>

            {/* Fecha programada */}
            <p className="text-[11.5px] text-gray-400 mt-0.5">
              <Calendar className="inline w-3 h-3 mr-1" />
              Prog. {formatFechaCorta(cir.fecha_programada)}
              {cir.id_preoperatorio && (
                <span className="ml-2 text-teal-500">· Preop. #{cir.id_preoperatorio}</span>
              )}
            </p>

            {/* Procedimiento (preview) */}
            <p className="text-[12.5px] text-gray-700 font-medium mt-1.5 line-clamp-2">
              {cir.procedimiento}
            </p>

            {/* Fechas reales + duración */}
            {mostrarFechasReales && (
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {cir.fecha_real_inicio && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                    <Play className="w-3 h-3 text-green-500" />
                    Inicio: {formatFecha(cir.fecha_real_inicio)}
                  </span>
                )}
                {cir.fecha_real_fin && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Fin: {formatFecha(cir.fecha_real_fin)}
                  </span>
                )}
                {duracionMin !== null && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200">
                    <Timer className="w-3 h-3" />
                    {duracionMin} min
                  </span>
                )}
              </div>
            )}

            {/* Reprogramación */}
            {cir.estado_cirugia === 'REPROGRAMADA' && cir.motivo_reprogramacion && (
              <div className="flex items-start gap-1.5 mt-2 p-2 bg-orange-50 rounded-xl border border-orange-200">
                <RefreshCw className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                <p className="text-[11.5px] text-orange-600 line-clamp-2">
                  <span className="font-medium">Motivo: </span>{cir.motivo_reprogramacion}
                </p>
              </div>
            )}

            {/* Complicaciones (si hay) */}
            {cir.complicaciones && (
              <div className="flex items-start gap-1.5 mt-2 p-2 bg-red-50 rounded-xl border border-red-200">
                <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-[11.5px] text-red-600 line-clamp-1">
                  <span className="font-medium">Complicaciones: </span>{cir.complicaciones}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Acciones hover */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Solo mostramos Reprogramar si no está cancelada/finalizada */}
          {!['FINALIZADA', 'CANCELADA'].includes(cir.estado_cirugia) && (
            <button onClick={onReprogramar}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-orange-500 hover:bg-orange-50 transition-colors"
              title="Reprogramar cirugía">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar cirugía">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 transition-colors"
            title="Eliminar cirugía">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL CONFIRMAR ELIMINACIÓN
// ═══════════════════════════════════════════════════════════════════════════
function ModalConfirmDelete({
  pacienteNombre, onConfirm, onCancel, loading,
}: {
  pacienteNombre: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">Eliminar cirugía</h3>
            <p className="text-[12px] text-gray-400">Esta acción no se puede deshacer.</p>
          </div>
        </div>
        <p className="text-[13px] text-gray-600 mb-5">
          ¿Confirmas que deseas eliminar la cirugía de{' '}
          <span className="font-semibold text-gray-900">{pacienteNombre}</span>?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 h-9 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export default function CirugiasPage() {
  const [cirugias,     setCirugias]     = useState<Cirugia[]>([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  const [pacientes,    setPacientes]    = useState<Paciente[]>([]);
  const [historias,    setHistorias]    = useState<HistoriaSimple[]>([]);
  const [preops,       setPreops]       = useState<PreopSimple[]>([]);
  const [pacienteMap,  setPacienteMap]  = useState<Record<number, string>>({});

  const [search,        setSearch]        = useState('');
  const [filtroEstado,  setFiltroEstado]  = useState('');

  const [showModal,       setShowModal]       = useState(false);
  const [editTarget,      setEditTarget]      = useState<Cirugia | null>(null);
  const [deleteTarget,    setDeleteTarget]    = useState<Cirugia | null>(null);
  const [reprogTarget,    setReprogTarget]    = useState<Cirugia | null>(null);
  const [deleting,        setDeleting]        = useState(false);

  // ── Cargar soporte ──────────────────────────────────────────────────────
  useEffect(() => {
    async function loadSupport() {
      try {
        const [pacRes, hisRes, preRes] = await Promise.all([
          fetchAll<Paciente>('/pacientes/'),
          historialService.list(),
          preoperatorioService.list(),
        ]);
        setPacientes(pacRes);
        const map: Record<number, string> = {};
        pacRes.forEach((p) => { map[p.id_paciente] = `${p.apellidos}, ${p.nombres}`; });
        setPacienteMap(map);
        setHistorias(
          hisRes.results.map((h) => ({
            id_historia_clinica: h.id_historia_clinica,
            id_paciente:         h.id_paciente,
            motivo_apertura:     h.motivo_apertura ?? null,
          })),
        );
        setPreops(
          preRes.results.map((p) => ({
            id_preoperatorio:        p.id_preoperatorio,
            id_paciente:             p.id_paciente,
            estado_preoperatorio:    p.estado_preoperatorio,
            fecha_programada_cirugia: p.fecha_programada_cirugia,
          })),
        );
      } catch {
        // no bloquea la página
      }
    }
    loadSupport();
  }, []);

  // ── Cargar cirugías ─────────────────────────────────────────────────────
  const loadCirugias = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await cirugiasService.list({
        search:          search || undefined,
        estado_cirugia:  filtroEstado || undefined,
      });
      setCirugias(res.results);
      setTotal(res.count);
    } catch {
      setError('No se pudieron cargar las cirugías.');
    } finally {
      setLoading(false);
    }
  }, [search, filtroEstado]);

  useEffect(() => {
    const timer = setTimeout(loadCirugias, 300);
    return () => clearTimeout(timer);
  }, [loadCirugias]);

  // ── Stats ───────────────────────────────────────────────────────────────
  const stats = {
    total:       cirugias.length,
    programadas: cirugias.filter((c) => c.estado_cirugia === 'PROGRAMADA').length,
    enCurso:     cirugias.filter((c) => c.estado_cirugia === 'EN_CURSO').length,
    finalizadas: cirugias.filter((c) => c.estado_cirugia === 'FINALIZADA').length,
    canceladas:  cirugias.filter((c) => c.estado_cirugia === 'CANCELADA').length,
  };

  const handleSaved = () => { setShowModal(false); setEditTarget(null); loadCirugias(); };
  const handleReprogSaved = () => { setReprogTarget(null); loadCirugias(); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await cirugiasService.destroy(deleteTarget.id_cirugia);
      setDeleteTarget(null);
      loadCirugias();
    } catch { setDeleting(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Hospital className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-gray-900 leading-tight">Cirugías</h1>
              <p className="text-[12px] text-gray-400">CU14 · Gestión de procedimientos quirúrgicos oftalmológicos</p>
            </div>
          </div>
          <button
            onClick={() => { setEditTarget(null); setShowModal(true); }}
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium
                       flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />Registrar cirugía
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total',       value: stats.total,       icon: Activity,     color: 'bg-indigo-50 text-indigo-600'   },
            { label: 'Programadas', value: stats.programadas, icon: Calendar,     color: 'bg-blue-50 text-blue-600'       },
            { label: 'En curso',    value: stats.enCurso,     icon: Play,         color: 'bg-amber-50 text-amber-600'     },
            { label: 'Finalizadas', value: stats.finalizadas, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-4 h-4" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[20px] font-bold text-gray-900 leading-none">{value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por paciente, procedimiento, resultado…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-[13px] bg-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="relative sm:w-52">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full h-10 pl-3.5 pr-9 rounded-xl border border-gray-200 text-[13px] bg-white appearance-none
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            >
              <option value="">Todos los estados</option>
              <option value="PROGRAMADA">Programada</option>
              <option value="REPROGRAMADA">Reprogramada</option>
              <option value="EN_CURSO">En curso</option>
              <option value="FINALIZADA">Finalizada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[13px]">Cargando cirugías…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-[13px]">{error}</p>
            <button onClick={loadCirugias} className="ml-auto text-[12px] underline hover:no-underline">Reintentar</button>
          </div>
        )}

        {/* Lista */}
        {!loading && !error && (
          <>
            {cirugias.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Hospital className="w-7 h-7 text-gray-300" strokeWidth={1.5} />
                </div>
                <p className="text-[14px] font-medium text-gray-500">
                  {search || filtroEstado ? 'Sin resultados para este filtro' : 'Aún no hay cirugías registradas'}
                </p>
                {!search && !filtroEstado && (
                  <p className="text-[12px] text-gray-400 mt-1">Registra la primera con el botón de arriba.</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[12px] text-gray-400 px-1">
                  {total} cirugía{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
                </p>
                {cirugias.map((cir) => (
                  <CirugiaCard
                    key={cir.id_cirugia}
                    cir={cir}
                    pacienteNombre={pacienteMap[cir.id_paciente] ?? `Paciente #${cir.id_paciente}`}
                    onEdit={() => { setEditTarget(cir); setShowModal(true); }}
                    onDelete={() => setDeleteTarget(cir)}
                    onReprogramar={() => setReprogTarget(cir)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal crear/editar */}
      {showModal && (
        <ModalCirugia
          cirugia={editTarget}
          pacientes={pacientes}
          historias={historias}
          preoperatorios={preops}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Mini-modal reprogramar */}
      {reprogTarget && (
        <ModalReprogramar
          cirugia={reprogTarget}
          pacienteNombre={pacienteMap[reprogTarget.id_paciente] ?? `Paciente #${reprogTarget.id_paciente}`}
          onClose={() => setReprogTarget(null)}
          onSaved={handleReprogSaved}
        />
      )}

      {/* Modal eliminar */}
      {deleteTarget && (
        <ModalConfirmDelete
          pacienteNombre={pacienteMap[deleteTarget.id_paciente] ?? `Paciente #${deleteTarget.id_paciente}`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
