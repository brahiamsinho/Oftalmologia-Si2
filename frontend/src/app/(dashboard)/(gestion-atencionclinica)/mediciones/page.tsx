'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowLeft,
  Calendar,
  Loader2,
  Pencil,
  Trash2,
  User,
} from 'lucide-react';
import { fetchAll } from '@/lib/api';
import type { Paciente } from '@/lib/types';
import { deleteEstudio } from '@/lib/services/estudios';
import { deleteMedicionVisual } from '@/lib/services/medicion_visual';
import {
  listMedicionesYEstudios,
  type MedicionListItem,
} from '@/lib/services/mediciones';
import { EstudioEditModal } from './EstudioEditModal';

const TIPO_LABEL: Record<string, string> = {
  agudeza_visual: 'Agudeza Visual',
  refraccion: 'Refracción',
  tonometria: 'Tonometría (PIO)',
  fondo_ojo: 'Fondo de Ojo',
  topografia: 'Topografía Corneal',
  paquimetria: 'Paquimetría',
  tomografia: 'OCT',
  campo_visual: 'Campo Visual',
  otros: 'Otros',
};

function labelTipo(row: MedicionListItem): string {
  if (row.rowKind === 'medicion_visual') return 'Agudeza Visual';
  return TIPO_LABEL[row.tipo_estudio] ?? row.tipo_estudio;
}

export default function MedicionesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [filas, setFilas] = useState<MedicionListItem[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [editing, setEditing] = useState<MedicionListItem | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [e, p] = await Promise.all([
        listMedicionesYEstudios(),
        fetchAll<Paciente>('/pacientes/'),
      ]);
      setFilas(e);
      setPacientes(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const nombrePorPacienteId = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of pacientes) {
      m.set(p.id_paciente, `${p.nombres} ${p.apellidos}`.trim());
    }
    return m;
  }, [pacientes]);

  const pacienteOpts = useMemo(
    () =>
      pacientes.map((p) => ({
        id_paciente: p.id_paciente,
        nombres: p.nombres,
        apellidos: p.apellidos,
      })),
    [pacientes],
  );

  const handleDelete = async (row: MedicionListItem) => {
    const nombre = nombrePorPacienteId.get(row.paciente) ?? `Paciente #${row.paciente}`;
    if (
      !window.confirm(
        `¿Eliminar esta medición (${labelTipo(row)}) de ${nombre}? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    try {
      if (row.rowKind === 'medicion_visual') {
        await deleteMedicionVisual(row.id);
        setFilas((prev) => prev.filter((x) => !(x.rowKind === 'medicion_visual' && x.id === row.id)));
      } else {
        await deleteEstudio(row.id);
        setFilas((prev) => prev.filter((x) => !(x.rowKind === 'estudio' && x.id === row.id)));
      }
    } catch (e) {
      console.error(e);
      window.alert('No se pudo eliminar el registro. Reintentá o revisá permisos.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-[22px] font-bold text-gray-900">Mediciones y estudios</h2>
            <p className="mt-0.5 text-[12.5px] text-gray-400">
              Registros guardados en el sistema. Para crear uno nuevo usá{' '}
              <Link href="/registrar-medicion" className="text-blue-600 hover:underline">
                Registrar medición
              </Link>
              .
            </p>
          </div>
        </div>
        <Link
          href="/registrar-medicion"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Nueva medición
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-24 text-gray-400 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Cargando mediciones...</span>
        </div>
      ) : filas.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-20 text-center shadow-sm">
          <Activity className="h-10 w-10 text-gray-200" />
          <p className="text-sm text-gray-500">Aún no hay mediciones registradas.</p>
          <Link href="/registrar-medicion" className="text-[13px] font-semibold text-blue-600 hover:underline">
            Registrar la primera medición
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filas.map((row) => {
            const key = row.rowKind === 'medicion_visual' ? `mv-${row.id}` : `e-${row.id}`;
            const nombre = nombrePorPacienteId.get(row.paciente) ?? `Paciente #${row.paciente}`;
            const when = row.fecha
              ? new Date(row.fecha).toLocaleString('es-BO', {
                  timeZone: 'America/La_Paz',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : '—';
            return (
              <div
                key={key}
                className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <User className="h-4 w-4 flex-shrink-0 text-blue-500" />
                    <span className="truncate text-[14px] font-semibold text-gray-900">{nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                      {labelTipo(row)}
                    </span>
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {when}
                    </div>
                  </div>
                </div>
                <div className="grid gap-1 text-[13px] text-gray-600 sm:grid-cols-2">
                  <p>
                    <span className="font-medium text-gray-500">OD: </span>
                    {row.ojo_derecho?.trim() || '—'}
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">OI: </span>
                    {row.ojo_izquierdo?.trim() || '—'}
                  </p>
                </div>
                {row.observaciones?.trim() ? (
                  <p className="line-clamp-2 text-[12.5px] text-gray-500">{row.observaciones}</p>
                ) : null}
                <div className="flex justify-end gap-1 border-t border-gray-50 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(row)}
                    className="rounded-lg p-2 text-blue-500 transition-colors hover:bg-blue-50"
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(row)}
                    className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <EstudioEditModal
          item={editing}
          pacientes={pacienteOpts}
          onClose={() => setEditing(null)}
          onSaved={() => void load()}
        />
      )}
    </div>
  );
}
