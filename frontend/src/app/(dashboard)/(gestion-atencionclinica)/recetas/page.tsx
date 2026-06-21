'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  Eye,
  FileText,
  Loader2,
  Search,
  Users,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { documentosClinicosService } from '@/lib/services/documentos_clinicos';
import { historialService, type HistoriaClinica, type HistoriaClinicaDetalle } from '@/lib/services/historial';
import type { DocumentoClinicoAutorizado } from '@/lib/types';

function DocumentoCard({
  documento,
  onDownload,
}: {
  documento: DocumentoClinicoAutorizado;
  onDownload: (documento: DocumentoClinicoAutorizado) => void;
}) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{documento.titulo}</p>
          <p className="mt-1 text-xs text-gray-500">
            {documento.tipo_documento_display} · {new Date(documento.fecha_emision).toLocaleDateString('es-ES')}
          </p>
          {documento.contenido && <p className="mt-2 text-sm leading-6 text-gray-700">{documento.contenido}</p>}
        </div>
        <button
          type="button"
          disabled={!documento.tiene_archivo}
          onClick={() => onDownload(documento)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden />
          Descargar
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-500">
        <span className="rounded-full bg-gray-100 px-2 py-0.5">{documento.estado_display}</span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5">{documento.creador_nombre ?? 'Sistema'}</span>
        {documento.nombre_archivo && <span className="rounded-full bg-gray-100 px-2 py-0.5">{documento.nombre_archivo}</span>}
      </div>
    </article>
  );
}

