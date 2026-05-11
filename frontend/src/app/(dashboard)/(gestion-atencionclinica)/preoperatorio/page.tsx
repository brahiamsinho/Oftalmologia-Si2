"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  X,
  ChevronDown,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  User,
  Calendar,
  FileText,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FlaskConical,
  Stethoscope,
  ShieldCheck,
  Info,
  Syringe,
  ClipboardCheck,
} from "lucide-react";
import {
  preoperatorioService,
  type Preoperatorio,
  type PreoperatorioCreate,
} from "@/lib/services/preoperatorio";
import { pacientesService } from "@/lib/services/pacientes";
import { historialService } from "@/lib/services/historial";
import { evaluacionQuirurgicaService } from "@/lib/services/evaluacion_quirurgica";
import type { Paciente } from "@/lib/types";

// ── Interfaces auxiliares ───────────────────────────────────────────────────
interface HistoriaSimple {
  id_historia_clinica: number;
  id_paciente: number;
  motivo_apertura: string | null;
}

interface EvalSimple {
  id_evaluacion_quirurgica: number;
  id_paciente: number;
  fecha_evaluacion: string;
  estado_prequirurgico: string;
}

// ── Helpers visuales ────────────────────────────────────────────────────────
const ESTADO_CFG: Record<
  string,
  { bg: string; dot: string; icon: React.ElementType; label: string }
> = {
  PENDIENTE: {
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
    icon: Clock,
    label: "Pendiente",
  },
  EN_PROCESO: {
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-400",
    icon: Activity,
    label: "En proceso",
  },
  APROBADO: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
    label: "Aprobado",
  },
  OBSERVADO: {
    bg: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-400",
    icon: AlertTriangle,
    label: "Observado",
  },
  RECHAZADO: {
    bg: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
    icon: XCircle,
    label: "Rechazado",
  },
};

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CFG[estado] ?? ESTADO_CFG["PENDIENTE"];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg}`}
    >
      <Icon className="w-3 h-3" strokeWidth={2} />
      {cfg.label}
    </span>
  );
}

function formatFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Estilos de campos ───────────────────────────────────────────────────────
const inputCls = (err?: string) =>
  `w-full h-10 px-3.5 rounded-xl border text-[13px] bg-gray-50
   focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition
   ${err ? "border-red-300 bg-red-50" : "border-gray-200"}`;

const textareaCls = (err?: string) =>
  `w-full px-3.5 py-2.5 rounded-xl border text-[13px] bg-gray-50 resize-none
   focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition
   ${err ? "border-red-300 bg-red-50" : "border-gray-200"}`;

const selectCls = (err?: string) =>
  `w-full h-10 px-3.5 pr-9 rounded-xl border text-[13px] bg-gray-50 appearance-none
   focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition
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

// ── Toggle visual reutilizable ──────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  label,
  description,
  color = "teal",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  color?: "teal" | "emerald" | "blue";
}) {
  const bg = checked
    ? color === "emerald"
      ? "bg-emerald-500"
      : color === "blue"
        ? "bg-blue-500"
        : "bg-teal-500"
    : "bg-gray-300";
  return (
    <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors select-none">
      <div
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${bg}`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
            ${checked ? "translate-x-4" : "translate-x-0"}`}
        />
      </div>
      <div>
        <p className="text-[13px] font-medium text-gray-800">{label}</p>
        {description && (
          <p className="text-[11px] text-gray-400">{description}</p>
        )}
      </div>
      {checked && (
        <CheckCircle2
          className={`w-4 h-4 ml-auto flex-shrink-0 ${color === "emerald" ? "text-emerald-500" : color === "blue" ? "text-blue-500" : "text-teal-500"}`}
          strokeWidth={2}
        />
      )}
    </label>
  );
}

// ── Formulario vacío ─────────────────────────────────────────────────────────
const emptyForm = (): PreoperatorioCreate => ({
  id_paciente: 0,
  id_historia_clinica: 0,
  id_evaluacion_quirurgica: null,
  id_cita: null,
  estado_preoperatorio: "PENDIENTE",
  checklist_completado: false,
  checklist_detalle: "",
  examenes_requeridos: "",
  examenes_completados: "",
  apto_anestesia: false,
  fecha_programada_cirugia: null,
  observaciones: "",
});

