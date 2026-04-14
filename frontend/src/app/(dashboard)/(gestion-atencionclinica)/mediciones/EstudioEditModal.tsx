'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X, User, Eye, FileText, Upload } from 'lucide-react';
import type { EstudioUpdatePayload } from '@/lib/services/estudios';
import { updateEstudioJson, updateEstudioMultipart } from '@/lib/services/estudios';
import type { MedicionVisualUpdatePayload } from '@/lib/services/medicion_visual';
import {
  updateMedicionVisualJson,
  updateMedicionVisualMultipart,
} from '@/lib/services/medicion_visual';
import type { MedicionListItem } from '@/lib/services/mediciones';

const TIPO_OPTIONS: { value: string; label: string }[] = [
  { value: 'refraccion', label: 'Refracción' },
  { value: 'tonometria', label: 'Tonometría (Presión Intraocular)' },
  { value: 'fondo_ojo', label: 'Fondo de Ojo' },
  { value: 'topografia', label: 'Topografía Corneal' },
  { value: 'paquimetria', label: 'Paquimetría' },
  { value: 'tomografia', label: 'Tomografía de Coherencia Óptica (OCT)' },
  { value: 'campo_visual', label: 'Campo Visual' },
  { value: 'otros', label: 'Otros' },
];

const inputCls = (err?: string) =>
  `w-full h-10 px-3.5 rounded-xl border text-[13px] bg-gray-50
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
   ${err ? 'border-red-300' : 'border-gray-200'}`;

const textareaCls = () =>
  `w-full px-3.5 py-3 rounded-xl border border-gray-200 text-[13px] bg-gray-50 resize-y min-h-[88px]
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`;

const selectCls = (err?: string) =>
  `w-full h-10 px-3.5 pr-9 rounded-xl border text-[13px] bg-gray-50 appearance-none
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
   ${err ? 'border-red-300' : 'border-gray-200'}`;

function resolveMediaHref(url: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '') ?? '';
  const origin = raw.replace(/\/api\/?$/i, '');
  if (!origin) return url.startsWith('/') ? url : `/${url}`;
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

type PacienteOpt = { id_paciente: number; nombres: string; apellidos: string };

export function EstudioEditModal({
  item,
  pacientes,
  onClose,
  onSaved,
}: {
  item: MedicionListItem;
  pacientes: PacienteOpt[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isMedicionVisual = item.rowKind === 'medicion_visual';
  const [pacienteId, setPacienteId] = useState(String(item.paciente));
  const [tipoEstudio, setTipoEstudio] = useState(
    isMedicionVisual ? 'agudeza_visual' : item.tipo_estudio,
  );
  const [ojoDerecho, setOjoDerecho] = useState(item.ojo_derecho ?? '');
  const [ojoIzquierdo, setOjoIzquierdo] = useState(item.ojo_izquierdo ?? '');
  const [observaciones, setObservaciones] = useState(item.observaciones ?? '');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mv = item.rowKind === 'medicion_visual';
    setPacienteId(String(item.paciente));
    setTipoEstudio(mv ? 'agudeza_visual' : item.tipo_estudio);
    setOjoDerecho(item.ojo_derecho ?? '');
    setOjoIzquierdo(item.ojo_izquierdo ?? '');
    setObservaciones(item.observaciones ?? '');
    setArchivo(null);
    setError(null);
  }, [item]);

  const validate = () => {
    if (!pacienteId) return 'Elegí un paciente.';
    if (!isMedicionVisual && !tipoEstudio) return 'Elegí el tipo de estudio.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (isMedicionVisual) {
        const bodyMv: MedicionVisualUpdatePayload = {
          paciente: Number(pacienteId),
          consulta: item.consulta,
          ojo_derecho: ojoDerecho,
          ojo_izquierdo: ojoIzquierdo,
          observaciones,
        };
        if (archivo) await updateMedicionVisualMultipart(item.id, bodyMv, archivo);
        else await updateMedicionVisualJson(item.id, bodyMv);
      } else {
        const body: EstudioUpdatePayload = {
          paciente: Number(pacienteId),
          tipo_estudio: tipoEstudio,
          ojo_derecho: ojoDerecho,
          ojo_izquierdo: ojoIzquierdo,
          observaciones: observaciones,
        };
        if (archivo) await updateEstudioMultipart(item.id, body, archivo);
        else await updateEstudioJson(item.id, body);
      }
      onSaved();
      onClose();
    } catch {
      setError('No se pudo guardar. Revisá los datos o la conexión.');
    } finally {
      setLoading(false);
    }
  };

  const archivoHref = resolveMediaHref(item.archivo_resultado);

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="estudio-edit-title"
      className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain bg-black/40 backdrop-blur-sm"
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div className="flex min-h-[100dvh] w-full justify-center px-3 py-4 pb-28 sm:px-4 sm:py-6 sm:pb-24">
        <div
          className="flex min-h-0 w-full max-w-2xl flex-col self-start overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl
            max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]"
          onClick={(ev) => ev.stopPropagation()}
        >
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5 py-3.5 sm:px-6 sm:py-4">
            <h3 id="estudio-edit-title" className="text-[15px] font-bold text-gray-900">
              Editar medición / estudio
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden" noValidate>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5">
              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-gray-700">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  Paciente <span className="text-red-500">*</span>
                </label>
                <select
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value)}
                  className={selectCls()}
                >
                  {pacientes.map((p) => (
                    <option key={p.id_paciente} value={p.id_paciente}>
                      {p.nombres} {p.apellidos}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-gray-700">
                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                  Tipo de estudio <span className="text-red-500">*</span>
                </label>
                {isMedicionVisual ? (
                  <input
                    type="text"
                    readOnly
                    value="Agudeza Visual"
                    className={inputCls()}
                  />
                ) : (
                  <select
                    value={tipoEstudio}
                    onChange={(e) => setTipoEstudio(e.target.value)}
                    className={selectCls()}
                  >
                    {TIPO_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-gray-700">
                    <Eye className="h-3.5 w-3.5 text-gray-400" />
                    Ojo derecho (OD)
                  </label>
                  <input
                    value={ojoDerecho}
                    onChange={(e) => setOjoDerecho(e.target.value)}
                    className={inputCls()}
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-gray-700">
                    <Eye className="h-3.5 w-3.5 text-gray-400" />
                    Ojo izquierdo (OI)
                  </label>
                  <input
                    value={ojoIzquierdo}
                    onChange={(e) => setOjoIzquierdo(e.target.value)}
                    className={inputCls()}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-gray-700">
                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                  Observaciones
                </label>
                <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className={textareaCls()} rows={4} />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-gray-700">
                  <Upload className="h-3.5 w-3.5 text-gray-400" />
                  Reemplazar archivo (opcional)
                </label>
                {archivoHref && !archivo && (
                  <a
                    href={archivoHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-2 block text-[12px] font-medium text-blue-600 hover:underline"
                  >
                    Ver archivo actual
                  </a>
                )}
                <input
                  type="file"
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            <div className="flex flex-shrink-0 gap-2.5 border-t border-gray-100 bg-gray-50/80 px-5 py-3.5 sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={onClose}
                className="h-11 flex-1 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-600 transition-colors hover:bg-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex h-11 min-w-[140px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-[13px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(overlay, document.body);
}
