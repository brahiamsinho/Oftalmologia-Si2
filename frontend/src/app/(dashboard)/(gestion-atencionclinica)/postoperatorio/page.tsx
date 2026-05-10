'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  HeartPulse, Plus, Search, X, ChevronDown,
  AlertCircle, Loader2, Trash2, Edit2,
  User, Calendar, AlertTriangle, CheckCircle2,
  XCircle, Eye, Clock, Info, Bell,
  ShieldCheck, ArrowRight, Activity,
} from 'lucide-react';
import {
  postoperatorioService,
  type Postoperatorio,
  type PostoperatorioCreate,
} from '@/lib/services/postoperatorio';
import { fetchAll } from '@/lib/api';
import { historialService } from '@/lib/services/historial';
import { cirugiasService } from '@/lib/services/cirugias';
import type { Paciente } from '@/lib/types';

// ── Interfaces auxiliares ───────────────────────────────────────────────────
interface HistoriaSimple {
  id_historia_clinica: number;
  id_paciente: number;
  motivo_apertura: string | null;
}

interface CirugiaSimple {
  id_cirugia: number;
  id_paciente: number;
  procedimiento: string;
  fecha_programada: string;
  estado_cirugia: string;
}

// ── Config visual de estados ─────────────────────────────────────────────────
const ESTADO_CFG: Record<string, {
  bg: string; icon: React.ElementType; label: string; barColor: string;
}> = {
  ESTABLE:        { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Estable',        barColor: 'bg-emerald-500' },
  EN_OBSERVACION: { bg: 'bg-blue-50 text-blue-700 border-blue-200',          icon: Eye,          label: 'En observación', barColor: 'bg-blue-500'    },
  COMPLICADO:     { bg: 'bg-red-50 text-red-700 border-red-200',             icon: AlertTriangle, label: 'Complicado',    barColor: 'bg-red-500'     },
  CERRADO:        { bg: 'bg-gray-100 text-gray-500 border-gray-200',         icon: XCircle,      label: 'Cerrado',        barColor: 'bg-gray-400'    },
};

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CFG[estado] ?? ESTADO_CFG['EN_OBSERVACION'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg}`}>
      <Icon className="w-3 h-3" strokeWidth={2} />{cfg.label}
    </span>
  );
}

function formatFecha(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatFechaHora(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Días restantes hasta el próximo control */
function diasHastaControl(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Estilos de campos ───────────────────────────────────────────────────────
const inputCls = (err?: string) =>
  `w-full h-10 px-3.5 rounded-xl border text-[13px] bg-gray-50
   focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition
   ${err ? 'border-red-300 bg-red-50' : 'border-gray-200'}`;

const textareaCls = (err?: string) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-[13px] bg-gray-50 resize-none
   focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition
   ${err ? 'border-red-300 bg-red-50' : 'border-gray-200'}`;

const selectCls = (err?: string) =>
  `w-full h-10 px-3.5 pr-9 rounded-xl border text-[13px] bg-gray-50 appearance-none
   focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition
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
const emptyForm = (): PostoperatorioCreate => ({
  id_paciente: 0,
  id_historia_clinica: 0,
  id_cirugia: null,
  estado_postoperatorio: 'EN_OBSERVACION',
  fecha_control: new Date().toISOString().slice(0, 16),
  proximo_control: null,
  alertas: '',
  observaciones: '',
});

// ═══════════════════════════════════════════════════════════════════════════
// MODAL CREAR / EDITAR
// ═══════════════════════════════════════════════════════════════════════════
function ModalPostoperatorio({
  postop,
  pacientes,
  historias,
  cirugias,
  onClose,
  onSaved,
}: {
  postop: Postoperatorio | null;
  pacientes: Paciente[];
  historias: HistoriaSimple[];
  cirugias: CirugiaSimple[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!postop;

  const [form, setForm] = useState<PostoperatorioCreate>(() =>
    isEdit
      ? {
          id_paciente:           postop.id_paciente,
          id_historia_clinica:   postop.id_historia_clinica,
          id_cirugia:            postop.id_cirugia,
          estado_postoperatorio: postop.estado_postoperatorio,
          fecha_control:         postop.fecha_control.slice(0, 16),
          proximo_control:       postop.proximo_control
            ? postop.proximo_control.slice(0, 16) : null,
          alertas:       postop.alertas ?? '',
          observaciones: postop.observaciones ?? '',
        }
      : emptyForm(),
  );

  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState('');

  const historiasFiltradas = historias.filter((h) => h.id_paciente === form.id_paciente);
  const cirugiasFiltradas  = cirugias.filter((c)  => c.id_paciente === form.id_paciente);

  const set = (field: keyof PostoperatorioCreate, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handlePacienteChange = (id: number) =>
    setForm((f) => ({
      ...f,
      id_paciente: id,
      id_historia_clinica: 0,
      id_cirugia: null,
    }));

  function validate() {
    const e: Record<string, string> = {};
    if (!form.id_paciente)         e.id_paciente = 'Selecciona un paciente.';
    if (!form.id_historia_clinica) e.id_historia_clinica = 'Selecciona la historia clínica.';
    if (!form.fecha_control)       e.fecha_control = 'La fecha del control es obligatoria.';
    if (form.proximo_control && form.fecha_control) {
      if (new Date(form.proximo_control) < new Date(form.fecha_control)) {
        e.proximo_control = 'El próximo control debe ser posterior al control actual.';
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
      const payload: PostoperatorioCreate = {
        ...form,
        alertas:       form.alertas?.trim() || undefined,
        observaciones: form.observaciones?.trim() || undefined,
        id_cirugia:    form.id_cirugia || null,
        proximo_control: form.proximo_control || null,
      };
      if (isEdit) {
        await postoperatorioService.update(postop!.id_postoperatorio, payload);
      } else {
        await postoperatorioService.create(payload);
      }
      onSaved();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const msg =
        (data?.detail as string) ??
        (data?.fecha_control as string[])?.join(' ') ??
        (data?.proximo_control as string[])?.join(' ') ??
        'Error al guardar. Verifica los datos.';
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  }

  const esComplicado = form.estado_postoperatorio === 'COMPLICADO';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-rose-100 rounded-xl flex items-center justify-center">
              <HeartPulse className="w-4 h-4 text-rose-600" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">
                {isEdit ? 'Editar control postoperatorio' : 'Nuevo control postoperatorio'}
              </h2>
              <p className="text-[11px] text-gray-400">CU15 · Seguimiento postoperatorio</p>
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

          {/* Aviso visual si estado es COMPLICADO */}
          {esComplicado && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-[12.5px] text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Estado <strong className="mx-1">Complicado</strong> — documenta las alertas clínicas con detalle para trazabilidad.
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
                        HC #{h.id_historia_clinica}{h.motivo_apertura ? ` · ${h.motivo_apertura.slice(0, 28)}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </Field>

              {/* Vínculo CU14 → CU15 */}
              <Field label="Cirugía vinculada (opcional)"
                hint={
                  !form.id_paciente
                    ? 'Primero selecciona un paciente.'
                    : cirugiasFiltradas.length === 0
                    ? 'Este paciente no tiene cirugías registradas.'
                    : undefined
                }>
                <div className="relative">
                  <select className={selectCls()} value={form.id_cirugia ?? ''}
                    onChange={(e) => set('id_cirugia', e.target.value ? Number(e.target.value) : null)}
                    disabled={!form.id_paciente || cirugiasFiltradas.length === 0}>
                    <option value="">Sin vinculación a cirugía</option>
                    {cirugiasFiltradas.map((c) => (
                      <option key={c.id_cirugia} value={c.id_cirugia}>
                        Cir. #{c.id_cirugia} · {c.procedimiento.slice(0, 28)}…
                        {' · '}{formatFecha(c.fecha_programada)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </Field>

              {/* Estado */}
              <Field label="Estado del seguimiento" required>
                <div className="relative">
                  <select className={selectCls()} value={form.estado_postoperatorio}
                    onChange={(e) => set('estado_postoperatorio', e.target.value)}>
                    <option value="EN_OBSERVACION">En observación</option>
                    <option value="ESTABLE">Estable</option>
                    <option value="COMPLICADO">Complicado</option>
                    <option value="CERRADO">Cerrado</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </Field>
            </div>
          </section>

          {/* ── Sección 2: Fechas de control ── */}
          <section>
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />Fechas de control
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Fecha del control" required error={errors.fecha_control}>
                <input type="datetime-local" className={inputCls(errors.fecha_control)}
                  value={form.fecha_control}
                  onChange={(e) => set('fecha_control', e.target.value)} />
              </Field>
              <Field label="Próximo control" error={errors.proximo_control}
                hint="Debe ser posterior a la fecha del control actual.">
                <input type="datetime-local" className={inputCls(errors.proximo_control)}
                  value={form.proximo_control ?? ''}
                  onChange={(e) => set('proximo_control', e.target.value || null)} />
              </Field>
            </div>
          </section>

          {/* ── Sección 3: Alertas clínicas ── */}
          <section>
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-600">Alertas clínicas</span>
            </h3>
            <Field label="Alertas"
              hint="Complicaciones, señales de alarma, síntomas inusuales, acciones urgentes requeridas.">
              <textarea className={`${textareaCls()} ${form.alertas?.trim() ? 'border-amber-300 bg-amber-50/50 focus:ring-amber-400' : ''}`}
                rows={3}
                placeholder="Ej: Aumento de presión intraocular, edema corneal, inflamación excesiva, dolor agudo, pérdida visual súbita…"
                value={form.alertas as string}
                onChange={(e) => set('alertas', e.target.value)} />
            </Field>
          </section>

          {/* ── Sección 4: Evolución y observaciones ── */}
          <section>
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />Evolución clínica y observaciones
            </h3>
            <Field label="Observaciones médicas"
              hint="Evolución clínica, tratamiento indicado, indicaciones de recuperación, próximos pasos.">
              <textarea className={textareaCls()}
                rows={4}
                placeholder="Evolución postoperatoria satisfactoria. Paciente sin dolor. Agudeza visual: 20/40 OD. Tratamiento: colirio antibiótico + AINE. Indicaciones: reposo relativo, no frotar ojo, protección solar. Próxima cita de control en 7 días…"
                value={form.observaciones as string}
                onChange={(e) => set('observaciones', e.target.value)} />
            </Field>
          </section>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="h-9 px-5 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="h-9 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-medium
                         flex items-center gap-2 transition-colors disabled:opacity-60">
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Guardando…</>
              ) : (
                <><ShieldCheck className="w-4 h-4" />{isEdit ? 'Guardar cambios' : 'Registrar control'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TARJETA DE CONTROL POSTOPERATORIO
// ═══════════════════════════════════════════════════════════════════════════
function PostopCard({
  po,
  pacienteNombre,
  onEdit,
  onDelete,
}: {
  po: Postoperatorio;
  pacienteNombre: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cfg   = ESTADO_CFG[po.estado_postoperatorio] ?? ESTADO_CFG['EN_OBSERVACION'];
  const dias  = diasHastaControl(po.proximo_control);
  const esComplicado = po.estado_postoperatorio === 'COMPLICADO';
  const esCerrado    = po.estado_postoperatorio === 'CERRADO';

  // Color del indicador lateral según estado
  const borderAccent =
    esComplicado ? 'border-l-red-500' :
    po.estado_postoperatorio === 'ESTABLE' ? 'border-l-emerald-500' :
    po.estado_postoperatorio === 'CERRADO' ? 'border-l-gray-300' :
    'border-l-blue-500';

  return (
    <div className={`bg-white border border-gray-200 border-l-4 ${borderAccent} rounded-2xl p-4 hover:shadow-md transition-all group`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Ícono */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg.split(' ').slice(0, 1).join(' ')}`}>
            <HeartPulse className={`w-4 h-4 ${cfg.bg.split(' ').slice(1, 2).join(' ')}`} strokeWidth={2} />
          </div>

          <div className="min-w-0 flex-1">
            {/* Paciente + badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] font-semibold text-gray-900 truncate">{pacienteNombre}</span>
              <EstadoBadge estado={po.estado_postoperatorio} />
            </div>

            {/* Fecha control */}
            <p className="text-[11.5px] text-gray-400 mt-0.5">
              <Calendar className="inline w-3 h-3 mr-1" />
              Control: {formatFechaHora(po.fecha_control)}
              {po.id_cirugia && (
                <span className="ml-2 text-indigo-500">· Cir. #{po.id_cirugia}</span>
              )}
            </p>

            {/* Próximo control con urgencia visual */}
            {po.proximo_control && !esCerrado && (
              <div className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-xl border text-[11.5px] font-medium
                ${dias !== null && dias <= 0
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : dias !== null && dias <= 3
                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'bg-teal-50 text-teal-600 border-teal-200'}`}>
                <ArrowRight className="w-3 h-3" />
                Próx. control: {formatFecha(po.proximo_control)}
                {dias !== null && (
                  <span className="font-bold">
                    {dias <= 0
                      ? ' · Vencido'
                      : dias === 1
                      ? ' · Mañana'
                      : ` · en ${dias}d`}
                  </span>
                )}
              </div>
            )}

            {/* Alertas (zona de peligro) */}
            {po.alertas && (
              <div className="flex items-start gap-1.5 mt-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <Bell className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-[12px] text-amber-700 line-clamp-2">
                  <span className="font-semibold">Alerta: </span>{po.alertas}
                </p>
              </div>
            )}

            {/* Observaciones (preview) */}
            {po.observaciones && (
              <p className="text-[12px] text-gray-500 mt-1.5 line-clamp-2">{po.observaciones}</p>
            )}
          </div>
        </div>

        {/* Acciones hover */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar control">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 transition-colors"
            title="Eliminar control">
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
            <h3 className="text-[15px] font-bold text-gray-900">Eliminar control postoperatorio</h3>
            <p className="text-[12px] text-gray-400">Esta acción no se puede deshacer.</p>
          </div>
        </div>
        <p className="text-[13px] text-gray-600 mb-5">
          ¿Confirmas que deseas eliminar este control de{' '}
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
export default function PostoperatorioPage() {
  const [postops,      setPostops]      = useState<Postoperatorio[]>([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  const [pacientes,    setPacientes]    = useState<Paciente[]>([]);
  const [historias,    setHistorias]    = useState<HistoriaSimple[]>([]);
  const [cirugias,     setCirugias]     = useState<CirugiaSimple[]>([]);
  const [pacienteMap,  setPacienteMap]  = useState<Record<number, string>>({});

  const [search,       setSearch]       = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFecha,  setFiltroFecha]  = useState('');

  const [showModal,    setShowModal]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<Postoperatorio | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Postoperatorio | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Cargar soporte ──────────────────────────────────────────────────────
  useEffect(() => {
    async function loadSupport() {
      try {
        const [pacRes, hisRes, cirRes] = await Promise.all([
          fetchAll<Paciente>('/pacientes/'),
          historialService.list(),
          cirugiasService.list(),
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
        setCirugias(
          cirRes.results.map((c) => ({
            id_cirugia:       c.id_cirugia,
            id_paciente:      c.id_paciente,
            procedimiento:    c.procedimiento,
            fecha_programada: c.fecha_programada,
            estado_cirugia:   c.estado_cirugia,
          })),
        );
      } catch {
        // no bloquea la página
      }
    }
    loadSupport();
  }, []);

  // ── Cargar postoperatorios ─────────────────────────────────────────────
  const loadPostops = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await postoperatorioService.list({
        search:                search || undefined,
        estado_postoperatorio: filtroEstado || undefined,
        fecha:                 filtroFecha || undefined,
      });
      setPostops(res.results);
      setTotal(res.count);
    } catch {
      setError('No se pudieron cargar los controles postoperatorios.');
    } finally {
      setLoading(false);
    }
  }, [search, filtroEstado, filtroFecha]);

  useEffect(() => {
    const timer = setTimeout(loadPostops, 300);
    return () => clearTimeout(timer);
  }, [loadPostops]);

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = {
    total:        postops.length,
    estables:     postops.filter((p) => p.estado_postoperatorio === 'ESTABLE').length,
    observacion:  postops.filter((p) => p.estado_postoperatorio === 'EN_OBSERVACION').length,
    complicados:  postops.filter((p) => p.estado_postoperatorio === 'COMPLICADO').length,
  };

  // Controles con próximo control vencido o inminente (≤ 2 días)
  const proximosUrgentes = postops.filter((p) => {
    const d = diasHastaControl(p.proximo_control);
    return d !== null && d <= 2 && p.estado_postoperatorio !== 'CERRADO';
  }).length;

  const handleSaved = () => { setShowModal(false); setEditTarget(null); loadPostops(); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await postoperatorioService.destroy(deleteTarget.id_postoperatorio);
      setDeleteTarget(null);
      loadPostops();
    } catch { setDeleting(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-600 rounded-2xl flex items-center justify-center shadow-sm">
              <HeartPulse className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-gray-900 leading-tight">Postoperatorio</h1>
              <p className="text-[12px] text-gray-400">CU15 · Seguimiento postquirúrgico de pacientes</p>
            </div>
          </div>
          <button
            onClick={() => { setEditTarget(null); setShowModal(true); }}
            className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-medium
                       flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />Nuevo control
          </button>
        </div>

        {/* Banner próximos urgentes */}
        {proximosUrgentes > 0 && (
          <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-[13px] text-amber-700">
              <strong>{proximosUrgentes}</strong> control{proximosUrgentes !== 1 ? 'es' : ''} con
              próximo control vencido o en las próximas 48 horas.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total',         value: stats.total,       icon: Activity,     color: 'bg-rose-50 text-rose-600'       },
            { label: 'Estables',      value: stats.estables,    icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Observación',   value: stats.observacion, icon: Eye,          color: 'bg-blue-50 text-blue-600'       },
            { label: 'Complicados',   value: stats.complicados, icon: AlertTriangle, color: 'bg-red-50 text-red-600'        },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-4 h-4" strokeWidth={2} />
              </div>
              <div>
                <p className={`text-[20px] font-bold leading-none ${label === 'Complicados' && value > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {value}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar por paciente, alertas, observaciones…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-[13px] bg-white
                         focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro por estado */}
          <div className="relative sm:w-48">
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full h-10 pl-3.5 pr-9 rounded-xl border border-gray-200 text-[13px] bg-white appearance-none
                         focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition">
              <option value="">Todos los estados</option>
              <option value="EN_OBSERVACION">En observación</option>
              <option value="ESTABLE">Estable</option>
              <option value="COMPLICADO">Complicado</option>
              <option value="CERRADO">Cerrado</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Filtro por fecha exacta (?fecha=YYYY-MM-DD) */}
          <div className="relative sm:w-44">
            <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-gray-200 text-[13px] bg-white
                         focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition" />
            {filtroFecha && (
              <button onClick={() => setFiltroFecha('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Hint filtro fecha */}
        {filtroFecha && (
          <p className="text-[11.5px] text-gray-400 flex items-center gap-1.5 -mt-2 px-1">
            <Info className="w-3.5 h-3.5" />
            Mostrando controles del día {new Date(filtroFecha + 'T00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[13px]">Cargando controles postoperatorios…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-[13px]">{error}</p>
            <button onClick={loadPostops} className="ml-auto text-[12px] underline hover:no-underline">Reintentar</button>
          </div>
        )}

        {/* Lista */}
        {!loading && !error && (
          <>
            {postops.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <HeartPulse className="w-7 h-7 text-gray-300" strokeWidth={1.5} />
                </div>
                <p className="text-[14px] font-medium text-gray-500">
                  {search || filtroEstado || filtroFecha ? 'Sin resultados para este filtro' : 'Aún no hay controles postoperatorios'}
                </p>
                {!search && !filtroEstado && !filtroFecha && (
                  <p className="text-[12px] text-gray-400 mt-1">Registra el primero con el botón de arriba.</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[12px] text-gray-400 px-1">
                  {total} control{total !== 1 ? 'es' : ''} encontrado{total !== 1 ? 's' : ''}
                </p>
                {postops.map((po) => (
                  <PostopCard
                    key={po.id_postoperatorio}
                    po={po}
                    pacienteNombre={pacienteMap[po.id_paciente] ?? `Paciente #${po.id_paciente}`}
                    onEdit={() => { setEditTarget(po); setShowModal(true); }}
                    onDelete={() => setDeleteTarget(po)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal crear/editar */}
      {showModal && (
        <ModalPostoperatorio
          postop={editTarget}
          pacientes={pacientes}
          historias={historias}
          cirugias={cirugias}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={handleSaved}
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
