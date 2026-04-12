"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Loader2, Stethoscope, User } from "lucide-react";
import { fetchAll } from "@/lib/api";
import { listConsultas, type ConsultaListaItem } from "@/lib/services/consultas";
import type { Paciente } from "@/lib/types";

export default function ConsultasListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [consultas, setConsultas] = useState<ConsultaListaItem[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [c, p] = await Promise.all([
          listConsultas(),
          fetchAll<Paciente>("/pacientes/"),
        ]);
        setConsultas(c);
        setPacientes(p);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const nombrePorPacienteId = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of pacientes) {
      m.set(p.id_paciente, `${p.nombres} ${p.apellidos}`.trim());
    }
    return m;
  }, [pacientes]);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-[22px] font-bold text-gray-900">Consultas registradas</h2>
            <p className="text-[12.5px] text-gray-400 mt-0.5">
              Historial de atenciones clínicas. Desde{" "}
              <Link href="/registrar-consulta" className="text-blue-600 hover:underline">
                Registrar consulta
              </Link>{" "}
              podés agregar nuevas.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center py-24 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando consultas...</span>
        </div>
      ) : consultas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
          <Stethoscope className="w-10 h-10 text-gray-200" />
          <p className="text-sm text-gray-500">Aún no hay consultas en el sistema.</p>
          <Link
            href="/registrar-consulta"
            className="text-[13px] font-semibold text-blue-600 hover:underline"
          >
            Registrar la primera consulta
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {consultas.map((row) => {
            const nombre = nombrePorPacienteId.get(row.paciente) ?? `Paciente #${row.paciente}`;
            const when = row.fecha
              ? new Date(row.fecha).toLocaleString("es-BO", {
                  timeZone: "America/La_Paz",
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "—";
            return (
              <div
                key={row.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex flex-col gap-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-[14px] font-semibold text-gray-900 truncate">{nombre}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {when}
                  </div>
                </div>
                <p className="text-[13px] text-gray-700 line-clamp-2">
                  <span className="font-medium text-gray-500">Motivo: </span>
                  {row.motivo || "—"}
                </p>
                {row.cita ? (
                  <p className="text-[11.5px] text-gray-400">Cita asociada #{row.cita}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
