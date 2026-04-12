"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, User, Calendar, Stethoscope, FileText, FileWarning, ClipboardPlus, ChevronDown } from "lucide-react";
import api from "@/lib/api";

const inputCls = (err?: string) =>
  `w-full h-10 px-3.5 rounded-xl border text-[13px] bg-gray-50
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
   ${err ? 'border-red-300' : 'border-gray-200'}`;

const textareaCls = (err?: string) =>
  `w-full px-3.5 py-3 rounded-xl border text-[13px] bg-gray-50 resize-none
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
   ${err ? 'border-red-300' : 'border-gray-200'}`;

const selectCls = (err?: string) =>
  `w-full h-10 px-3.5 pr-9 rounded-xl border text-[13px] bg-gray-50 appearance-none
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
   ${err ? 'border-red-300' : 'border-gray-200'}`;

function Field({ label, required, error, children, icon: Icon }: { label: string; required?: boolean; error?: string; children: React.ReactNode; icon?: any }) {
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

export default function RegistrarConsultaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);

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
          api.get("/api/pacientes/"),
          api.get("/api/citas/"),
        ]);
        setPacientes(pacientesRes.data?.results || pacientesRes.data || []);
        setCitas(citasRes.data?.results || citasRes.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const dataToSubmit = { ...formData };
      if (!dataToSubmit.cita) {
        delete (dataToSubmit as any).cita;
      }
      await api.post("/api/consultas/", dataToSubmit);
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Error al registrar la consulta");
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
                        onChange={handleChange}
                        className={selectCls()}
                      >
                        <option value="">Seleccione un paciente</option>
                        {pacientes.map((p) => {
                          const nombreCompleto = p.nombres 
                            ? `${p.nombres} ${p.apellidos || ''}` 
                            : (p.first_name ? `${p.first_name} ${p.last_name || ''}` : p.nombre || `Paciente #${p.id || p.id_paciente}`);
                          return (
                            <option key={p.id || p.id_paciente} value={p.id || p.id_paciente}>
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
                        onChange={handleChange}
                        className={selectCls()}
                      >
                        <option value="">Ninguna</option>
                        {citas.map((c) => (
                          <option key={c.id || c.id_cita} value={c.id || c.id_cita}>
                            Cita #{c.id || c.id_cita} - {c.fecha || c.fecha_cita}
                          </option>
                        ))}
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
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 mt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 h-10 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 hover:bg-white transition-colors ml-auto shadow-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
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
