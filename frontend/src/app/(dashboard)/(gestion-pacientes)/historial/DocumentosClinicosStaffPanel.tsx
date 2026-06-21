'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FilePlus2,
  FileText,
  Loader2,
  RefreshCw,
  Send,
} from 'lucide-react';

import { historialService, type DocumentoClinicoAutorizado, type DocumentoClinicoCreatePayload } from '@/lib/services/historial';

type Notice = {
  kind: 'success' | 'error';
  text: string;
};

const DEFAULT_FORM: DocumentoClinicoCreatePayload = {
  tipo_documento: 'RECETA',
  titulo: '',
  contenido: '',
  nombre_archivo_descarga: '',
};

function formatDocumentoError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'No se pudo completar la acción.';
  const record = data as Record<string, unknown>;
  if (typeof record.detail === 'string') return record.detail;

  const parts: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      const message = value.map(String).join(' ');
      parts.push(key === 'non_field_errors' ? message : `${key}: ${message}`);
    } else if (typeof value === 'string') {
      parts.push(`${key}: ${value}`);
    }
  }

  return parts.length ? parts.join(' ') : 'Revisá los datos e intentá de nuevo.';
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export function DocumentosClinicosStaffPanel({ historiaId }: { historiaId: number }) {
  const [documentos, setDocumentos] = useState<DocumentoClinicoAutorizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authorizingId, setAuthorizingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DocumentoClinicoCreatePayload>(DEFAULT_FORM);

  const loadDocumentos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await historialService.listDocumentos(historiaId);
      setDocumentos(items);
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data
        ? formatDocumentoError(err.response.data)
        : 'No se pudieron cargar los documentos clínicos.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [historiaId]);

  useEffect(() => {
    setForm(DEFAULT_FORM);
    setNotice(null);
    void loadDocumentos();
  }, [loadDocumentos]);

  const handleCreateDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      await historialService.createDocumento(historiaId, {
        ...form,
        nombre_archivo_descarga: form.nombre_archivo_descarga?.trim() || undefined,
      });
      setForm(DEFAULT_FORM);
      setNotice({ kind: 'success', text: 'Borrador creado. Ya podés autorizarlo desde la lista.' });
      await loadDocumentos();
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data
        ? formatDocumentoError(err.response.data)
        : 'No se pudo crear el borrador.';
      setNotice({ kind: 'error', text: message });
    } finally {
      setSaving(false);
    }
  };

  const handleAuthorize = async (documento: DocumentoClinicoAutorizado) => {
    setAuthorizingId(documento.id_documento_clinico);
    setNotice(null);
    try {
      await historialService.autorizarDocumento(historiaId, documento.id_documento_clinico);
      setNotice({ kind: 'success', text: `Documento "${documento.titulo}" autorizado.` });
      await loadDocumentos();
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data
        ? formatDocumentoError(err.response.data)
        : 'No se pudo autorizar el documento.';
      setNotice({ kind: 'error', text: message });
    } finally {
      setAuthorizingId(null);
    }
  };

  const handleDownload = async (documento: DocumentoClinicoAutorizado) => {
    setDownloadingId(documento.id_documento_clinico);
    setNotice(null);
    try {
      const blob = await historialService.downloadDocumento(historiaId, documento.id_documento_clinico);
      downloadBlob(blob, documento.nombre_archivo_descarga || `${documento.titulo}.pdf`);
      setNotice({ kind: 'success', text: `PDF descargado para "${documento.titulo}".` });
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data
        ? formatDocumentoError(err.response.data)
        : 'No se pudo descargar el PDF.';
      setNotice({ kind: 'error', text: message });
    } finally {
      setDownloadingId(null);
    }
  };

  const documentoCount = documentos.length;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold text-gray-700">Gestión de CU26</p>
          <p className="text-[12px] text-gray-500 mt-1">
            Crea borradores, autorízalos y descarga el PDF sin salir del historial.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadDocumentos()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {notice && (
        <div
          className={`flex gap-2 rounded-xl border px-4 py-3 text-[13px] ${
            notice.kind === 'success'
              ? 'border-green-100 bg-green-50 text-green-700'
              : 'border-red-100 bg-red-50 text-red-700'
          }`}
        >
          {notice.kind === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      <form onSubmit={handleCreateDraft} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FilePlus2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-900">Nuevo borrador</p>
            <p className="text-[11.5px] text-gray-500">Se crea primero como borrador y luego se autoriza.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="block text-[12px] font-medium text-gray-700">Tipo</span>
            <select
              value={form.tipo_documento}
              onChange={(event) => setForm({ ...form, tipo_documento: event.target.value as DocumentoClinicoCreatePayload['tipo_documento'] })}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="RECETA">Receta</option>
              <option value="INDICACION">Indicación</option>
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="block text-[12px] font-medium text-gray-700">Nombre de archivo</span>
            <input
              value={form.nombre_archivo_descarga ?? ''}
              onChange={(event) => setForm({ ...form, nombre_archivo_descarga: event.target.value })}
              placeholder="Opcional: receta-control-visual"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>

        <label className="mt-3 block space-y-1.5">
          <span className="block text-[12px] font-medium text-gray-700">Título</span>
          <input
            required
            value={form.titulo}
            onChange={(event) => setForm({ ...form, titulo: event.target.value })}
            placeholder="Ej. Receta de control visual"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="mt-3 block space-y-1.5">
          <span className="block text-[12px] font-medium text-gray-700">Contenido</span>
          <textarea
            required
            rows={4}
            value={form.contenido}
            onChange={(event) => setForm({ ...form, contenido: event.target.value })}
            placeholder="Indicaciones, medicación, controles y observaciones para el paciente…"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[11.5px] text-gray-500">
            {documentoCount > 0 ? `${documentoCount} documento(s) cargado(s)` : 'Sin documentos cargados aún'}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {saving ? 'Guardando…' : 'Crear borrador'}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-gray-100 bg-gray-50/60">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold text-gray-900">Documentos clínicos</p>
            <p className="text-[11.5px] text-gray-500">Autoriza los borradores para habilitar la descarga.</p>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600 border border-gray-200">
            {documentoCount}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : error ? (
          <div className="px-4 py-4">
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="flex-1">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void loadDocumentos()}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[12px] font-medium text-red-700 transition-colors hover:bg-red-50"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        ) : documentos.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[13px] font-medium text-gray-700">Todavía no hay documentos creados.</p>
            <p className="mt-1 text-[12px] text-gray-500">Completá el formulario de arriba para crear el primer borrador.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 bg-white">
            {documentos.map((documento) => {
              const isDraft = documento.estado === 'BORRADOR';
              const isAuthorized = documento.estado === 'AUTORIZADO';
              const isAnulado = documento.estado === 'ANULADO';
              const actionDisabled = authorizingId === documento.id_documento_clinico || downloadingId === documento.id_documento_clinico;

              return (
                <div key={documento.id_documento_clinico} className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-semibold text-gray-900">{documento.titulo}</p>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                        {documento.tipo_documento}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          isAuthorized
                            ? 'bg-green-50 text-green-700'
                            : isDraft
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {documento.estado}
                      </span>
                    </div>

                    <p className="mt-1.5 text-[12px] leading-relaxed text-gray-600 line-clamp-3">{documento.contenido}</p>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-gray-500">
                      <span>Emitido: {formatDate(documento.fecha_emision)}</span>
                      <span>Autorizado: {formatDate(documento.autorizado_en)}</span>
                      {documento.autorizado_por_nombre && <span>Por: {documento.autorizado_por_nombre}</span>}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
                    <button
                      type="button"
                      disabled={!isDraft || actionDisabled}
                      onClick={() => void handleAuthorize(documento)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {authorizingId === documento.id_documento_clinico ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Autorizar
                    </button>

                    <button
                      type="button"
                      disabled={!isAuthorized || actionDisabled || isAnulado}
                      onClick={() => void handleDownload(documento)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {downloadingId === documento.id_documento_clinico ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      Descargar PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
