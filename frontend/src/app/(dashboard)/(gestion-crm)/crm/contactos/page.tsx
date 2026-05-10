'use client';

/**
 * CU16 — Gestionar CRM para la comunicación con pacientes
 *
 * Ruta: /crm/contactos
 * Backend: GET/POST/PATCH/DELETE /crm-contactos/
 *          GET /crm-campanas/ (para el selector de campaña en el formulario)
 *
 * Funcionalidades:
 *  - Registrar comunicaciones dirigidas a un paciente (mensaje, recordatorio, notificación…)
 *  - Filtrar por canal, tipo de mensaje y estado de comunicación
 *  - Registrar la respuesta o interacción del paciente
 *  - Consultar historial completo de comunicaciones
 *  - Validación: estado=RESPONDIDO requiere respuesta_paciente
 */

import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Phone, Mail, MessageCircle, Plus, Search,
  Trash2, Pencil, X, AlertTriangle, CheckCircle2, Clock,
  Send, Eye, Ban, RefreshCw, Reply,
} from 'lucide-react';
import { pacientesService } from '@/lib/services/pacientes';
import {
  historialContactoService,
  campanaCRMService,
  CANAL_LABELS,
  TIPO_MENSAJE_LABELS,
  ESTADO_COM_LABELS,
  ESTADO_COMUNICACION,
  type HistorialContacto,
  type HistorialContactoCreate,
} from '@/lib/services/crm';
import type { Paciente } from '@/lib/types';
import type { CampanaCRM } from '@/lib/services/crm';

// ── Helpers de color y display ──────────────────────────────────────────────

const ESTADO_BORDER: Record<string, string> = {
  PENDIENTE:  'border-l-yellow-400',
  ENVIADO:    'border-l-blue-400',
  ENTREGADO:  'border-l-indigo-400',
  LEIDO:      'border-l-purple-400',
  RESPONDIDO: 'border-l-green-500',
  FALLIDO:    'border-l-red-500',
};

const ESTADO_BADGE: Record<string, string> = {
  PENDIENTE:  'bg-yellow-50 text-yellow-700 border border-yellow-200',
  ENVIADO:    'bg-blue-50 text-blue-700 border border-blue-200',
  ENTREGADO:  'bg-indigo-50 text-indigo-700 border border-indigo-200',
  LEIDO:      'bg-purple-50 text-purple-700 border border-purple-200',
  RESPONDIDO: 'bg-green-50 text-green-700 border border-green-200',
  FALLIDO:    'bg-red-50 text-red-700 border border-red-200',
};

const TIPO_BADGE: Record<string, string> = {
  RECORDATORIO: 'bg-amber-50 text-amber-700',
  NOTIFICACION: 'bg-cyan-50 text-cyan-700',
  SEGUIMIENTO:  'bg-sky-50 text-sky-700',
  RESULTADO:    'bg-violet-50 text-violet-700',
  INFORMATIVO:  'bg-slate-100 text-slate-600',
  OTRO:         'bg-gray-100 text-gray-600',
};

function CanalIcon({ canal, size = 14 }: { canal: string; size?: number }) {
  const cls = `flex-shrink-0 text-gray-400`;
  if (canal === 'WHATSAPP') return <MessageCircle className={cls} style={{ width: size, height: size }} />;
  if (canal === 'EMAIL')    return <Mail           className={cls} style={{ width: size, height: size }} />;
  if (canal === 'LLAMADA')  return <Phone          className={cls} style={{ width: size, height: size }} />;
  if (canal === 'SMS')      return <MessageSquare  className={cls} style={{ width: size, height: size }} />;
  return <MessageSquare className={cls} style={{ width: size, height: size }} />;
}

function estadoIcon(estado: string) {
  if (estado === 'PENDIENTE')  return <Clock        className="w-3 h-3" />;
  if (estado === 'ENVIADO')    return <Send         className="w-3 h-3" />;
  if (estado === 'ENTREGADO')  return <CheckCircle2 className="w-3 h-3" />;
  if (estado === 'LEIDO')      return <Eye          className="w-3 h-3" />;
  if (estado === 'RESPONDIDO') return <Reply        className="w-3 h-3" />;
  if (estado === 'FALLIDO')    return <Ban          className="w-3 h-3" />;
  return null;
}

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Interfaces internas ─────────────────────────────────────────────────────

