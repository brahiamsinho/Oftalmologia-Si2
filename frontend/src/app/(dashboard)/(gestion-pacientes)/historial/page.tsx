'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, Search, User, Calendar, FileText,
  Loader2, X, Phone, Mail, MapPin, AlertCircle, Hash,
  ChevronRight, Shield,
} from 'lucide-react';
import { pacientesService } from '@/lib/services';
import type { Paciente } from '@/lib/types';

// ── Estilos ───────────────────────────────────────────────────────────────────
const ESTADO_STYLE: Record<string, string> = {
  ACTIVO:         'bg-green-50 text-green-700 border-green-100',
  EN_SEGUIMIENTO: 'bg-blue-50 text-blue-700 border-blue-100',
  POSTOPERATORIO: 'bg-orange-50 text-orange-700 border-orange-100',
  INACTIVO:       'bg-gray-100 text-gray-500 border-gray-200',
};
const ESTADO_LABEL: Record<string, string> = {
  ACTIVO:         'Activo',
  EN_SEGUIMIENTO: 'En Seguimiento',
  POSTOPERATORIO: 'Postoperatorio',
  INACTIVO:       'Inactivo',
};

function calcEdad(fechaNac: string | null): string {
  if (!fechaNac) return '—';
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return `${edad} años`;
}