// ═══════════════════════════════════════════════════════════════════════════
// MODAL CREAR / EDITAR
// ═══════════════════════════════════════════════════════════════════════════
function ModalPreoperatorio({
  preop,
  pacientes,
  historias,
  evaluaciones,
  onClose,
  onSaved,
}: {
  preop: Preoperatorio | null;
  pacientes: Paciente[];
  historias: HistoriaSimple[];
  evaluaciones: EvalSimple[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!preop;

  const [form, setForm] = useState<PreoperatorioCreate>(() =>
    isEdit
      ? {
          id_paciente: preop.id_paciente,
          id_historia_clinica: preop.id_historia_clinica,
          id_evaluacion_quirurgica: preop.id_evaluacion_quirurgica,
          id_cita: preop.id_cita,
          estado_preoperatorio: preop.estado_preoperatorio,
          checklist_completado: preop.checklist_completado,
          checklist_detalle: preop.checklist_detalle ?? "",
          examenes_requeridos: preop.examenes_requeridos ?? "",
          examenes_completados: preop.examenes_completados ?? "",
          apto_anestesia: preop.apto_anestesia,
          fecha_programada_cirugia: preop.fecha_programada_cirugia
            ? preop.fecha_programada_cirugia.slice(0, 16)
            : null,
          observaciones: preop.observaciones ?? "",
        }
      : emptyForm(),
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  // Filtros dependientes del paciente seleccionado
  const historiasFiltradas = historias.filter(
    (h) => h.id_paciente === form.id_paciente,
  );
  const evalsFiltradas = evaluaciones.filter(
    (e) => e.id_paciente === form.id_paciente,
  );

  const set = (field: keyof PreoperatorioCreate, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handlePacienteChange = (id: number) =>
    setForm((f) => ({
      ...f,
      id_paciente: id,
      id_historia_clinica: 0,
      id_evaluacion_quirurgica: null,
    }));

  // Regla de negocio: APROBADO requiere checklist + apto_anestesia
  const intentaAprobar = form.estado_preoperatorio === "APROBADO";
  const puedeAprobar = form.checklist_completado && form.apto_anestesia;

  function validate() {
    const e: Record<string, string> = {};
    if (!form.id_paciente) e.id_paciente = "Selecciona un paciente.";
    if (!form.id_historia_clinica)
      e.id_historia_clinica = "Selecciona la historia clínica.";
    if (!form.estado_preoperatorio)
      e.estado_preoperatorio = "Selecciona el estado.";
    if (intentaAprobar && !puedeAprobar) {
      e.estado_preoperatorio =
        "Para aprobar, el checklist y la aptitud para anestesia deben estar completos.";
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
      const payload: PreoperatorioCreate = {
        ...form,
        checklist_detalle: form.checklist_detalle?.trim() || undefined,
        examenes_requeridos: form.examenes_requeridos?.trim() || undefined,
        examenes_completados: form.examenes_completados?.trim() || undefined,
        observaciones: form.observaciones?.trim() || undefined,
        fecha_programada_cirugia: form.fecha_programada_cirugia || null,
        id_evaluacion_quirurgica: form.id_evaluacion_quirurgica || null,
        id_cita: form.id_cita || null,
      };
      if (isEdit) {
        await preoperatorioService.update(preop!.id_preoperatorio, payload);
      } else {
        await preoperatorioService.create(payload);
      }
      onSaved();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })
        ?.response?.data;
      const msg =
        (data?.detail as string) ??
        (data?.estado_preoperatorio as string[])?.join(" ") ??
        "Error al guardar. Verifica los datos.";
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
            <div className="w-8 h-8 bg-teal-100 rounded-xl flex items-center justify-center">
              <ClipboardList
                className="w-4 h-4 text-teal-600"
                strokeWidth={2}
              />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">
                {isEdit ? "Editar preoperatorio" : "Nuevo preoperatorio"}
              </h2>
              <p className="text-[11px] text-gray-400">
                Preparación prequirúrgica
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

          {/* Aviso de regla de negocio si intenta APROBADO sin requisitos */}
          {intentaAprobar && !puedeAprobar && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[12.5px] text-amber-700">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Para cambiar el estado a{" "}
              <strong className="mx-1">Aprobado</strong> debes marcar el{" "}
              <strong className="mx-1">checklist completado</strong> y la{" "}
              <strong className="mx-1">aptitud para anestesia</strong>.
            </div>
          )}

          {/* ── Sección 1: Paciente y referencias ── */}
          <section>
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Paciente y referencias
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

              {/* Evaluación quirúrgica */}
              <Field
                label="Evaluación quirúrgica (opcional)"
                hint={
                  !form.id_paciente
                    ? "Primero selecciona un paciente."
                    : evalsFiltradas.length === 0
                      ? "Este paciente no tiene evaluaciones quirúrgicas."
                      : undefined
                }
              >
                <div className="relative">
                  <select
                    className={selectCls()}
                    value={form.id_evaluacion_quirurgica ?? ""}
                    onChange={(e) =>
                      set(
                        "id_evaluacion_quirurgica",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    disabled={!form.id_paciente || evalsFiltradas.length === 0}
                  >
                    <option value="">Sin vinculación a evaluación</option>
                    {evalsFiltradas.map((ev) => (
                      <option
                        key={ev.id_evaluacion_quirurgica}
                        value={ev.id_evaluacion_quirurgica}
                      >
                        Eval. #{ev.id_evaluacion_quirurgica} ·{" "}
                        {new Date(ev.fecha_evaluacion).toLocaleDateString(
                          "es-CO",
                        )}
                        {" · "}
                        {ev.estado_prequirurgico}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Fecha programada de cirugía">
                <input
                  type="datetime-local"
                  className={inputCls()}
                  value={form.fecha_programada_cirugia ?? ""}
                  onChange={(e) =>
                    set("fecha_programada_cirugia", e.target.value || null)
                  }
                />
              </Field>
            </div>
          </section>

          {/* ── Sección 2: Estado ── */}
          <section>
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Estado preoperatorio
            </h3>
            <Field label="Estado" required error={errors.estado_preoperatorio}>
              <div className="relative">
                <select
                  className={selectCls(errors.estado_preoperatorio)}
                  value={form.estado_preoperatorio}
                  onChange={(e) => set("estado_preoperatorio", e.target.value)}
                >
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="EN_PROCESO">En proceso</option>
                  <option value="APROBADO">Aprobado</option>
                  <option value="OBSERVADO">Observado</option>
                  <option value="RECHAZADO">Rechazado</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </Field>
          </section>

          {/* ── Sección 3: Checklist ── */}
          <section>
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5" />
              Checklist preoperatorio
            </h3>
            <div className="space-y-3">
              <Toggle
                checked={!!form.checklist_completado}
                onChange={(v) => set("checklist_completado", v)}
                label="Checklist completado"
                description="Todos los requisitos del checklist preoperatorio han sido verificados"
                color="teal"
              />
              <Field
                label="Detalle del checklist"
                hint="Describe los ítems verificados o pendientes."
              >
                <textarea
                  className={textareaCls()}
                  rows={3}
                  placeholder="Ej: Ayuno confirmado (8h), consentimiento informado firmado, alergias documentadas, medicamentos suspendidos…"
                  value={form.checklist_detalle as string}
                  onChange={(e) => set("checklist_detalle", e.target.value)}
                />
              </Field>
            </div>
          </section>

          {/* ── Sección 4: Exámenes ── */}
          <section>
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" />
              Exámenes preoperatorios
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Exámenes requeridos">
                <textarea
                  className={textareaCls()}
                  rows={4}
                  placeholder="Biometría ocular, topografía corneal, hemograma, electrocardiograma, glucemia, coagulación…"
                  value={form.examenes_requeridos as string}
                  onChange={(e) => set("examenes_requeridos", e.target.value)}
                />
              </Field>
              <Field label="Exámenes completados">
                <textarea
                  className={textareaCls()}
                  rows={4}
                  placeholder="Indica cuáles ya fueron realizados y están disponibles…"
                  value={form.examenes_completados as string}
                  onChange={(e) => set("examenes_completados", e.target.value)}
                />
              </Field>
            </div>
          </section>

          {/* ── Sección 5: Aptitud y observaciones ── */}
          <section>
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Syringe className="w-3.5 h-3.5" />
              Aptitud y observaciones
            </h3>
            <div className="space-y-3">
              <Toggle
                checked={!!form.apto_anestesia}
                onChange={(v) => set("apto_anestesia", v)}
                label="Apto para anestesia"
                description="El paciente ha sido evaluado y es candidato apto para la anestesia"
                color="emerald"
              />
              <Field label="Observaciones clínicas">
                <textarea
                  className={textareaCls()}
                  rows={3}
                  placeholder="Indicaciones preoperatorias, restricciones, condiciones especiales, nota de enfermería…"
                  value={form.observaciones as string}
                  onChange={(e) => set("observaciones", e.target.value)}
                />
              </Field>
            </div>
          </section>

          {/* Footer */}
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
              className="h-9 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-medium
                         flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  {isEdit ? "Guardar cambios" : "Registrar preoperatorio"}
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
// TARJETA DE PREOPERATORIO
// ═══════════════════════════════════════════════════════════════════════════
function PreoperatorioCard({
  po,
  pacienteNombre,
  onEdit,
  onDelete,
}: {
  po: Preoperatorio;
  pacienteNombre: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cfg = ESTADO_CFG[po.estado_preoperatorio] ?? ESTADO_CFG["PENDIENTE"];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:border-gray-300 transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Icono con color de estado */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg.split(" ").slice(0, 1).join(" ")}`}
          >
            <ClipboardList
              className={`w-4 h-4 ${cfg.bg.split(" ").slice(1, 2).join(" ")}`}
              strokeWidth={2}
            />
          </div>

          <div className="min-w-0 flex-1">
            {/* Paciente + badge estado */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] font-semibold text-gray-900 truncate">
                {pacienteNombre}
              </span>
              <EstadoBadge estado={po.estado_preoperatorio} />
            </div>

            {/* HC + fecha */}
            <p className="text-[11.5px] text-gray-400 mt-0.5">
              <Calendar className="inline w-3 h-3 mr-1" />
              Creado {formatFecha(po.created_at)} · HC #{po.id_historia_clinica}
              {po.id_evaluacion_quirurgica && (
                <span className="ml-2 text-violet-500">
                  · Eval. #{po.id_evaluacion_quirurgica}
                </span>
              )}
            </p>

            {/* Fecha programada de cirugía */}
            {po.fecha_programada_cirugia && (
              <div className="flex items-center gap-1 mt-1.5">
                <Stethoscope className="w-3 h-3 text-teal-500 flex-shrink-0" />
                <span className="text-[12px] text-teal-600 font-medium">
                  Cirugía: {formatFecha(po.fecha_programada_cirugia)}
                </span>
              </div>
            )}

            {/* Chips de estado de requisitos */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border
                ${
                  po.checklist_completado
                    ? "bg-teal-50 text-teal-600 border-teal-200"
                    : "bg-gray-50 text-gray-400 border-gray-200"
                }`}
              >
                <ClipboardCheck className="w-3 h-3" />
                {po.checklist_completado
                  ? "Checklist ✓"
                  : "Checklist pendiente"}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border
                ${
                  po.apto_anestesia
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-gray-50 text-gray-400 border-gray-200"
                }`}
              >
                <Syringe className="w-3 h-3" />
                {po.apto_anestesia ? "Apto anestesia ✓" : "Anestesia pendiente"}
              </span>
              {po.fecha_validacion && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-200">
                  <ShieldCheck className="w-3 h-3" />
                  Validado
                </span>
              )}
            </div>

            {/* Preview de observaciones */}
            {po.observaciones && (
              <p className="text-[12px] text-gray-500 mt-2 line-clamp-2">
                {po.observaciones}
              </p>
            )}
          </div>
        </div>

        {/* Acciones hover */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar preoperatorio"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 transition-colors"
            title="Eliminar preoperatorio"
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
              Eliminar preoperatorio
            </h3>
            <p className="text-[12px] text-gray-400">
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
        <p className="text-[13px] text-gray-600 mb-5">
          ¿Confirmas que deseas eliminar el preoperatorio de{" "}
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
export default function PreoperatorioPage() {
  const [preoperatorios, setPreoperatorios] = useState<Preoperatorio[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Datos de soporte
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [historias, setHistorias] = useState<HistoriaSimple[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<EvalSimple[]>([]);
  const [pacienteMap, setPacienteMap] = useState<Record<number, string>>({});

  // Filtros
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Preoperatorio | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Preoperatorio | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Cargar datos de soporte ──────────────────────────────────────────────
  useEffect(() => {
    async function loadSupport() {
      try {
        const [pacRes, hisRes, evRes] = await Promise.all([
          pacientesService.listAll(),
          historialService.list(),
          evaluacionQuirurgicaService.list(),
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
          })),
        );
        setEvaluaciones(
          evRes.results.map((ev) => ({
            id_evaluacion_quirurgica: ev.id_evaluacion_quirurgica,
            id_paciente: ev.id_paciente,
            fecha_evaluacion: ev.fecha_evaluacion,
            estado_prequirurgico: ev.estado_prequirurgico,
          })),
        );
      } catch {
        // no bloquea la página
      }
    }
    loadSupport();
  }, []);

  // ── Cargar preoperatorios ────────────────────────────────────────────────
  const loadPreoperatorios = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await preoperatorioService.list({
        search: search || undefined,
        estado_preoperatorio: filtroEstado || undefined,
      });
      setPreoperatorios(res.results);
      setTotal(res.count);
    } catch {
      setError("No se pudieron cargar los preoperatorios.");
    } finally {
      setLoading(false);
    }
  }, [search, filtroEstado]);

  useEffect(() => {
    const timer = setTimeout(loadPreoperatorios, 300);
    return () => clearTimeout(timer);
  }, [loadPreoperatorios]);

  // ── Stats derivadas ──────────────────────────────────────────────────────
  const stats = {
    total: preoperatorios.length,
    aprobados: preoperatorios.filter(
      (p) => p.estado_preoperatorio === "APROBADO",
    ).length,
    proceso: preoperatorios.filter(
      (p) => p.estado_preoperatorio === "EN_PROCESO",
    ).length,
    pendientes: preoperatorios.filter(
      (p) => p.estado_preoperatorio === "PENDIENTE",
    ).length,
    rechazados: preoperatorios.filter(
      (p) => p.estado_preoperatorio === "RECHAZADO",
    ).length,
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditTarget(null);
    loadPreoperatorios();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await preoperatorioService.destroy(deleteTarget.id_preoperatorio);
      setDeleteTarget(null);
      loadPreoperatorios();
    } catch {
      setDeleting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-2xl flex items-center justify-center shadow-sm">
              <ClipboardList className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-gray-900 leading-tight">
                Preoperatorio
              </h1>
              <p className="text-[12px] text-gray-400">
                Gestión de preparación prequirúrgica
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditTarget(null);
              setShowModal(true);
            }}
            className="h-9 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-medium
                       flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo preoperatorio
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total",
              value: stats.total,
              icon: FileText,
              color: "bg-teal-50 text-teal-600",
            },
            {
              label: "Aprobados",
              value: stats.aprobados,
              icon: CheckCircle2,
              color: "bg-emerald-50 text-emerald-600",
            },
            {
              label: "En proceso",
              value: stats.proceso,
              icon: Activity,
              color: "bg-blue-50 text-blue-600",
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

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por paciente, exámenes, observaciones…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-[13px] bg-white
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
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
          <div className="relative sm:w-52">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full h-10 pl-3.5 pr-9 rounded-xl border border-gray-200 text-[13px] bg-white appearance-none
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            >
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROCESO">En proceso</option>
              <option value="APROBADO">Aprobado</option>
              <option value="OBSERVADO">Observado</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[13px]">Cargando preoperatorios…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-[13px]">{error}</p>
            <button
              onClick={loadPreoperatorios}
              className="ml-auto text-[12px] underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Lista */}
        {!loading && !error && (
          <>
            {preoperatorios.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ClipboardList
                    className="w-7 h-7 text-gray-300"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-[14px] font-medium text-gray-500">
                  {search || filtroEstado
                    ? "Sin resultados para este filtro"
                    : "Aún no hay registros preoperatorios"}
                </p>
                {!search && !filtroEstado && (
                  <p className="text-[12px] text-gray-400 mt-1">
                    Registra el primero con el botón de arriba.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[12px] text-gray-400 px-1">
                  {total} registro{total !== 1 ? "s" : ""} encontrado
                  {total !== 1 ? "s" : ""}
                </p>
                {preoperatorios.map((po) => (
                  <PreoperatorioCard
                    key={po.id_preoperatorio}
                    po={po}
                    pacienteNombre={
                      pacienteMap[po.id_paciente] ??
                      `Paciente #${po.id_paciente}`
                    }
                    onEdit={() => {
                      setEditTarget(po);
                      setShowModal(true);
                    }}
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
        <ModalPreoperatorio
          preop={editTarget}
          pacientes={pacientes}
          historias={historias}
          evaluaciones={evaluaciones}
          onClose={() => {
            setShowModal(false);
            setEditTarget(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {/* Modal eliminar */}
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
