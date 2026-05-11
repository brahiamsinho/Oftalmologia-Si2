"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Scissors,
  Plus,
  Search,
  X,
  ChevronDown,
  ClipboardCheck,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  User,
  Calendar,
  FileText,
  Activity,
  AlertTriangle,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import {
  evaluacionQuirurgicaService,
  type EvaluacionQuirurgica,
  type EvaluacionQuirurgicaCreate,
} from "@/lib/services/evaluacion_quirurgica";
import { pacientesService } from "@/lib/services/pacientes";
import { historialService } from "@/lib/services/historial";
import type { Paciente } from "@/lib/types";

// ── Interfaces auxiliares ───────────────────────────────────────────────────
interface HistoriaSimple {
  id_historia_clinica: number;
  id_paciente: number;
  motivo_apertura: string | null;
  estado: string;
}

// ── Helpers visuales ────────────────────────────────────────────────────────
function estadoBadge(estado: string) {
  const cfg: Record<
    string,
    { bg: string; text: string; icon: React.ElementType }
  > = {
    APTO: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      text: "Apto",
      icon: CheckCircle2,
    },
    APTO_CON_OBSERVACIONES: {
      bg: "bg-blue-50 text-blue-700 border-blue-200",
      text: "Apto c/ obs.",
      icon: AlertTriangle,
    },
    NO_APTO: {
      bg: "bg-red-50 text-red-700 border-red-200",
      text: "No apto",
      icon: XCircle,
    },
    PENDIENTE: {
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      text: "Pendiente",
      icon: Clock,
    },
  };
  const c = cfg[estado] ?? cfg["PENDIENTE"];
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${c.bg}`}
    >
      <Icon className="w-3 h-3" strokeWidth={2} />
      {c.text}
    </span>
  );
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Input / Textarea / Select estilos ───────────────────────────────────────
const inputCls = (err?: string) =>
  `w-full h-10 px-3.5 rounded-xl border text-[13px] bg-gray-50
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
   ${err ? "border-red-300 bg-red-50" : "border-gray-200"}`;

const textareaCls = (err?: string) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-[13px] bg-gray-50 resize-none
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
   ${err ? "border-red-300 bg-red-50" : "border-gray-200"}`;

const selectCls = (err?: string) =>
  `w-full h-10 px-3.5 pr-9 rounded-xl border text-[13px] bg-gray-50 appearance-none
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
   ${err ? "border-red-300 bg-red-50" : "border-gray-200"}`;

