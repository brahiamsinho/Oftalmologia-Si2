"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, User, Calendar, Stethoscope, FileText, FileWarning, ClipboardPlus, ChevronDown } from "lucide-react";
import api from "@/lib/api";

const textareaCls = (err?: string) =>
  `w-full px-3.5 py-3 rounded-xl border text-[13px] bg-gray-50 resize-none
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
   ${err ? 'border-red-300' : 'border-gray-200'}`;

const selectCls = (err?: string) =>
  `w-full h-10 px-3.5 pr-9 rounded-xl border text-[13px] bg-gray-50 appearance-none
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
   ${err ? 'border-red-300' : 'border-gray-200'}`;

function Field({ label, required, error, children, icon: Icon }: { label: string; required?: boolean; error?: string; children: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-gray-700 mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11.5px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function SelectWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function citaPacienteId(c: Record<string, unknown>): string {
  const raw = c.id_paciente;
  if (typeof raw === "number") return String(raw);
  if (raw && typeof raw === "object" && "id_paciente" in (raw as object)) {
    return String((raw as { id_paciente: number }).id_paciente);
  }
  return "";
}

export default function RegistrarConsultaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<Record<string, unknown>[]>([]);
  const [citas, setCitas] = useState<Record<string, unknown>[]>([]);

  const [formData, setFormData] = useState({
    paciente: "",
    cita: "",
    motivo_consulta: "",
    sintomas: "",
    diagnostico_inicial: "",
    observaciones: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pacientesRes, citasRes] = await Promise.all([
          api.get("/pacientes/"),
          api.get("/citas/"),
        ]);
        const pRaw = pacientesRes.data?.results ?? pacientesRes.data;
        const cRaw = citasRes.data?.results ?? citasRes.data;
        setPacientes(Array.isArray(pRaw) ? pRaw : []);
        setCitas(Array.isArray(cRaw) ? cRaw : []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  const citasFiltradas = citas.filter((c) => {
    if ((c.estado as string) === "CANCELADA") return false;
    if (!formData.paciente) return true;
    return citaPacienteId(c as Record<string, unknown>) === formData.paciente;
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePacienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setFormData((prev) => {
      let cita = prev.cita;
      if (cita && v) {
        const row = citas.find((x) => String(x.id_cita ?? x.id) === cita);
        const pid = row ? citaPacienteId(row as Record<string, unknown>) : "";
        if (pid && pid !== v) cita = "";
      }
      return { ...prev, paciente: v, cita };
    });
  };

  const handleCitaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (!v) {
      setFormData((prev) => ({ ...prev, cita: "" }));
      return;
    }
    const row = citas.find((x) => String(x.id_cita ?? x.id) === v);
    const pid = row ? citaPacienteId(row as Record<string, unknown>) : "";
    setFormData((prev) => ({ ...prev, cita: v, paciente: pid || prev.paciente }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const notas = [formData.diagnostico_inicial, formData.observaciones]
        .map((s) => s?.trim())
        .filter(Boolean)
        .join("\n\n");
      const payload: Record<string, unknown> = {
        paciente: Number(formData.paciente),
        motivo: formData.motivo_consulta,
        sintomas: formData.sintomas || "",
        notas_clinicas: notas || "",
      };
      if (formData.cita) {
        payload.cita = Number(formData.cita);
      }
      await api.post("/consultas/lista/", payload);
      router.push("/consultas");
    } catch (err: unknown) {
      console.error(err);
      const ax = err as { response?: { data?: Record<string, unknown> | string } };
      const d = ax.response?.data;
      const msg =
        typeof d === "string"
          ? d
          : d && typeof d === "object" && "detail" in d
            ? String(d.detail)
            : "Error al registrar la consulta";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-[22px] font-bold text-gray-900">Registrar Consulta</h2>
            <p className="text-[12.5px] text-gray-400 mt-0.5">Ingresar detalles clínicos de la atención al paciente</p>
          </div>
        </div>
      </div>

      {dataLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex items-center justify-center py-20 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando datos...</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="flex flex-col">
            {error && (
              <div className="m-5 mb-0 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-[13px] flex items-center gap-2 border border-red-100">
                <FileWarning className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="px-6 py-6 space-y-6">

              {/* General Info */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">
                  Información General
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Paciente" required icon={User}>
                    <SelectWrap>
                      <select
                        name="paciente"
                        required
                        value={formData.paciente}
                        onChange={handlePacienteChange}
                        className={selectCls()}
                      >
                        <option value="">Seleccione un paciente</option>
                        {pacientes.map((p) => {
                          const id = (p.id_paciente ?? p.id) as number;
                          const nombreCompleto = p.nombres
                            ? `${String(p.nombres)} ${String(p.apellidos ?? '')}`
                            : (p.first_name
                                ? `${String(p.first_name)} ${String(p.last_name ?? '')}`
                                : String(p.nombre ?? `Paciente #${id}`));
                          return (
                            <option key={id} value={id}>
                              {nombreCompleto}
                            </option>
                          );
                        })}
                      </select>
                    </SelectWrap>
                  </Field>

                  <Field label="Cita Asociada (Opcional)" icon={Calendar}>
                    <SelectWrap>
                      <select
                        name="cita"
                        value={formData.cita}
                        onChange={handleCitaChange}
                        className={selectCls()}
                      >
                        <option value="">Ninguna</option>
                        {citasFiltradas.map((c) => {
                          const id = c.id_cita ?? c.id;
                          const when = c.fecha_hora_inicio
                            ? new Date(c.fecha_hora_inicio as string).toLocaleString("es-BO", {
                                timeZone: "America/La_Paz",
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "";
                          const pn = c.paciente_nombre ? ` — ${String(c.paciente_nombre)}` : "";
                          return (
                            <option key={id} value={id}>
                              Cita #{id}
                              {pn}
                              {when ? ` (${when})` : ""}
                            </option>
                          );
                        })}
                      </select>
                    </SelectWrap>
                  </Field>
                </div>
              </div>

              {/* Detalles Clínicos */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2 mt-4">
                  Detalles Clínicos
                </p>
                <div className="space-y-5">
                  <Field label="Motivo de Consulta" required icon={Stethoscope}>
                    <textarea
                      name="motivo_consulta"
                      required
                      rows={2}
                      value={formData.motivo_consulta}
                      onChange={handleChange}
                      className={textareaCls()}
                      placeholder="Escriba el motivo principal..."
                    />
                  </Field>

                  <Field label="Síntomas" icon={FileWarning}>
                    <textarea
                      name="sintomas"
                      rows={2}
                      value={formData.sintomas}
                      onChange={handleChange}
                      className={textareaCls()}
                      placeholder="Describa los síntomas presentados..."
                    />
                  </Field>

                  <Field label="Diagnóstico Inicial" icon={FileText}>
                    <textarea
                      name="diagnostico_inicial"
                      rows={2}
                      value={formData.diagnostico_inicial}
                      onChange={handleChange}
                      className={textareaCls()}
                      placeholder="Impresión diagnóstica inicial..."
                    />
                  </Field>

                  <Field label="Observaciones Adicionales" icon={ClipboardPlus}>
                    <textarea
                      name="observaciones"
                      rows={2}
                      value={formData.observaciones}
                      onChange={handleChange}
                      className={textareaCls()}
                      placeholder="Alergias, datos relevantes, notas..."
                    />
                  </Field>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 mt-2 sm:justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 h-10 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-white transition-colors shadow-sm w-full sm:w-auto"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {loading ? "Guardando..." : "Registrar Consulta"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
