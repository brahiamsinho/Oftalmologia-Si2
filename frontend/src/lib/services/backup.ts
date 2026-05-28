/**
 * lib/services/backup.ts
 *
 * Backup/restore por tenant:
 *   GET/POST  /backup/
 *   GET       /backup/plan-info/
 *   POST      /backup/{id}/restore/
 *   GET       /backup/{id}/download/
 *   DELETE    /backup/{id}/
 *   GET/PATCH /backup-config/{id}/
 */

import api from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

export type BackupEstado =
  | 'PENDIENTE'
  | 'EN_PROGRESO'
  | 'COMPLETADO'
  | 'FALLIDO'
  | 'RESTAURADO'
  | 'EXPIRADO';

export interface TenantBackup {
  id_backup: number;
  estado: BackupEstado;
  tamaño_mb: number;
  creado_en: string;
  expira_en: string;
  dias_restantes: number;
  creado_por_nombre: string;
  restaurado_en: string | null;
  motivo_restore: string;
}

export interface BackupPlanInfo {
  plan_codigo: string;
  plan_nombre: string;
  max_backups: number;
  retencion_dias: number;
  permite_restore: boolean;
  permite_automatico: boolean;
  backups_actuales: number;
  backups_restantes: number;
}

export interface BackupConfig {
  id_config: number;
  backup_automatico: boolean;
  hora_backup: string;
  frecuencia: string;
  retencion_dias: number;
  creado_en: string;
  actualizado_en: string;
}

function unwrapList<T>(data: PaginatedResponse<T> | T[]): T[] {
  return Array.isArray(data) ? data : (data.results ?? []);
}

export const backupService = {
  async list(): Promise<TenantBackup[]> {
    const { data } = await api.get<PaginatedResponse<TenantBackup> | TenantBackup[]>('/backup/');
    return unwrapList(data);
  },

  async planInfo(): Promise<BackupPlanInfo> {
    const { data } = await api.get<BackupPlanInfo>('/backup/plan-info/');
    return data;
  },

  async create(): Promise<TenantBackup> {
    const { data } = await api.post<TenantBackup>('/backup/');
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/backup/${id}/`);
  },

  async restore(id: number, motivo: string): Promise<void> {
    await api.post(`/backup/${id}/restore/`, { confirmar: true, motivo });
  },

  async download(id: number): Promise<Blob> {
    const { data } = await api.get<Blob>(`/backup/${id}/download/`, {
      responseType: 'blob',
    });
    return data;
  },

  async getConfig(): Promise<BackupConfig | null> {
    const { data } = await api.get<PaginatedResponse<BackupConfig> | BackupConfig[]>(
      '/backup-config/',
    );
    const items = unwrapList(data);
    return items[0] ?? null;
  },

  async updateConfig(id: number, payload: Partial<BackupConfig>): Promise<BackupConfig> {
    const { data } = await api.patch<BackupConfig>(`/backup-config/${id}/`, payload);
    return data;
  },
};