// ── Modal detalle de paciente ─────────────────────────────────────────────────
function DetalleModal({ paciente, onClose }: { paciente: Paciente; onClose: () => void }) {
  const initials = `${paciente.nombres[0] ?? ''}${paciente.apellidos[0] ?? ''}`.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-[16px] font-bold text-blue-600">{initials}</span>
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-gray-900">
                {paciente.nombres} {paciente.apellidos}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-[12px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                  {paciente.numero_historia}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border
                  ${ESTADO_STYLE[paciente.estado_paciente] ?? 'bg-gray-100 text-gray-500'}`}>
                  {ESTADO_LABEL[paciente.estado_paciente] ?? paciente.estado_paciente}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Identificación */}
          <Section title="Identificación">
            <Row icon={Hash} label="Tipo / N° Documento">
              {paciente.tipo_documento} — {paciente.numero_documento}
            </Row>
            <Row icon={Calendar} label="Fecha de nacimiento">
              {paciente.fecha_nacimiento
                ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-ES', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })
                : '—'}
              {paciente.fecha_nacimiento && (
                <span className="ml-2 text-gray-400">({calcEdad(paciente.fecha_nacimiento)})</span>
              )}
            </Row>
            <Row icon={User} label="Sexo">
              {paciente.sexo === 'M' ? 'Masculino' : paciente.sexo === 'F' ? 'Femenino' : '—'}
            </Row>
            <Row icon={Calendar} label="Fecha de registro">
              {new Date(paciente.fecha_registro).toLocaleDateString('es-ES', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </Row>
          </Section>

          {/* Contacto */}
          <Section title="Contacto">
            <Row icon={Mail} label="Correo electrónico">
              {paciente.email ?? <span className="text-gray-400">—</span>}
            </Row>
            <Row icon={Phone} label="Teléfono">
              {paciente.telefono ?? <span className="text-gray-400">—</span>}
            </Row>
            <Row icon={MapPin} label="Dirección">
              {paciente.direccion ?? <span className="text-gray-400">—</span>}
            </Row>
          </Section>

          {/* Contacto de emergencia */}
          {(paciente.contacto_emergencia_nombre || paciente.contacto_emergencia_telefono) && (
            <Section title="Contacto de emergencia">
              <Row icon={Shield} label="Nombre">
                {paciente.contacto_emergencia_nombre ?? '—'}
              </Row>
              <Row icon={Phone} label="Teléfono">
                {paciente.contacto_emergencia_telefono ?? '—'}
              </Row>
            </Section>
          )}

          {/* Observaciones */}
          {paciente.observaciones_generales && (
            <Section title="Observaciones generales">
              <div className="flex items-start gap-2.5 text-[13px] text-gray-700">
                <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
                <p className="leading-relaxed">{paciente.observaciones_generales}</p>
              </div>
            </Section>
          )}

          {/* Historial clínico — próximamente */}
          <Section title="Historial clínico">
            <div className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-4 h-4 text-blue-500" strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-700">Módulo en desarrollo</p>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  Diagnósticos, recetas y evoluciones estarán disponibles próximamente.
                </p>
              </div>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose}
            className="w-full h-10 rounded-xl border border-gray-200 text-[13px] font-medium
              text-gray-600 hover:bg-gray-50 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{title}</p>
      <div className="bg-gray-50/60 rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function Row({
  icon: Icon, label, children,
}: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
        <p className="text-[13px] text-gray-800 font-medium">{children}</p>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function HistorialClinicoPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState<Paciente | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pacientesService.list({ search: search || undefined });
      setPacientes(res.results);
      setTotal(res.count);
    } catch {
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-gray-900">Historial Clínico</h2>
          <p className="text-[12.5px] text-gray-400 mt-0.5">Registros clínicos por paciente</p>
        </div>
      </div>

      {/* Banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3.5">
        <FileText className="w-[18px] h-[18px] text-blue-500 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
        <div>
          <p className="text-[13px] font-semibold text-blue-800">Módulo en desarrollo</p>
          <p className="text-[12px] text-blue-600 mt-0.5">
            El historial completo (diagnósticos, evoluciones, recetas) estará disponible próximamente.
            Hacé clic en un paciente para ver su información.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total historias',  value: loading ? '—' : total,
            color: 'text-gray-900' },
          { label: 'En seguimiento',   value: loading ? '—' : pacientes.filter(p => p.estado_paciente === 'EN_SEGUIMIENTO').length,
            color: 'text-blue-600' },
          { label: 'Postoperatorios',  value: loading ? '—' : pacientes.filter(p => p.estado_paciente === 'POSTOPERATORIO').length,
            color: 'text-orange-600' },
          { label: 'Inactivos',        value: loading ? '—' : pacientes.filter(p => p.estado_paciente === 'INACTIVO').length,
            color: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3.5">
            <p className="text-[11.5px] text-gray-400 mb-1">{s.label}</p>
            <p className={`text-[28px] font-bold leading-none ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, historia o documento..."
          className="w-full h-9 pl-9 pr-3.5 rounded-xl border border-gray-200 bg-white text-[13px]
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando historiales...</span>
        </div>
      ) : pacientes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col
          items-center justify-center py-20 gap-2">
          <ClipboardList className="w-8 h-8 text-gray-200" />
          <p className="text-sm text-gray-400">No se encontraron historiales</p>
          {search && (
            <button onClick={() => setSearch('')}
              className="text-[12.5px] text-blue-500 hover:underline mt-1">
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Paciente</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">N° Historia</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden lg:table-cell">Documento</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden sm:table-cell">Edad</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                <th className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden lg:table-cell">Registro</th>
                <th className="px-3 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pacientes.map(p => (
                <tr key={p.id_paciente}
                  onClick={() => setSelected(p)}
                  className="hover:bg-gray-50/60 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-bold text-blue-600">
                          {p.nombres[0]}{p.apellidos[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">
                          {p.nombres} {p.apellidos}
                        </p>
                        {p.email && (
                          <p className="text-[11.5px] text-gray-400 truncate max-w-[180px]">{p.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-[12.5px] font-mono font-semibold text-gray-700
                      bg-gray-100 px-2 py-0.5 rounded">
                      {p.numero_historia}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <p className="text-[12.5px] text-gray-600">{p.tipo_documento}</p>
                    <p className="text-[12px] text-gray-400">{p.numero_documento}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-[12.5px] text-gray-600">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.8} />
                      {calcEdad(p.fecha_nacimiento)}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border
                      ${ESTADO_STYLE[p.estado_paciente] ?? 'bg-gray-100 text-gray-500'}`}>
                      {ESTADO_LABEL[p.estado_paciente] ?? p.estado_paciente}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-[12px] text-gray-400">
                    {new Date(p.fecha_registro).toLocaleDateString('es-ES', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-gray-400
                      hover:text-blue-600 inline-flex">
                      <ChevronRight className="w-4 h-4" strokeWidth={2} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40">
            <p className="text-[12px] text-gray-400">
              {pacientes.length} de {total} {total === 1 ? 'resultado' : 'resultados'}
              {search && ` para "${search}"`}
            </p>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {selected && (
        <DetalleModal paciente={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
