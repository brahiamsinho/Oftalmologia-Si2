import api, { fetchAll } from '@/lib/api';
import type { DocumentoClinicoAutorizado } from '@/lib/types';

export interface DocumentosClinicosParams {
  estado?: string;
  tipo_documento?: string;
}

function buildQuery(params?: DocumentosClinicosParams): string {
  const q = new URLSearchParams();
  if (params?.estado) q.set('estado', params.estado);
  if (params?.tipo_documento) q.set('tipo_documento', params.tipo_documento);
  const str = q.toString();
  return str ? `?${str}` : '';
}

export const documentosClinicosService = {
  async list(idHistoriaClinica: number, params?: DocumentosClinicosParams): Promise<DocumentoClinicoAutorizado[]> {
    return fetchAll<DocumentoClinicoAutorizado>(
      `/historias-clinicas/${idHistoriaClinica}/documentos-clinicos/${buildQuery(params)}`,
    );
  },

  async download(idHistoriaClinica: number, idDocumentoClinico: number): Promise<Blob> {
    const { data } = await api.get<Blob>(
      `/historias-clinicas/${idHistoriaClinica}/documentos-clinicos/${idDocumentoClinico}/download/`,
      { responseType: 'blob' },
    );
    return data;
  },
};