export default function RecetasPage() {
  const { user, isLoading: authLoading } = useAuth();
  const isPatient = user?.tipo_usuario === 'PACIENTE';
  const historiaClinicaId = user?.paciente?.historia_clinica?.id_historia_clinica ?? null;
  const isStaff = !!user && !isPatient;

  const [documentos, setDocumentos] = useState<DocumentoClinicoAutorizado[]>([]);
  const [documentosLoading, setDocumentosLoading] = useState(true);
  const [documentosError, setDocumentosError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [historias, setHistorias] = useState<HistoriaClinica[]>([]);
  const [historiasLoading, setHistoriasLoading] = useState(false);
  const [selectedHistoriaId, setSelectedHistoriaId] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<HistoriaClinicaDetalle | null>(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleError, setDetalleError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPatient) return;

    if (!historiaClinicaId) {
      setDocumentos([]);
      setDocumentosLoading(false);
      return;
    }

    setDocumentosLoading(true);
    setDocumentosError(null);
    documentosClinicosService
      .list(historiaClinicaId)
      .then(setDocumentos)
      .catch(() => {
        setDocumentos([]);
        setDocumentosError('No se pudieron cargar tus recetas e indicaciones autorizadas.');
      })
      .finally(() => setDocumentosLoading(false));
  }, [historiaClinicaId, isPatient]);

  useEffect(() => {
    if (!isStaff) return;

    setHistoriasLoading(true);
    historialService
      .list({ search: search || undefined })
      .then((res) => {
        setHistorias(res.results);
        setSelectedHistoriaId((current) => {
          if (current && res.results.some((historia) => historia.id_historia_clinica === current)) {
            return current;
          }
          return res.results[0]?.id_historia_clinica ?? null;
        });
      })
      .catch(() => setHistorias([]))
      .finally(() => setHistoriasLoading(false));
  }, [isStaff, search]);

  useEffect(() => {
    if (!isStaff) return;
    if (!selectedHistoriaId) {
      setDetalle(null);
      setDetalleLoading(false);
      return;
    }

    setDetalleLoading(true);
    setDetalleError(null);
    historialService
      .get(selectedHistoriaId)
      .then(setDetalle)
      .catch(() => {
        setDetalle(null);
        setDetalleError('No se pudo cargar la historia clínica seleccionada.');
      })
      .finally(() => setDetalleLoading(false));
  }, [isStaff, selectedHistoriaId]);

  async function descargarDocumento(idHistoria: number, documento: DocumentoClinicoAutorizado) {
    if (!documento.tiene_archivo) return;

    try {
      const blob = await documentosClinicosService.download(idHistoria, documento.id_documento_clinico);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documento.nombre_archivo ?? `documento_${documento.id_documento_clinico}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDocumentosError('No se pudo descargar el documento clínico.');
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isStaff) {
    const documentosStaff = detalle?.recetas ?? [];

    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <FileText className="h-5 w-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">Atención clínica · CU26</span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Recetas e indicaciones médicas</h1>
              <p className="max-w-3xl text-sm text-gray-600 sm:text-base">
                Buscá una historia clínica y revisá ahí las recetas e indicaciones autorizadas.
              </p>
            </div>
            <Link
              href="/historial"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Abrir historial clínico
            </Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-4">
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar paciente o historia"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-gray-950">Historias encontradas</h2>
                  <p className="text-xs text-gray-500">Seleccioná una para ver sus recetas.</p>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                  {historias.length}
                </span>
              </div>

              {historiasLoading ? (
                <div className="flex items-center justify-center py-14 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : historias.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                  <Users className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-3 text-sm text-gray-500">No se encontraron historias.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
                  {historias.map((historia) => {
                    const active = selectedHistoriaId === historia.id_historia_clinica;
                    return (
                      <button
                        key={historia.id_historia_clinica}
                        type="button"
                        onClick={() => setSelectedHistoriaId(historia.id_historia_clinica)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          active
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{historia.paciente_nombre}</p>
                            <p className="mt-1 text-xs text-gray-500">HC-{historia.id_paciente}</p>
                          </div>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                            {historia.estado}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Apertura: {new Date(historia.fecha_apertura).toLocaleDateString('es-ES')}
                        </p>
                        {historia.motivo_apertura && (
                          <p className="mt-1 line-clamp-2 text-xs text-gray-600">{historia.motivo_apertura}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>

          <main className="space-y-4">
            {!selectedHistoriaId ? (
              <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center shadow-sm">
                <Eye className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-4 text-sm font-medium text-gray-500">Seleccioná un paciente para ver sus recetas.</p>
              </section>
            ) : detalleLoading ? (
              <section className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-24 shadow-sm">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </section>
            ) : detalleError ? (
              <section className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{detalleError}</section>
            ) : detalle ? (
              <div className="space-y-4">
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-gray-950">{detalle.paciente_nombre}</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Historia clínica {detalle.id_historia_clinica} · {detalle.estado}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-blue-50 px-4 py-3 text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Recetas</p>
                      <p className="text-2xl font-bold text-blue-900">{documentosStaff.length}</p>
                    </div>
                  </div>
                </section>

                {documentosStaff.length === 0 ? (
                  <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center shadow-sm">
                    <FileText className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-4 text-sm font-medium text-gray-500">Esta historia todavía no tiene recetas ni indicaciones.</p>
                  </section>
                ) : (
                  <section className="grid gap-3">
                    {documentosStaff.map((documento) => (
                      <DocumentoCard
                        key={documento.id_documento_clinico}
                        documento={documento}
                        onDownload={(doc) => void descargarDocumento(detalle.id_historia_clinica, doc)}
                      />
                    ))}
                  </section>
                )}
              </div>
            ) : null}

            {documentosError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {documentosError}
              </p>
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-10">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-indigo-600">
          <FileText className="h-5 w-5" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">Paciente · CU26</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Mis recetas e indicaciones</h1>
            <p className="max-w-3xl text-sm text-gray-600 sm:text-base">
              Acá ves tus documentos clínicos autorizados por la clínica. No se mezclan con el asistente virtual.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </div>
      </header>

      {!historiaClinicaId ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
            <div>
              <h2 className="text-sm font-bold">Sin historia clínica asociada</h2>
              <p className="mt-2 text-sm leading-6">
                Tu cuenta todavía no tiene una historia clínica vinculada, así que no podemos mostrar recetas.
              </p>
            </div>
          </div>
        </section>
      ) : documentosLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : documentosError ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{documentosError}</section>
      ) : documentos.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center shadow-sm">
          <Eye className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm font-medium text-gray-500">Aún no hay recetas o indicaciones disponibles.</p>
        </section>
      ) : (
        <section className="grid gap-3">
          {documentos.map((documento) => (
            <DocumentoCard
              key={documento.id_documento_clinico}
              documento={documento}
              onDownload={(doc) => void descargarDocumento(historiaClinicaId, doc)}
            />
          ))}
        </section>
      )}
    </div>
  );
}
