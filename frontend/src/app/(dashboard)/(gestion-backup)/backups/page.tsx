'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  DatabaseBackup,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  backupService,
  type BackupConfig,
  type BackupPlanInfo,
  type TenantBackup,
} from '@/lib/services/backup';

const ESTADO_STYLES: Record<string, string> = {
  COMPLETADO: 'bg-green-100 text-green-800',
  EN_PROGRESO: 'bg-blue-100 text-blue-800',
  PENDIENTE: 'bg-gray-100 text-gray-700',
  FALLIDO: 'bg-red-100 text-red-800',
  RESTAURADO: 'bg-purple-100 text-purple-800',
  EXPIRADO: 'bg-amber-100 text-amber-800',
};

function formatFecha(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-BO', { timeZone: 'America/La_Paz' });
  } catch {
    return iso;
  }
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<TenantBackup[]>([]);
  const [planInfo, setPlanInfo] = useState<BackupPlanInfo | null>(null);
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [restoreId, setRestoreId] = useState<number | null>(null);
  const [restoreMotivo, setRestoreMotivo] = useState('');
  const [confirmRestore, setConfirmRestore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, info, cfg] = await Promise.all([
        backupService.list(),
        backupService.planInfo(),
        backupService.getConfig(),
      ]);
      setBackups(list);
      setPlanInfo(info);
      setConfig(cfg);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string; detail?: string } } })?.response?.data
          ?.error ??
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'No se pudo cargar la información de backups.';
      setError(msg);
      setBackups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const canCreate =
    planInfo !== null &&
    (planInfo.max_backups === -1 || planInfo.backups_restantes > 0);

  const handleCreate = async () => {
    setWorking(true);
    setError('');
    try {
      await backupService.create();
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'No se pudo crear el backup.';
      setError(msg);
    } finally {
      setWorking(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este backup de forma permanente?')) return;
    setWorking(true);
    setError('');
    try {
      await backupService.remove(id);
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'No se pudo eliminar el backup.';
      setError(msg);
    } finally {
      setWorking(false);
    }
  };

  const handleDownload = async (id: number) => {
    setWorking(true);
    setError('');
    try {
      const blob = await backupService.download(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${id}.sql.gz`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo descargar el archivo.');
    } finally {
      setWorking(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreId || !confirmRestore) return;
    setWorking(true);
    setError('');
    try {
      await backupService.restore(restoreId, restoreMotivo.trim());
      setRestoreId(null);
      setRestoreMotivo('');
      setConfirmRestore(false);
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'No se pudo restaurar el backup.';
      setError(msg);
    } finally {
      setWorking(false);
    }
  };

  const toggleAutomatic = async () => {
    if (!config) return;
    setWorking(true);
    setError('');
    try {
      const updated = await backupService.updateConfig(config.id_config, {
        backup_automatico: !config.backup_automatico,
      });
      setConfig(updated);
    } catch {
      setError('No se pudo actualizar la configuración automática.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
            <DatabaseBackup className="w-6 h-6 text-blue-600" />
            Backups
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Copias de seguridad del esquema de tu clínica. Los automáticos los ejecuta el scheduler en Docker.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || working}
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={!canCreate || working}
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Crear backup manual
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-[13px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {planInfo && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Plan</p>
            <p className="text-[15px] font-bold text-gray-900 mt-1">{planInfo.plan_nombre}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Backups</p>
            <p className="text-[15px] font-bold text-gray-900 mt-1">
              {planInfo.backups_actuales}
              {planInfo.max_backups === -1 ? ' / ilimitados' : ` / ${planInfo.max_backups}`}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Retención</p>
            <p className="text-[15px] font-bold text-gray-900 mt-1">{planInfo.retencion_dias} días</p>
          </div>
        </div>
      )}

      {config && planInfo?.permite_automatico && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[14px] font-semibold text-gray-900">Backup automático</p>
            <p className="text-[12.5px] text-gray-500">
              Hora programada: {config.hora_backup.slice(0, 5)} ({config.frecuencia})
            </p>
          </div>
          <button
            type="button"
            onClick={() => void toggleAutomatic()}
            disabled={working}
            className={`px-4 py-2 text-[13px] font-semibold rounded-lg transition-colors ${
              config.backup_automatico
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {config.backup_automatico ? 'Activo' : 'Inactivo'}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[14px]">Cargando backups...</span>
          </div>
        ) : backups.length === 0 ? (
          <p className="text-center text-[14px] text-gray-500 py-16">
            No hay backups registrados todavía.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-[11px] tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Tamaño</th>
                  <th className="px-4 py-3 font-semibold">Creado</th>
                  <th className="px-4 py-3 font-semibold">Expira</th>
                  <th className="px-4 py-3 font-semibold">Por</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {backups.map((b) => (
                  <tr key={b.id_backup} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-mono text-gray-700">#{b.id_backup}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          ESTADO_STYLES[b.estado] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {b.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {Number(b.tamaño_mb).toFixed(2)} MB
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatFecha(b.creado_en)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatFecha(b.expira_en)}
                      {b.dias_restantes >= 0 && (
                        <span className="block text-[11px] text-gray-400">
                          {b.dias_restantes} días restantes
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.creado_por_nombre || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {b.estado === 'COMPLETADO' && (
                          <>
                            <button
                              type="button"
                              title="Descargar"
                              onClick={() => void handleDownload(b.id_backup)}
                              disabled={working}
                              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {planInfo?.permite_restore && (
                              <button
                                type="button"
                                title="Restaurar"
                                onClick={() => {
                                  setRestoreId(b.id_backup);
                                  setRestoreMotivo('');
                                  setConfirmRestore(false);
                                }}
                                disabled={working}
                                className="p-2 rounded-lg text-purple-600 hover:bg-purple-50 disabled:opacity-50"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          title="Eliminar"
                          onClick={() => void handleDelete(b.id_backup)}
                          disabled={working}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {restoreId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-[17px] font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Restaurar backup #{restoreId}
            </h3>
            <p className="text-[13px] text-orange-800 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              Esto reemplazará los datos actuales del tenant con el contenido del backup. Usá esta
              acción solo si sabés lo que hacés.
            </p>
            <textarea
              value={restoreMotivo}
              onChange={(e) => setRestoreMotivo(e.target.value)}
              placeholder="Motivo de la restauración (recomendado para auditoría)"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmRestore}
                onChange={(e) => setConfirmRestore(e.target.checked)}
                className="mt-1 w-4 h-4 rounded accent-orange-600"
              />
              <span className="text-[12.5px] text-gray-700">
                Confirmo que entiendo el riesgo y deseo restaurar este backup.
              </span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoreId(null)}
                className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleRestore()}
                disabled={!confirmRestore || working}
                className="px-4 py-2 text-[13px] font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50"
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
