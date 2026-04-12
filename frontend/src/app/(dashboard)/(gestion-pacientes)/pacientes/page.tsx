'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Plus, Phone, Mail, Calendar, Eye,
  SlidersHorizontal, Loader2, Pencil, Trash2,
  X, ChevronDown, User,
} from 'lucide-react';
import { pacientesService } from '@/lib/services';
import type { Paciente, PacienteCreate, EstadoPaciente, TipoDocumento, Sexo } from '@/lib/types';

// ── Constantes ────────────────────────────────────────────────────────────────
const BADGE: Record<EstadoPaciente, string> = {
  ACTIVO:         'bg-blue-100 text-blue-700',
  EN_SEGUIMIENTO: 'bg-yellow-100 text-yellow-700',
  POSTOPERATORIO: 'bg-green-100 text-green-700',
  INACTIVO:       'bg-gray-100 text-gray-500',
};
const LABEL: Record<EstadoPaciente, string> = {
  ACTIVO:         'Activo',
  EN_SEGUIMIENTO: 'En seguimiento',
  POSTOPERATORIO: 'Postoperatorio',
  INACTIVO:       'Inactivo',
};

function calcEdad(fecha: string | null): string {
  if (!fecha) return '—';
  const hoy = new Date();
  const nac = new Date(fecha);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return `${edad} años`;
}

// ── Componentes de formulario (nivel módulo para evitar pérdida de foco) ──────
/** Fondo uniforme (evita el azul del autocompletado del navegador en algunos campos). */
const inputBase =
  'w-full h-10 px-3.5 rounded-xl border text-[13px] bg-gray-50 text-gray-900 placeholder:text-gray-400 ' +
  '[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_rgb(249,250,251)] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827]';

const inputCls = (err?: string) =>
  `${inputBase}
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
   ${err ? 'border-red-300' : 'border-gray-200'}`;

const selectCls = (err?: string) =>
  `w-full h-10 px-3.5 pr-9 rounded-xl border text-[13px] bg-gray-50 text-gray-900 appearance-none
   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
   ${err ? 'border-red-300' : 'border-gray-200'}`;

function Field({
  label, required, error, children,
}: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12.5px] font-medium text-gray-700 mb-1.5">
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

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  paciente: Paciente | null;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY: PacienteCreate = {
  tipo_documento:  'DNI',
  numero_documento: '',
  nombres:          '',
  apellidos:        '',
  fecha_nacimiento: '',
  sexo:             'M',
  email:            '',
  telefono:         '',
  contacto_emergencia_nombre:   '',
  contacto_emergencia_telefono: '',
  direccion:        '',
  estado_paciente:  'ACTIVO',
  observaciones_generales: '',
};