interface FormData {
  id_paciente:          string;
  id_campana:           string;
  canal:                string;
  tipo_mensaje:         string;
  fecha_contacto:       string;
  asunto:               string;
  mensaje:              string;
  respuesta_paciente:   string;
  resultado:            string;
  estado_comunicacion:  string;
  observaciones:        string;
}

const EMPTY_FORM: FormData = {
  id_paciente:         '',
  id_campana:          '',
  canal:               'WHATSAPP',
  tipo_mensaje:        'SEGUIMIENTO',
  fecha_contacto:      new Date().toISOString().slice(0, 16),
  asunto:              '',
  mensaje:             '',
  respuesta_paciente:  '',
  resultado:           '',
  estado_comunicacion: 'PENDIENTE',
  observaciones:       '',
};

// ── Componente principal ─────────────────────────────────────────────────────

export default function CRMContactosPage() {
  // Datos
  const [contactos, setContactos]     = useState<HistorialContacto[]>([]);
  const [pacientes, setPacientes]     = useState<Paciente[]>([]);
  const [campanas, setCampanas]       = useState<CampanaCRM[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // Filtros
  const [search, setSearch]                 = useState('');
  const [filterTipo, setFilterTipo]         = useState('');
  const [filterEstado, setFilterEstado]     = useState('');
  const [filterCanal, setFilterCanal]       = useState('');

  // Modal CRUD
  const [modalOpen, setModalOpen]           = useState(false);
  const [editing, setEditing]               = useState<HistorialContacto | null>(null);
  const [form, setForm]                     = useState<FormData>(EMPTY_FORM);
  const [formError, setFormError]           = useState<string | null>(null);
  const [saving, setSaving]                 = useState(false);

  // Modal eliminar
  const [deleteTarget, setDeleteTarget]     = useState<HistorialContacto | null>(null);
  const [deleting, setDeleting]             = useState(false);

  // ── Carga de datos ────────────────────────────────────────────────────────

  const loadContactos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await historialContactoService.list({
        search:              search || undefined,
        tipo_mensaje:        filterTipo   || undefined,
        estado_comunicacion: filterEstado || undefined,
        canal:               filterCanal  || undefined,
      });
      setContactos(res.results ?? (Array.isArray(res) ? res : []));
    } catch {
      setError('Error al cargar el historial de comunicaciones.');
    } finally {
      setLoading(false);
    }
  }, [search, filterTipo, filterEstado, filterCanal]);

  useEffect(() => { loadContactos(); }, [loadContactos]);

  useEffect(() => {
    pacientesService.list({ page_size: 500 } as never)
      .then(r => setPacientes(r.results ?? (Array.isArray(r) ? r : [])))
      .catch(() => {});
    campanaCRMService.list()
      .then(r => setCampanas(r.results ?? (Array.isArray(r) ? r : [])))
      .catch(() => {});
  }, []);

  // ── Estadísticas ──────────────────────────────────────────────────────────

  const total       = contactos.length;
  const pendientes  = contactos.filter(c => c.estado_comunicacion === 'PENDIENTE').length;
  const respondidos = contactos.filter(c => c.estado_comunicacion === 'RESPONDIDO').length;
  const fallidos    = contactos.filter(c => c.estado_comunicacion === 'FALLIDO').length;

  // ── Helpers de nombre ─────────────────────────────────────────────────────

  function nombrePaciente(id: number) {
    const p = pacientes.find(p => p.id_paciente === id);
    return p ? `${p.nombres} ${p.apellidos}` : `Paciente #${id}`;
  }
  function nombreCampana(id: number | null) {
    if (!id) return null;
    const c = campanas.find(c => c.id_campana === id);
    return c ? c.nombre : `Campaña #${id}`;
  }

  // ── Modal CRUD ────────────────────────────────────────────────────────────

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(c: HistorialContacto) {
    setEditing(c);
    setForm({
      id_paciente:         String(c.id_paciente),
      id_campana:          c.id_campana ? String(c.id_campana) : '',
      canal:               c.canal,
      tipo_mensaje:        c.tipo_mensaje,
      fecha_contacto:      c.fecha_contacto.slice(0, 16),
      asunto:              c.asunto ?? '',
      mensaje:             c.mensaje ?? '',
      respuesta_paciente:  c.respuesta_paciente ?? '',
      resultado:           c.resultado ?? '',
      estado_comunicacion: c.estado_comunicacion,
      observaciones:       c.observaciones ?? '',
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function setField(key: keyof FormData, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function validate(): string | null {
    if (!form.id_paciente) return 'Debes seleccionar un paciente.';
    if (!form.canal)        return 'Debes seleccionar el canal de contacto.';
    if (
      form.estado_comunicacion === ESTADO_COMUNICACION.RESPONDIDO &&
      !form.respuesta_paciente.trim()
    ) {
      return 'Debes registrar la respuesta del paciente para marcar el estado como "Respondido".';
    }
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) { setFormError(err); return; }

    setSaving(true);
    setFormError(null);
    try {
      const payload: HistorialContactoCreate = {
        id_paciente:         Number(form.id_paciente),
        id_campana:          form.id_campana ? Number(form.id_campana) : null,
        canal:               form.canal,
        tipo_mensaje:        form.tipo_mensaje,
        fecha_contacto:      form.fecha_contacto,
        asunto:              form.asunto || undefined,
        mensaje:             form.mensaje || undefined,
        respuesta_paciente:  form.respuesta_paciente || undefined,
        resultado:           form.resultado || undefined,
        estado_comunicacion: form.estado_comunicacion,
        observaciones:       form.observaciones || undefined,
      };
      if (editing) {
        await historialContactoService.update(editing.id_historial_contacto, payload);
      } else {
        await historialContactoService.create(payload);
      }
      closeModal();
      loadContactos();
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setFormError(detail ?? 'Error al guardar. Verifica los datos.');
    } finally {
      setSaving(false);
    }
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await historialContactoService.destroy(deleteTarget.id_historial_contacto);
      setDeleteTarget(null);
      loadContactos();
    } catch {
      // silencioso — se muestra el modal
    } finally {
      setDeleting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comunicaciones CRM</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Registro y seguimiento de todas las interacciones con los pacientes
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm
                     font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva comunicación
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total" value={total}       color="blue"  />
        <StatCard label="Pendientes" value={pendientes}  color="yellow" />
        <StatCard label="Respondidas" value={respondidos} color="green"  />
        <StatCard label="Fallidas"   value={fallidos}    color={fallidos > 0 ? 'red' : 'gray'} />
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por paciente, asunto o mensaje…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterTipo}
          onChange={e => setFilterTipo(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600
                     focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Tipo de mensaje</option>
          {Object.entries(TIPO_MENSAJE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600
                     focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Estado</option>
          {Object.entries(ESTADO_COM_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filterCanal}
          onChange={e => setFilterCanal(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600
                     focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Canal</option>
          {Object.entries(CANAL_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <button
          onClick={loadContactos}
          className="px-3 py-2 border border-gray-200 rounded-lg text-gray-500
                     hover:bg-gray-50 transition-colors"
          title="Recargar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Lista ── */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Cargando comunicaciones…
        </div>
      ) : contactos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No se encontraron comunicaciones registradas.</p>
          <button
            onClick={openCreate}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium
                       rounded-lg hover:bg-blue-700 transition-colors"
          >
            Registrar primera comunicación
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {contactos.map(c => (
            <ContactoCard
              key={c.id_historial_contacto}
              contacto={c}
              pacienteNombre={nombrePaciente(c.id_paciente)}
              campanaNombre={nombreCampana(c.id_campana)}
              onEdit={() => openEdit(c)}
              onDelete={() => setDeleteTarget(c)}
            />
          ))}
        </div>
      )}

      {/* ── Modal CRUD ── */}
      {modalOpen && (
        <ModalContacto
          form={form}
          setField={setField}
          editing={editing}
          pacientes={pacientes}
          campanas={campanas}
          formError={formError}
          saving={saving}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {/* ── Modal confirmar eliminar ── */}
      {deleteTarget && (
        <ModalConfirmDelete
          pacienteNombre={nombrePaciente(deleteTarget.id_paciente)}
          canal={deleteTarget.canal}
          deleting={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: {
  label: string; value: number;
  color: 'blue' | 'yellow' | 'green' | 'red' | 'gray';
}) {
  const colors = {
    blue:   'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    green:  'bg-green-50 text-green-700',
    red:    'bg-red-50 text-red-700',
    gray:   'bg-gray-50 text-gray-600',
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5 opacity-80">{label}</p>
    </div>
  );
}

// ── ContactoCard ─────────────────────────────────────────────────────────────

function ContactoCard({ contacto, pacienteNombre, campanaNombre, onEdit, onDelete }: {
  contacto: HistorialContacto;
  pacienteNombre: string;
  campanaNombre: string | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const borderClass = ESTADO_BORDER[contacto.estado_comunicacion] ?? 'border-l-gray-300';
  const badgeClass  = ESTADO_BADGE[contacto.estado_comunicacion]  ?? 'bg-gray-50 text-gray-600 border border-gray-200';
  const tipoBadge   = TIPO_BADGE[contacto.tipo_mensaje]            ?? 'bg-gray-100 text-gray-600';

  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${borderClass}
                     shadow-sm hover:shadow-md transition-shadow p-4`}>
      <div className="flex items-start justify-between gap-3">

        {/* Contenido principal */}
        <div className="flex-1 min-w-0 space-y-2">

          {/* Fila superior: paciente + canal + tipo + estado */}
          <div className="flex flex-wrap items-center gap-2">
            <CanalIcon canal={contacto.canal} size={15} />
            <span className="text-[13px] font-semibold text-gray-900 truncate">
              {pacienteNombre}
            </span>
            <span className="text-[11px] text-gray-400">{CANAL_LABELS[contacto.canal]}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tipoBadge}`}>
              {TIPO_MENSAJE_LABELS[contacto.tipo_mensaje]}
            </span>
            <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
              {estadoIcon(contacto.estado_comunicacion)}
              {ESTADO_COM_LABELS[contacto.estado_comunicacion]}
            </span>
          </div>

          {/* Asunto */}
          {contacto.asunto && (
            <p className="text-[13px] font-medium text-gray-700 truncate">
              {contacto.asunto}
            </p>
          )}

          {/* Preview del mensaje */}
          {contacto.mensaje && (
            <p className="text-[12px] text-gray-500 line-clamp-2">
              {contacto.mensaje}
            </p>
          )}

          {/* Respuesta del paciente */}
          {contacto.respuesta_paciente && (
            <div className="flex items-start gap-1.5 bg-green-50 border border-green-200
                            rounded-lg px-3 py-2 mt-1">
              <Reply className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-green-700 line-clamp-2">
                {contacto.respuesta_paciente}
              </p>
            </div>
          )}

          {/* Footer: fecha + campaña */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 pt-0.5">
            <span>{formatDate(contacto.fecha_contacto)}</span>
            {campanaNombre && (
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                {campanaNombre}
              </span>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                       hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                       hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal CRUD ───────────────────────────────────────────────────────────────

function ModalContacto({ form, setField, editing, pacientes, campanas, formError, saving, onSave, onClose }: {
  form: FormData;
  setField: (k: keyof FormData, v: string) => void;
  editing: HistorialContacto | null;
  pacientes: Paciente[];
  campanas: CampanaCRM[];
  formError: string | null;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const isRespondido = form.estado_comunicacion === ESTADO_COMUNICACION.RESPONDIDO;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">
              {editing ? 'Editar comunicación' : 'Nueva comunicación'}
            </h2>
            <p className="text-[12px] text-gray-400 mt-0.5">CU16 — CRM</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Error global */}
          {formError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {formError}
            </div>
          )}

          {/* ── Sección 1: Paciente y campaña ── */}
          <section>
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              Paciente y campaña
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                  Paciente <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.id_paciente}
                  onChange={e => setField('id_paciente', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Seleccionar paciente…</option>
                  {pacientes.map(p => (
                    <option key={p.id_paciente} value={p.id_paciente}>
                      {p.nombres} {p.apellidos}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                  Campaña CRM <span className="text-gray-400 text-[11px]">(opcional)</span>
                </label>
                <select
                  value={form.id_campana}
                  onChange={e => setField('id_campana', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Sin campaña</option>
                  {campanas.map(c => (
                    <option key={c.id_campana} value={c.id_campana}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* ── Sección 2: Canal, tipo y estado ── */}
          <section>
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              Canal, tipo y estado
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                  Canal de contacto <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.canal}
                  onChange={e => setField('canal', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {Object.entries(CANAL_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                  Tipo de mensaje
                </label>
                <select
                  value={form.tipo_mensaje}
                  onChange={e => setField('tipo_mensaje', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {Object.entries(TIPO_MENSAJE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                  Estado de la comunicación
                </label>
                <select
                  value={form.estado_comunicacion}
                  onChange={e => setField('estado_comunicacion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {Object.entries(ESTADO_COM_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                  Fecha de contacto
                </label>
                <input
                  type="datetime-local"
                  value={form.fecha_contacto}
                  onChange={e => setField('fecha_contacto', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Aviso si estado = RESPONDIDO pero no hay respuesta */}
            {isRespondido && !form.respuesta_paciente.trim() && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-[12px]">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Marcaste el estado como <strong>Respondido</strong> pero aún no registraste la respuesta del paciente (sección 4).
              </div>
            )}
          </section>

          {/* ── Sección 3: Contenido del mensaje ── */}
          <section>
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              Contenido del mensaje enviado
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                  Asunto / Título <span className="text-gray-400 text-[11px]">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.asunto}
                  onChange={e => setField('asunto', e.target.value)}
                  placeholder="Ej: Recordatorio control postoperatorio — 10 días"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                  Mensaje enviado al paciente
                </label>
                <textarea
                  rows={3}
                  value={form.mensaje}
                  onChange={e => setField('mensaje', e.target.value)}
                  placeholder="Escribe aquí el contenido del mensaje enviado al paciente…"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* ── Sección 4: Respuesta del paciente ── */}
          <section>
            <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-3
              ${isRespondido ? 'text-green-600' : 'text-gray-400'}`}>
              Respuesta e interacción del paciente
              {isRespondido && <span className="text-red-500 ml-1">*</span>}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                  Respuesta del paciente
                  {isRespondido && <span className="text-red-500 ml-1">*</span>}
                </label>
                <textarea
                  rows={3}
                  value={form.respuesta_paciente}
                  onChange={e => setField('respuesta_paciente', e.target.value)}
                  placeholder="Registra la respuesta o interacción del paciente…"
                  className={`w-full px-3 py-2 border rounded-lg text-sm resize-none
                              focus:outline-none focus:ring-2 transition-colors
                              ${isRespondido
                                ? 'border-green-300 focus:ring-green-400 bg-green-50/30'
                                : 'border-gray-200 focus:ring-blue-500'}`}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
                  Observaciones internas
                </label>
                <textarea
                  rows={2}
                  value={form.observaciones}
                  onChange={e => setField('observaciones', e.target.value)}
                  placeholder="Notas internas del equipo, contexto adicional…"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg
                       hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg
                       hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Registrar comunicación'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal confirmar eliminar ──────────────────────────────────────────────────

function ModalConfirmDelete({ pacienteNombre, canal, deleting, onConfirm, onClose }: {
  pacienteNombre: string;
  canal: string;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-gray-900">Eliminar comunicación</h3>
            <p className="text-sm text-gray-500 mt-1">
              ¿Eliminar el registro de contacto por <strong>{CANAL_LABELS[canal]}</strong> con{' '}
              <strong>{pacienteNombre}</strong>? Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg
                       hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