function Field({
  label,
  required,
  error,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-[12.5px] font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-gray-400 mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-[11.5px] text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ── Formulario vacío ─────────────────────────────────────────────────────────
const emptyForm = (): EvaluacionQuirurgicaCreate => ({
  id_paciente: 0,
  id_historia_clinica: 0,
  id_consulta: null,
  fecha_evaluacion: new Date().toISOString().slice(0, 16),
  estado_prequirurgico: "PENDIENTE",
  riesgo_quirurgico: "",
  requiere_estudios_complementarios: false,
  estudios_solicitados: "",
  hallazgos: "",
  plan_quirurgico: "",
  observaciones: "",
});

// ═══════════════════════════════════════════════════════════════════════════
// MODAL CREAR / EDITAR
// ═══════════════════════════════════════════════════════════════════════════
function ModalEvaluacion({
  evaluacion,
  pacientes,
  historias,
  onClose,
  onSaved,
}: {
  evaluacion: EvaluacionQuirurgica | null;
  pacientes: Paciente[];
  historias: HistoriaSimple[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!evaluacion;
  const [form, setForm] = useState<EvaluacionQuirurgicaCreate>(() =>
    isEdit
      ? {
          id_paciente: evaluacion.id_paciente,
          id_historia_clinica: evaluacion.id_historia_clinica,
          id_consulta: evaluacion.id_consulta,
          fecha_evaluacion: evaluacion.fecha_evaluacion.slice(0, 16),
          estado_prequirurgico: evaluacion.estado_prequirurgico,
          riesgo_quirurgico: evaluacion.riesgo_quirurgico ?? "",
          requiere_estudios_complementarios:
            evaluacion.requiere_estudios_complementarios,
          estudios_solicitados: evaluacion.estudios_solicitados ?? "",
          hallazgos: evaluacion.hallazgos ?? "",
          plan_quirurgico: evaluacion.plan_quirurgico ?? "",
          observaciones: evaluacion.observaciones ?? "",
        }
      : emptyForm(),
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  // Historias filtradas al paciente seleccionado
  const historiasFiltradas = historias.filter(
    (h) => h.id_paciente === form.id_paciente,
  );

  // Cuando cambia el paciente, resetear historia clínica
  const handlePacienteChange = (pacienteId: number) => {
    setForm((f) => ({
      ...f,
      id_paciente: pacienteId,
      id_historia_clinica: 0,
    }));
  };

  function validate() {
    const e: Record<string, string> = {};
    if (!form.id_paciente) e.id_paciente = "Selecciona un paciente.";
    if (!form.id_historia_clinica)
      e.id_historia_clinica = "Selecciona la historia clínica.";
    if (!form.fecha_evaluacion) e.fecha_evaluacion = "La fecha es obligatoria.";
    if (!form.estado_prequirurgico)
      e.estado_prequirurgico = "Selecciona el estado prequirúrgico.";
    if (
      form.requiere_estudios_complementarios &&
      !form.estudios_solicitados?.trim()
    ) {
      e.estudios_solicitados = "Describe los estudios solicitados.";
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    setApiError("");
    try {
      const payload: EvaluacionQuirurgicaCreate = {
        ...form,
        riesgo_quirurgico: form.riesgo_quirurgico?.trim() || undefined,
        estudios_solicitados: form.estudios_solicitados?.trim() || undefined,
        hallazgos: form.hallazgos?.trim() || undefined,
        plan_quirurgico: form.plan_quirurgico?.trim() || undefined,
        observaciones: form.observaciones?.trim() || undefined,
      };
      if (isEdit) {
        await evaluacionQuirurgicaService.update(
          evaluacion!.id_evaluacion_quirurgica,
          payload,
        );
      } else {
        await evaluacionQuirurgicaService.create(payload);
      }
      onSaved();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Error al guardar. Verifica los datos.";
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  }

  const set = (field: keyof EvaluacionQuirurgicaCreate, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6">
        {/* Header del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
              <Scissors className="w-4 h-4 text-violet-600" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">
                {isEdit
                  ? "Editar evaluación quirúrgica"
                  : "Nueva evaluación quirúrgica"}
              </h2>
              <p className="text-[11px] text-gray-400">
                Valoración prequirúrgica
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {apiError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-[12.5px] text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {apiError}
            </div>
          )}

          {/* ── Sección 1: Paciente ── */}
          <section>
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Paciente y historia clínica
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Paciente" required error={errors.id_paciente}>
                <div className="relative">
                  <select
                    className={selectCls(errors.id_paciente)}
                    value={form.id_paciente || ""}
                    onChange={(e) =>
                      handlePacienteChange(Number(e.target.value))
                    }
                  >
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

              <Field
                label="Historia clínica"
                required
                error={errors.id_historia_clinica}
                hint={
                  !form.id_paciente
                    ? "Primero selecciona un paciente."
                    : undefined
                }
              >
                <div className="relative">
                  <select
                    className={selectCls(errors.id_historia_clinica)}
                    value={form.id_historia_clinica || ""}
                    onChange={(e) =>
                      set("id_historia_clinica", Number(e.target.value))
                    }
                    disabled={!form.id_paciente}
                  >
                    <option value="">Seleccionar historia…</option>
                    {historiasFiltradas.map((h) => (
                      <option
                        key={h.id_historia_clinica}
                        value={h.id_historia_clinica}
                      >
                        HC #{h.id_historia_clinica}
                        {h.motivo_apertura
                          ? ` · ${h.motivo_apertura.slice(0, 30)}`
                          : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </Field>
            </div>
          </section>

          {/* ── Sección 2: Datos de la evaluación ── */}
          <section>
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Datos de la evaluación
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field
                label="Fecha de evaluación"
                required
                error={errors.fecha_evaluacion}
              >
                <input
                  type="datetime-local"
                  className={inputCls(errors.fecha_evaluacion)}
                  value={form.fecha_evaluacion as string}
                  onChange={(e) => set("fecha_evaluacion", e.target.value)}
                />
              </Field>

              <Field
                label="Estado prequirúrgico"
                required
                error={errors.estado_prequirurgico}
              >
                <div className="relative">
                  <select
                    className={selectCls(errors.estado_prequirurgico)}
                    value={form.estado_prequirurgico}
                    onChange={(e) =>
                      set("estado_prequirurgico", e.target.value)
                    }
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="APTO">Apto</option>
                    <option value="APTO_CON_OBSERVACIONES">
                      Apto con observaciones
                    </option>
                    <option value="NO_APTO">No apto</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Riesgo quirúrgico" error={errors.riesgo_quirurgico}>
                <input
                  type="text"
                  className={inputCls(errors.riesgo_quirurgico)}
                  placeholder="Ej. Bajo, Moderado, Alto"
                  value={form.riesgo_quirurgico as string}
                  onChange={(e) => set("riesgo_quirurgico", e.target.value)}
                />
              </Field>
            </div>
          </section>

          {/* ── Sección 3: Hallazgos clínicos ── */}
          <section>
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Hallazgos y plan quirúrgico
            </h3>
            <div className="space-y-3">
              <Field label="Hallazgos clínicos" error={errors.hallazgos}>
                <textarea
                  className={textareaCls(errors.hallazgos)}
                  rows={3}
                  placeholder="Condición visual, diagnóstico quirúrgico y hallazgos del examen…"
                  value={form.hallazgos as string}
                  onChange={(e) => set("hallazgos", e.target.value)}
                />
              </Field>

              <Field label="Plan quirúrgico" error={errors.plan_quirurgico}>
                <textarea
                  className={textareaCls(errors.plan_quirurgico)}
                  rows={3}
                  placeholder="Procedimiento propuesto, técnica quirúrgica, cronograma…"
                  value={form.plan_quirurgico as string}
                  onChange={(e) => set("plan_quirurgico", e.target.value)}
                />
              </Field>
            </div>
          </section>

          {/* ── Sección 4: Estudios y observaciones ── */}
          <section>
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              Estudios y observaciones
            </h3>
            <div className="space-y-3">
              {/* Toggle: requiere estudios complementarios */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors select-none">
                <div
                  className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0
                    ${form.requiere_estudios_complementarios ? "bg-violet-500" : "bg-gray-300"}`}
                  onClick={() =>
                    set(
                      "requiere_estudios_complementarios",
                      !form.requiere_estudios_complementarios,
                    )
                  }
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
                      ${form.requiere_estudios_complementarios ? "translate-x-4" : "translate-x-0"}`}
                  />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-gray-800">
                    Requiere estudios complementarios
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Laboratorio, imágenes u otros exámenes previos a cirugía
                  </p>
                </div>
              </label>

              {form.requiere_estudios_complementarios && (
                <Field
                  label="Estudios solicitados"
                  required
                  error={errors.estudios_solicitados}
                >
                  <textarea
                    className={textareaCls(errors.estudios_solicitados)}
                    rows={2}
                    placeholder="Biometría ocular, topografía corneal, laboratorios…"
                    value={form.estudios_solicitados as string}
                    onChange={(e) =>
                      set("estudios_solicitados", e.target.value)
                    }
                  />
                </Field>
              )}

              <Field label="Observaciones médicas" error={errors.observaciones}>
                <textarea
                  className={textareaCls(errors.observaciones)}
                  rows={3}
                  placeholder="Criterio de aptitud quirúrgica, restricciones, indicaciones preoperatorias…"
                  value={form.observaciones as string}
                  onChange={(e) => set("observaciones", e.target.value)}
                />
              </Field>
            </div>
          </section>

          {/* ── Footer del formulario ── */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-5 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-medium
                         flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando…
                </>
              ) : (
                <>
                  <ClipboardCheck className="w-4 h-4" />{" "}
                  {isEdit ? "Guardar cambios" : "Registrar evaluación"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TARJETA DE EVALUACIÓN
// ═══════════════════════════════════════════════════════════════════════════
function EvaluacionCard({
  ev,
  pacienteNombre,
  onEdit,
  onDelete,
}: {
  ev: EvaluacionQuirurgica;
  pacienteNombre: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:border-gray-300 transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Icono de estado */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5
            ${
              ev.estado_prequirurgico === "APTO"
                ? "bg-emerald-50"
                : ev.estado_prequirurgico === "NO_APTO"
                  ? "bg-red-50"
                  : ev.estado_prequirurgico === "APTO_CON_OBSERVACIONES"
                    ? "bg-blue-50"
                    : "bg-amber-50"
            }`}
          >
            <Scissors
              className={`w-4 h-4
              ${
                ev.estado_prequirurgico === "APTO"
                  ? "text-emerald-600"
                  : ev.estado_prequirurgico === "NO_APTO"
                    ? "text-red-600"
                    : ev.estado_prequirurgico === "APTO_CON_OBSERVACIONES"
                      ? "text-blue-600"
                      : "text-amber-600"
              }`}
              strokeWidth={2}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] font-semibold text-gray-900 truncate">
                {pacienteNombre}
              </span>
              {estadoBadge(ev.estado_prequirurgico)}
            </div>
            <p className="text-[11.5px] text-gray-400 mt-0.5">
              <Calendar className="inline w-3 h-3 mr-1" />
              {formatFecha(ev.fecha_evaluacion)} · HC #{ev.id_historia_clinica}
            </p>

            {ev.riesgo_quirurgico && (
              <div className="flex items-center gap-1 mt-1.5">
                <AlertTriangle className="w-3 h-3 text-orange-400 flex-shrink-0" />
                <span className="text-[12px] text-orange-600 font-medium">
                  Riesgo: {ev.riesgo_quirurgico}
                </span>
              </div>
            )}

            {ev.hallazgos && (
              <p className="text-[12px] text-gray-500 mt-1.5 line-clamp-2">
                {ev.hallazgos}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {ev.requiere_estudios_complementarios && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full border border-violet-200">
                  <FlaskConical className="w-3 h-3" />
                  Requiere estudios
                </span>
              )}
              {ev.plan_quirurgico && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full border border-gray-200">
                  <FileText className="w-3 h-3" />
                  Con plan quirúrgico
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar evaluación"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 transition-colors"
            title="Eliminar evaluación"
          >
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
  pacienteNombre,
  onConfirm,
  onCancel,
  loading,
}: {
  pacienteNombre: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">
              Eliminar evaluación
            </h3>
            <p className="text-[12px] text-gray-400">
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
        <p className="text-[13px] text-gray-600 mb-5">
          ¿Confirmas que deseas eliminar la evaluación quirúrgica de{" "}
          <span className="font-semibold text-gray-900">{pacienteNombre}</span>?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-9 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-medium
                       flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
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
export default function EvaluacionesQuirurgicasPage() {
  // ── Estado principal ─────────────────────────────────────────────────────
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionQuirurgica[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Datos de soporte (pacientes e historias para el formulario) ───────────
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [historias, setHistorias] = useState<HistoriaSimple[]>([]);
  const [pacienteMap, setPacienteMap] = useState<Record<number, string>>({});

  // ── Filtros ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // ── Modales ───────────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<EvaluacionQuirurgica | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<EvaluacionQuirurgica | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  // ── Cargar datos de soporte (pacientes + historias) ───────────────────────
  useEffect(() => {
    async function loadSupport() {
      try {
        const [pacRes, hisRes] = await Promise.all([
          pacientesService.listAll(),
          historialService.list(),
        ]);
        setPacientes(pacRes);
        const map: Record<number, string> = {};
        pacRes.forEach((p) => {
          map[p.id_paciente] = `${p.apellidos}, ${p.nombres}`;
        });
        setPacienteMap(map);
        setHistorias(
          hisRes.results.map((h) => ({
            id_historia_clinica: h.id_historia_clinica,
            id_paciente: h.id_paciente,
            motivo_apertura: h.motivo_apertura ?? null,
            estado: h.estado,
          })),
        );
      } catch {
        // Los errores de carga de soporte no bloquean la página
      }
    }
    loadSupport();
  }, []);

  // ── Cargar evaluaciones ───────────────────────────────────────────────────
  const loadEvaluaciones = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await evaluacionQuirurgicaService.list({
        search: search || undefined,
        estado_prequirurgico: filtroEstado || undefined,
      });
      setEvaluaciones(res.results);
      setTotal(res.count);
    } catch {
      setError("No se pudieron cargar las evaluaciones quirúrgicas.");
    } finally {
      setLoading(false);
    }
  }, [search, filtroEstado]);

  useEffect(() => {
    const timer = setTimeout(loadEvaluaciones, 300);
    return () => clearTimeout(timer);
  }, [loadEvaluaciones]);

  // ── Stats derivadas ───────────────────────────────────────────────────────
  const stats = {
    total: evaluaciones.length,
    aptos: evaluaciones.filter((e) => e.estado_prequirurgico === "APTO").length,
    noAptos: evaluaciones.filter((e) => e.estado_prequirurgico === "NO_APTO")
      .length,
    pendientes: evaluaciones.filter(
      (e) => e.estado_prequirurgico === "PENDIENTE",
    ).length,
    conObs: evaluaciones.filter(
      (e) => e.estado_prequirurgico === "APTO_CON_OBSERVACIONES",
    ).length,
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSaved = () => {
    setShowModal(false);
    setEditTarget(null);
    loadEvaluaciones();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await evaluacionQuirurgicaService.destroy(
        deleteTarget.id_evaluacion_quirurgica,
      );
      setDeleteTarget(null);
      loadEvaluaciones();
    } catch {
      setDeleting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* ── Header de la página ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Scissors className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-gray-900 leading-tight">
                Evaluaciones Quirúrgicas
              </h1>
              <p className="text-[12px] text-gray-400">
                Valoraciones prequirúrgicas de los pacientes
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditTarget(null);
              setShowModal(true);
            }}
            className="h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-medium
                       flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva evaluación
          </button>
        </div>

        {/* ── Estadísticas ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total",
              value: stats.total,
              icon: Activity,
              color: "bg-violet-50 text-violet-600",
            },
            {
              label: "Aptos",
              value: stats.aptos,
              icon: CheckCircle2,
              color: "bg-emerald-50 text-emerald-600",
            },
            {
              label: "No aptos",
              value: stats.noAptos,
              icon: XCircle,
              color: "bg-red-50 text-red-600",
            },
            {
              label: "Pendientes",
              value: stats.pendientes,
              icon: Clock,
              color: "bg-amber-50 text-amber-600",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[20px] font-bold text-gray-900 leading-none">
                  {value}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filtros ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por paciente, hallazgos, riesgo…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-[13px] bg-white
                         focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative sm:w-56">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full h-10 pl-3.5 pr-9 rounded-xl border border-gray-200 text-[13px] bg-white appearance-none
                         focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="APTO">Apto</option>
              <option value="APTO_CON_OBSERVACIONES">
                Apto con observaciones
              </option>
              <option value="NO_APTO">No apto</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* ── Estado de carga ── */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[13px]">Cargando evaluaciones…</span>
          </div>
        )}

        {/* ── Error de carga ── */}
        {!loading && error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-[13px]">{error}</p>
            <button
              onClick={loadEvaluaciones}
              className="ml-auto text-[12px] underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* ── Lista de evaluaciones ── */}
        {!loading && !error && (
          <>
            {evaluaciones.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Scissors
                    className="w-7 h-7 text-gray-300"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-[14px] font-medium text-gray-500">
                  {search || filtroEstado
                    ? "Sin resultados para este filtro"
                    : "Aún no hay evaluaciones quirúrgicas"}
                </p>
                <p className="text-[12px] text-gray-400 mt-1">
                  {!search &&
                    !filtroEstado &&
                    "Registra la primera evaluación con el botón de arriba."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[12px] text-gray-400 px-1">
                  {total} evaluación{total !== 1 ? "es" : ""} encontrada
                  {total !== 1 ? "s" : ""}
                </p>
                {evaluaciones.map((ev) => (
                  <EvaluacionCard
                    key={ev.id_evaluacion_quirurgica}
                    ev={ev}
                    pacienteNombre={
                      pacienteMap[ev.id_paciente] ??
                      `Paciente #${ev.id_paciente}`
                    }
                    onEdit={() => {
                      setEditTarget(ev);
                      setShowModal(true);
                    }}
                    onDelete={() => setDeleteTarget(ev)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal crear / editar ── */}
      {showModal && (
        <ModalEvaluacion
          evaluacion={editTarget}
          pacientes={pacientes}
          historias={historias}
          onClose={() => {
            setShowModal(false);
            setEditTarget(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {/* ── Modal confirmar eliminación ── */}
      {deleteTarget && (
        <ModalConfirmDelete
          pacienteNombre={
            pacienteMap[deleteTarget.id_paciente] ??
            `Paciente #${deleteTarget.id_paciente}`
          }
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