function PacienteModal({ paciente, onClose, onSaved }: ModalProps) {
  const isEdit = paciente !== null;

  const [form, setForm] = useState<PacienteCreate>(() =>
    isEdit
      ? {
          tipo_documento:              paciente.tipo_documento  as TipoDocumento,
          numero_documento:            paciente.numero_documento,
          nombres:                     paciente.nombres,
          apellidos:                   paciente.apellidos,
          fecha_nacimiento:            paciente.fecha_nacimiento ?? '',
          sexo:                        (paciente.sexo ?? 'M') as Sexo,
          email:                       paciente.email            ?? '',
          telefono:                    paciente.telefono         ?? '',
          contacto_emergencia_nombre:  paciente.contacto_emergencia_nombre  ?? '',
          contacto_emergencia_telefono:paciente.contacto_emergencia_telefono ?? '',
          direccion:                   paciente.direccion         ?? '',
          estado_paciente:             paciente.estado_paciente,
          observaciones_generales:     paciente.observaciones_generales ?? '',
        }
      : { ...EMPTY }
  );

  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  const set = (k: keyof PacienteCreate, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const scrollBodyToTop = () => {
    bodyScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.tipo_documento)  e.tipo_documento  = 'Requerido';
    if (!form.numero_documento.trim()) e.numero_documento = 'Requerido';
    if (!form.nombres.trim())  e.nombres  = 'Requerido';
    if (!form.apellidos.trim()) e.apellidos = 'Requerido';
    setErrors(e);
    const ok = Object.keys(e).length === 0;
    if (!ok) scrollBodyToTop();
    return ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setErrors({});
    setLoading(true);

    const payload: PacienteCreate = {
      tipo_documento:  form.tipo_documento,
      numero_documento: form.numero_documento,
      nombres:          form.nombres,
      apellidos:        form.apellidos,
      fecha_nacimiento: form.fecha_nacimiento || undefined,
      sexo:             form.sexo             || undefined,
      email:            form.email            || undefined,
      telefono:         form.telefono         || undefined,
      contacto_emergencia_nombre:   form.contacto_emergencia_nombre   || undefined,
      contacto_emergencia_telefono: form.contacto_emergencia_telefono || undefined,
      direccion:                    form.direccion                    || undefined,
      estado_paciente:              form.estado_paciente,
      observaciones_generales:      form.observaciones_generales      || undefined,
    };

    try {
      if (isEdit) {
        await pacientesService.update(paciente!.id_paciente, payload);
      } else {
        await pacientesService.create(payload);
      }
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: unknown } };
      const raw = e?.response?.data;
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
          if (k === "detail" && typeof v === "string") {
            setErrors({ _general: v });
            scrollBodyToTop();
            return;
          }
          if (k === "non_field_errors" && Array.isArray(v) && v.length) {
            mapped._general = String(v[0]);
            continue;
          }
          if (Array.isArray(v) && v.length) mapped[k] = String(v[0]);
          else if (typeof v === "string") mapped[k] = v;
        }
        if (Object.keys(mapped).length) {
          setErrors(mapped);
          scrollBodyToTop();
        } else
          setErrors({
            _general:
              "No se pudo guardar el paciente. Revisá los datos o la conexión con el servidor.",
          });
      } else {
        setErrors({
          _general: "Error de red o del servidor. Intentá de nuevo.",
        });
      }
      scrollBodyToTop();
    } finally {
      setLoading(false);
    }
  };

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paciente-modal-title"
      className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/*
        Importante: no usar items-center con modales altos: el viewport muestra el “medio” del formulario
        (solo observaciones) y la cabecera/botones quedan fuera de pantalla.
        self-start + max-h + scroll interno mantiene título, campos y acciones accesibles.
      */}
      <div className="flex min-h-[100dvh] w-full justify-center px-3 py-4 pb-28 sm:px-4 sm:py-6 sm:pb-24">
        <div
          className="flex min-h-0 w-full max-w-2xl flex-col self-start overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl
            max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]"
          onClick={(e) => e.stopPropagation()}
        >

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-gray-100 bg-white">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="w-7 h-7 flex-shrink-0 rounded-lg bg-blue-50 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <h3 id="paciente-modal-title" className="truncate text-[15px] font-bold text-gray-900">
              {isEdit ? `Editar paciente — ${paciente!.nombres} ${paciente!.apellidos}` : 'Registrar paciente'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body: scroll interno; footer siempre visible debajo */}
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          noValidate
        >
          <div
            ref={bodyScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5 space-y-5"
          >
            {errors._general && (
              <div className="bg-red-50 text-red-700 text-[13px] px-4 py-3 rounded-xl border border-red-100">
                {errors._general}
              </div>
            )}

            {/* Sección: Identificación */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Identificación
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Tipo de documento" required error={errors.tipo_documento}>
                  <SelectWrap>
                    <select value={form.tipo_documento}
                      onChange={e => set('tipo_documento', e.target.value)}
                      className={selectCls(errors.tipo_documento)}>
                      <option value="DNI">DNI</option>
                      <option value="PASAPORTE">Pasaporte</option>
                      <option value="NIE">NIE</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </SelectWrap>
                </Field>
                <Field label="Número de documento" required error={errors.numero_documento}>
                  <input value={form.numero_documento}
                    onChange={e => set('numero_documento', e.target.value)}
                    placeholder="ej. 12345678A"
                    className={inputCls(errors.numero_documento)} />
                </Field>
              </div>
            </div>

            {/* Sección: Datos personales */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Datos personales
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nombres" required error={errors.nombres}>
                  <input value={form.nombres}
                    onChange={e => set('nombres', e.target.value)}
                    placeholder="ej. Juan Carlos"
                    className={inputCls(errors.nombres)} />
                </Field>
                <Field label="Apellidos" required error={errors.apellidos}>
                  <input value={form.apellidos}
                    onChange={e => set('apellidos', e.target.value)}
                    placeholder="ej. García López"
                    className={inputCls(errors.apellidos)} />
                </Field>
                <Field label="Fecha de nacimiento">
                  <input type="date" value={form.fecha_nacimiento ?? ''}
                    onChange={e => set('fecha_nacimiento', e.target.value)}
                    className={inputCls()} />
                </Field>
                <Field label="Sexo">
                  <SelectWrap>
                    <select value={form.sexo ?? ''}
                      onChange={e => set('sexo', e.target.value)}
                      className={selectCls()}>
                      <option value="">— Sin especificar —</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </SelectWrap>
                </Field>
                <Field label="Estado del paciente">
                  <SelectWrap>
                    <select value={form.estado_paciente ?? 'ACTIVO'}
                      onChange={e => set('estado_paciente', e.target.value)}
                      className={selectCls()}>
                      <option value="ACTIVO">Activo</option>
                      <option value="EN_SEGUIMIENTO">En seguimiento</option>
                      <option value="POSTOPERATORIO">Postoperatorio</option>
                      <option value="INACTIVO">Inactivo</option>
                    </select>
                  </SelectWrap>
                </Field>
              </div>
            </div>

            {/* Sección: Contacto */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Contacto
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Correo electrónico" error={errors.email}>
                  <input
                    type="email"
                    autoComplete="email"
                    value={form.email ?? ''}
                    onChange={e => set('email', e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className={inputCls(errors.email)}
                  />
                </Field>
                <Field label="Teléfono" error={errors.telefono}>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={form.telefono ?? ''}
                    onChange={e => set('telefono', e.target.value)}
                    placeholder="+34 600 000 000"
                    className={inputCls(errors.telefono)}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Dirección">
                    <input
                      value={form.direccion ?? ''}
                      onChange={e => set('direccion', e.target.value)}
                      placeholder="Calle, ciudad..."
                      autoComplete="street-address"
                      className={inputCls()}
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Sección: Emergencia */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Contacto de emergencia
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nombre del contacto">
                  <input value={form.contacto_emergencia_nombre ?? ''}
                    onChange={e => set('contacto_emergencia_nombre', e.target.value)}
                    placeholder="Nombre completo"
                    className={inputCls()} />
                </Field>
                <Field label="Teléfono del contacto">
                  <input type="tel" value={form.contacto_emergencia_telefono ?? ''}
                    onChange={e => set('contacto_emergencia_telefono', e.target.value)}
                    placeholder="+34 600 000 000"
                    className={inputCls()} />
                </Field>
              </div>
            </div>

            {/* Sección: Observaciones */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Observaciones
              </p>
              <textarea
                value={form.observaciones_generales ?? ''}
                onChange={e => set('observaciones_generales', e.target.value)}
                placeholder="Alergias, condiciones especiales, notas relevantes..."
                rows={4}
                className={`${inputBase} min-h-[88px] max-h-40 resize-y rounded-xl border border-gray-200 py-2.5
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-shrink-0 gap-2.5 border-t border-gray-100 bg-gray-50/80 px-5 py-3.5 sm:px-6 sm:py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-[13px] font-medium
                text-gray-600 hover:bg-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                text-white text-[13px] font-semibold transition-colors flex items-center justify-center gap-1.5
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Registrar paciente'}
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

// ── Página principal ───────────────────────────────────────────────────────────
export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('');
  const [total,     setTotal]     = useState(0);
  const [modal, setModal] = useState<{ open: boolean; paciente: Paciente | null }>({
    open: false, paciente: null,
  });

  const fetchPacientes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pacientesService.list({
        search:          search || undefined,
        estado_paciente: filter || undefined,
      });
      setPacientes(res.results);
      setTotal(res.count);
    } catch {
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => { fetchPacientes(); }, [fetchPacientes]);

  const handleDelete = async (p: Paciente) => {
    if (!confirm(`¿Eliminar a ${p.nombres} ${p.apellidos}? Esta acción no se puede deshacer.`)) return;
    try {
      await pacientesService.delete(p.id_paciente);
      fetchPacientes();
    } catch {
      alert('No se pudo eliminar el paciente.');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Pacientes</h2>
          <p className="text-[12.5px] text-gray-400 mt-0.5">Gestión completa de pacientes de la clínica</p>
        </div>
        <button
          onClick={() => setModal({ open: true, paciente: null })}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white
            px-4 py-2 rounded-lg text-[13.5px] font-semibold transition-colors shadow-sm">
          <Plus className="w-4 h-4" strokeWidth={2.5} /> Nuevo Paciente
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-gray-400" />
          <input type="text" placeholder="Buscar paciente..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-white border border-gray-200 rounded-lg text-[13px]
              placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
        </div>
        <SlidersHorizontal className="w-[15px] h-[15px] text-gray-400 flex-shrink-0" />
        <div className="relative">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="h-9 pl-2.5 pr-7 bg-white border border-gray-200 rounded-lg text-[13px]
              text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none">
            <option value="">Todos los estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="EN_SEGUIMIENTO">En seguimiento</option>
            <option value="POSTOPERATORIO">Postoperatorio</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-gray-900">Lista de pacientes</p>
          <span className="text-[12px] text-gray-400">
            {loading ? '...' : `${total} paciente${total !== 1 ? 's' : ''}`}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Cargando pacientes...</span>
          </div>
        ) : pacientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Eye className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">No se encontraron pacientes</p>
            <button onClick={() => setModal({ open: true, paciente: null })}
              className="mt-1 text-[12.5px] text-blue-500 hover:underline">
              Registrar el primer paciente
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Paciente', 'Edad', 'Contacto', 'N° Historia', 'Estado', 'Registro', ''].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-400
                      uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pacientes.map(p => (
                  <tr key={p.id_paciente} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-[13.5px] font-semibold text-gray-900">
                        {p.nombres} {p.apellidos}
                      </p>
                      <p className="text-[11px] text-gray-400">{p.numero_documento}</p>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-600">
                      {calcEdad(p.fecha_nacimiento)}
                    </td>
                    <td className="px-5 py-3.5">
                      {p.email && (
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                          <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />{p.email}
                        </div>
                      )}
                      {p.telefono && (
                        <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mt-0.5">
                          <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />{p.telefono}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-600 font-mono">
                      {p.numero_historia}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-[3px] rounded-full
                        text-[11.5px] font-medium ${BADGE[p.estado_paciente]}`}>
                        {LABEL[p.estado_paciente]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(p.fecha_registro).toLocaleDateString('es')}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModal({ open: true, paciente: p })}
                          className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-blue-500"
                          title="Editar paciente">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-400"
                          title="Eliminar paciente">
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal */}
      {modal.open && (
        <PacienteModal
          paciente={modal.paciente}
          onClose={() => setModal({ open: false, paciente: null })}
          onSaved={() => { setModal({ open: false, paciente: null }); fetchPacientes(); }}
        />
      )}
    </div>
  );
}
