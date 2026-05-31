'use client';

/**
 * CU18. Gestionar recordatorios y notificaciones automáticas
 * Ruta: /crm/recordatorios
 *
 * Tabs:
 *   1. Reglas   — CRUD de reglas de recordatorio (Administrador)
 *   2. Tareas   — listado de tareas programadas con filtro por estado
 *   3. Logs     — historial de ejecuciones del procesador
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Bell, Plus, RefreshCw, AlertTriangle, Pencil, Trash2,
  CheckCircle2, Clock, XCircle, Ban, ChevronRight,
  Zap, ClipboardList, Info, ToggleLeft, ToggleRight,
  CalendarClock, Play,
} from 'lucide-react';
import {
  notificacionesService,
  type ReglaRecordatorio,
  type ReglaRecordatorioPayload,
  type TareaRecordatorioProgramada,
  type LogEjecucion,
  TIPO_REGLA,
  TIPO_REGLA_LABEL,
  ESTADO_TAREA_LABEL,
} from '@/lib/services/notificaciones';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function fmtDateShort(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

const ESTADO_ICON: Record<string, React.ReactNode> = {
  PENDIENTE: <Clock className="w-4 h-4 text-amber-500" />,
  PROCESADA: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  ERROR:     <XCircle className="w-4 h-4 text-red-500" />,
  CANCELADA: <Ban className="w-4 h-4 text-gray-400" />,
};

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-800 border border-amber-200',
  PROCESADA: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  ERROR:     'bg-red-50 text-red-800 border border-red-200',
  CANCELADA: 'bg-gray-100 text-gray-600 border border-gray-200',
};

type Tab = 'reglas' | 'tareas' | 'logs';

// ── Modal Regla ────────────────────────────────────────────────────────────

const REGLA_DEFAULTS: ReglaRecordatorioPayload = {
  nombre: '',
  tipo_regla: TIPO_REGLA.RECORDATORIO_CITA,
  horas_antes: 24,
  titulo_template: 'Recordatorio: {paciente}',
  cuerpo_template: 'Hola {paciente}, te recordamos tu cita el {fecha_cita}.',
  activa: true,
};

function ModalRegla({
  regla,
  onClose,
  onSaved,
}: {
  regla: ReglaRecordatorio | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = regla === null;
  const [form, setForm] = useState<ReglaRecordatorioPayload>(
    isNew ? REGLA_DEFAULTS : {
      nombre:           regla.nombre,
      tipo_regla:       regla.tipo_regla,
      horas_antes:      regla.horas_antes,
      titulo_template:  regla.titulo_template,
      cuerpo_template:  regla.cuerpo_template,
      activa:           regla.activa,
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (key: keyof ReglaRecordatorioPayload, val: unknown) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (form.horas_antes < 1) { setError('Las horas deben ser mayores a 0.'); return; }
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        await notificacionesService.createRegla(form);
      } else {
        await notificacionesService.updateRegla(regla.id_regla, form);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar. Intente de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">CRM · Recordatorios</p>
            <h2 className="text-[16px] font-bold text-gray-900">
              {isNew ? 'Nueva regla de recordatorio' : 'Editar regla'}
            </h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void submit(e)} className="px-6 py-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1">Nombre de la regla *</label>
            <input
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              placeholder="Ej. Recordatorio de cita 48h"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          {/* Tipo + Horas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1">Tipo de regla *</label>
              <select
                value={form.tipo_regla}
                onChange={e => set('tipo_regla', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-blue-400 bg-white"
              >
                {Object.entries(TIPO_REGLA_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1">Horas de anticipación *</label>
              <input
                type="number"
                min={1}
                value={form.horas_antes}
                onChange={e => set('horas_antes', parseInt(e.target.value) || 1)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Título template */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1">
              Título del mensaje
              <span className="ml-1 text-[11px] font-normal text-gray-400">(variables: {'{paciente}'}, {'{fecha_cita}'}, {'{fecha_control}'})</span>
            </label>
            <input
              value={form.titulo_template}
              onChange={e => set('titulo_template', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          {/* Cuerpo template */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1">Cuerpo del mensaje</label>
            <textarea
              rows={3}
              value={form.cuerpo_template}
              onChange={e => set('cuerpo_template', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none"
            />
          </div>

          {/* Activa */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => set('activa', !form.activa)}
              className={`w-10 h-5 rounded-full transition-colors ${form.activa ? 'bg-blue-600' : 'bg-gray-200'} relative flex-shrink-0`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.activa ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-[13px] font-medium text-gray-700">Regla activa</span>
          </label>

          {error && (
            <div className="flex items-center gap-2 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-[13px] font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {saving ? 'Guardando…' : isNew ? 'Crear regla' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tab Reglas ─────────────────────────────────────────────────────────────

function TabReglas() {
  const [items, setItems]     = useState<ReglaRecordatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [modal, setModal]     = useState<{ open: boolean; regla: ReglaRecordatorio | null }>({ open: false, regla: null });
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificacionesService.listReglas();
      setItems(data);
    } catch {
      setError('No se pudieron cargar las reglas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la regla "${nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    try {
      await notificacionesService.deleteRegla(id);
      await load();
    } catch {
      alert('No se pudo eliminar la regla.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-gray-500">
          Las reglas definen cuándo y qué mensaje enviar al paciente según el evento.
        </p>
        <div className="flex gap-2">
          <button onClick={() => void load()} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => setModal({ open: true, regla: null })}
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva regla
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[13px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {loading && !items.length && (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse h-20 rounded-2xl bg-gray-100" />
          ))}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-14 rounded-2xl border border-dashed border-gray-200 bg-white">
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Bell className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
          </div>
          <p className="text-[14px] font-semibold text-gray-800">Sin reglas configuradas</p>
          <p className="text-[12px] text-gray-500 mt-1">Crea la primera regla para comenzar a enviar recordatorios automáticos.</p>
        </div>
      )}

      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map(r => (
            <li key={r.id_regla} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center
                    ${r.activa ? 'bg-blue-50' : 'bg-gray-100'}`}>
                    {r.activa
                      ? <ToggleRight className="w-5 h-5 text-blue-600" />
                      : <ToggleLeft className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-bold text-gray-900">{r.nombre}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                        ${r.activa ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {r.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      {TIPO_REGLA_LABEL[r.tipo_regla] ?? r.tipo_regla} · {r.horas_antes}h de anticipación
                    </p>
                    <p className="text-[12px] text-gray-600 mt-1.5 italic line-clamp-1">
                      &ldquo;{r.titulo_template}&rdquo;
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setModal({ open: true, regla: r })}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => void handleDelete(r.id_regla, r.nombre)}
                    disabled={deleting === r.id_regla}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-2 gap-2 text-[11px] text-gray-400">
                <span>Creado: {fmtDateShort(r.created_at)}</span>
                <span>Actualizado: {fmtDateShort(r.updated_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal.open && (
        <ModalRegla
          regla={modal.regla}
          onClose={() => setModal({ open: false, regla: null })}
          onSaved={() => void load()}
        />
      )}
    </div>
  );
}

// ── Tab Tareas ─────────────────────────────────────────────────────────────

function TabTareas() {
  const [items, setItems]       = useState<TareaRecordatorioProgramada[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [processing, setProcessing]     = useState(false);
  const [processResult, setProcessResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificacionesService.listTareas(filtroEstado ? { estado: filtroEstado } : undefined);
      setItems(data);
    } catch {
      setError('No se pudieron cargar las tareas.');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => { void load(); }, [load]);

  const procesarLote = async () => {
    setProcessing(true);
    setProcessResult(null);
    try {
      const res = await notificacionesService.procesarLote();
      setProcessResult(`✓ Se procesaron ${res.procesadas ?? 0} tarea(s) correctamente.`);
      await load();
    } catch {
      setProcessResult('⚠ Error al procesar el lote.');
    } finally {
      setProcessing(false);
    }
  };

  const ESTADOS = ['', 'PENDIENTE', 'PROCESADA', 'ERROR', 'CANCELADA'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex gap-2 flex-wrap">
          {ESTADOS.map(e => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-xl border transition-colors
                ${filtroEstado === e
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {e === '' ? 'Todas' : ESTADO_TAREA_LABEL[e] ?? e}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load()} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => void procesarLote()}
            disabled={processing}
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
          >
            <Play className="w-3.5 h-3.5" />
            {processing ? 'Procesando…' : 'Procesar pendientes'}
          </button>
        </div>
      </div>

      {processResult && (
        <div className={`flex items-center gap-2 text-[13px] rounded-xl px-4 py-3 border
          ${processResult.startsWith('✓') ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          {processResult}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-[13px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-14 rounded-2xl bg-gray-100" />)}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-dashed border-gray-200 bg-white">
          <CalendarClock className="mx-auto w-10 h-10 text-gray-300 mb-2" strokeWidth={1.3} />
          <p className="text-[14px] font-semibold text-gray-700">Sin tareas para este filtro</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Estado</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Paciente</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Programada para</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Intentos</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Procesada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map(t => (
                <tr key={t.id_tarea} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {ESTADO_ICON[t.estado]}
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_BADGE[t.estado] ?? ''}`}>
                        {ESTADO_TAREA_LABEL[t.estado] ?? t.estado}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{t.nombre_paciente ?? t.id_paciente}</td>
                  <td className="px-4 py-3 text-gray-600">{fmtDate(t.programada_para)}</td>
                  <td className="px-4 py-3 text-gray-500 tabular-nums">{t.intentos}</td>
                  <td className="px-4 py-3 text-gray-500">{t.procesada_en ? fmtDate(t.procesada_en) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Tab Logs ───────────────────────────────────────────────────────────────

function TabLogs() {
  const [items, setItems]     = useState<LogEjecucion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificacionesService.listLogs();
      setItems(data);
    } catch {
      setError('No se pudieron cargar los logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => void load()} className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[13px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-12 rounded-xl bg-gray-100" />)}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-dashed border-gray-200 bg-white">
          <ClipboardList className="mx-auto w-10 h-10 text-gray-300 mb-2" strokeWidth={1.3} />
          <p className="text-[14px] font-semibold text-gray-700">Sin registros de ejecución</p>
        </div>
      )}

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map(log => (
            <li key={log.id_log}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-[13px]
                ${log.nivel === 'ERROR'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-white border-gray-100'}`}
            >
              {log.nivel === 'ERROR'
                ? <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                : <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              }
              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${log.nivel === 'ERROR' ? 'text-red-800' : 'text-gray-800'}`}>
                  {log.mensaje}
                </p>
                {log.detalle && (
                  <p className="text-[12px] text-gray-500 mt-0.5 font-mono break-all line-clamp-2">{log.detalle}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">{fmtDate(log.ejecutado_en)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────

const TAB_CONFIG: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'reglas', label: 'Reglas',  icon: Bell,          desc: 'Configura cuándo y qué mensaje enviar' },
  { id: 'tareas', label: 'Tareas',  icon: CalendarClock, desc: 'Recordatorios programados por evento' },
  { id: 'logs',   label: 'Logs',    icon: ClipboardList, desc: 'Historial de ejecución del procesador' },
];

export default function RecordatoriosPage() {
  const [tab, setTab] = useState<Tab>('reglas');

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-sm">
            <Bell className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">CRM</p>
            <h1 className="text-2xl font-bold text-gray-900">Recordatorios automáticos</h1>
            <p className="mt-0.5 max-w-xl text-sm text-gray-600">
              CU18 — Gestiona las reglas de recordatorio, visualiza tareas programadas y revisa el historial de envíos.
            </p>
          </div>
        </div>

        {/* Info chips */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[12px] font-semibold text-emerald-700">
            <Zap className="w-3.5 h-3.5" />
            Cron activo · cada 60s
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[12px] font-semibold text-blue-700">
            <Bell className="w-3.5 h-3.5" />
            Push FCM
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {TAB_CONFIG.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all
                ${tab === t.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Descripción del tab activo */}
      <div className="flex items-center gap-2 text-[12px] text-gray-500">
        <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
        {TAB_CONFIG.find(t => t.id === tab)?.desc}
      </div>

      {/* Contenido */}
      {tab === 'reglas' && <TabReglas />}
      {tab === 'tareas' && <TabTareas />}
      {tab === 'logs'   && <TabLogs />}
    </div>
  );
}
