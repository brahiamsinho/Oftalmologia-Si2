"use client";

import React, { useState, useEffect, type ElementType } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, User, Eye, Activity, FileText, Upload } from "lucide-react";
import api from "@/lib/api";
import MinimalIris from "@/components/MinimalIris";

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

function Field({ label, required, error, children, icon: Icon }: { label: string; required?: boolean; error?: string; children: React.ReactNode; icon?: ElementType }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[12.5px] font-medium text-gray-700 mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative group">{children}</div>
      {error && <p className="text-[11px] text-red-500 mt-1.5 font-medium ml-1 flex items-center gap-1">⚠ {error}</p>}
    </div>
  );
}

export default function RegistrarMedicionPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [pacientes, setPacientes] = useState<{ id_paciente: number; nombres: string; apellidos: string }[]>([]);

  // Form State
  const [pacienteId, setPacienteId] = useState("");
  const [tipoEstudio, setTipoEstudio] = useState("agudeza_visual");
  const [ojoDerecho, setOjoDerecho] = useState("");
  const [ojoIzquierdo, setOjoIzquierdo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);

  const [errors, setErrors] = useState<{ pacienteId?: string; tipoEstudio?: string; general?: string }>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPacientes();
  }, []);

  const fetchPacientes = async () => {
    try {
      const res = await api.get("/pacientes/");
      const raw = res.data?.results ?? res.data;
      const list = Array.isArray(raw) ? raw : [];
      setPacientes(
        list.map((p: Record<string, unknown>) => ({
          id_paciente: Number(p.id_paciente),
          nombres: String(p.nombres ?? ''),
          apellidos: String(p.apellidos ?? ''),
        })),
      );
    } catch (err) {
      console.error("Error cargando pacientes", err);
    }
  };

  const validate = () => {
    const newErrs: { pacienteId?: string; tipoEstudio?: string } = {};
    if (!pacienteId) newErrs.pacienteId = "El paciente es obligatorio.";
    if (!tipoEstudio) newErrs.tipoEstudio = "El tipo de estudio es obligatorio.";
    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append("paciente", pacienteId);
      formData.append("ojo_derecho", ojoDerecho);
      formData.append("ojo_izquierdo", ojoIzquierdo);
      formData.append("observaciones", observaciones);
      if (archivo) {
        formData.append("archivo_resultado", archivo);
      }

      const url =
        tipoEstudio === "agudeza_visual"
          ? "/medicion-visual/registros/"
          : "/consultas/estudios/";

      if (tipoEstudio !== "agudeza_visual") {
        formData.append("tipo_estudio", tipoEstudio);
      }

      await api.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: unknown) {
      console.error(err);
      setErrors({ general: "Ocurrió un error al registrar la medición. Revisa los datos e intenta nuevamente." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-2 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Registrar Medición Visual / Estudio</h1>
          <p className="text-sm text-gray-500 mt-1">
            Asocia resultados oftalmológicos u observaciones clínicas a un paciente.
          </p>
        </div>
      </div>

      <div className="relative rounded-3xl border border-gray-100 bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)]">
        <div className="pointer-events-none absolute right-0 top-0 overflow-hidden rounded-3xl p-8 opacity-5">
          <MinimalIris />
        </div>

        {success && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center flex-col animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¡Medición registrada!</h3>
            <p className="text-[13px] text-gray-500 mb-6">El registro clínico ha sido almacenado de manera segura.</p>
            <div className="flex items-center gap-2 text-[13px] font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Redirigiendo...
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 space-y-8 p-8 pb-6 sm:p-10 sm:pb-8">
          {errors.general && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-3">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <Activity className="w-4 h-4 text-red-600" />
              </div>
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7">
            {/* Información Principal */}
            <div className="col-span-1 md:col-span-2 space-y-6">
              <h2 className="text-sm font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                Información del Paciente
              </h2>
              <Field label="Paciente Seleccionado" required error={errors.pacienteId} icon={User}>
                <select
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value)}
                  className={selectCls(errors.pacienteId)}
                >
                  <option value="">Seleccione un paciente</option>
                  {pacientes.map((p) => (
                    <option key={p.id_paciente} value={p.id_paciente}>
                      {p.nombres} {p.apellidos}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="col-span-1 md:col-span-2 mt-2 space-y-6">
              <h2 className="text-sm font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Detalles del Estudio
              </h2>
              
              <Field label="Tipo de Estudio/Medición" required error={errors.tipoEstudio} icon={FileText}>
                <select
                  value={tipoEstudio}
                  onChange={(e) => setTipoEstudio(e.target.value)}
                  className={selectCls(errors.tipoEstudio)}
                >
                  <option value="agudeza_visual">Agudeza Visual</option>
                  <option value="refraccion">Refracción</option>
                  <option value="tonometria">Tonometría (Presión Intraocular)</option>
                  <option value="fondo_ojo">Fondo de Ojo</option>
                  <option value="topografia">Topografía Corneal</option>
                  <option value="paquimetria">Paquimetría</option>
                  <option value="tomografia">Tomografía de Coherencia Óptica (OCT)</option>
                  <option value="campo_visual">Campo Visual</option>
                  <option value="otros">Otros</option>
                </select>
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                <Field label="Ojo Derecho (OD)" icon={Eye}>
                  <input
                    type="text"
                    placeholder="Ej: 20/20, 14mmHg..."
                    value={ojoDerecho}
                    onChange={(e) => setOjoDerecho(e.target.value)}
                    className={inputCls()}
                  />
                </Field>
                <Field label="Ojo Izquierdo (OI)" icon={Eye}>
                  <input
                    type="text"
                    placeholder="Ej: 20/40, 15mmHg..."
                    value={ojoIzquierdo}
                    onChange={(e) => setOjoIzquierdo(e.target.value)}
                    className={inputCls()}
                  />
                </Field>
              </div>

              <Field label="Archivo o Resultado Adjunto (Opcional)" icon={Upload}>
                <input
                  type="file"
                  onChange={(e) => setArchivo(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-[13px] file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    transition"
                />
              </Field>

              <Field label="Observaciones Clínicas" icon={FileText}>
                <textarea
                  rows={4}
                  placeholder="Notas adicionales, conclusiones del estudio..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className={textareaCls()}
                />
              </Field>
            </div>
          </div>

          <div
            className="sticky bottom-0 z-20 -mx-8 mt-8 flex items-center justify-end gap-3 border-t border-gray-100 bg-white/95 px-8 py-4 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:-mx-10 sm:px-10"
          >
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 text-[13px] font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-[13px] font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20 focus:ring-4 focus:ring-blue-600/20 transition-all flex items-center justify-center gap-2 min-w-[160px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Registrando...
                </>
              ) : (
                <>
                  Registrar Medición
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}