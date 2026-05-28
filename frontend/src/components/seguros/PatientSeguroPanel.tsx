'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  segurosService,
  type AfiliacionSeguro,
  type VerificarCoberturaResult,
} from '@/lib/services/seguros';

interface PatientSeguroPanelProps {
  pacienteId: number;
}

export function PatientSeguroPanel({ pacienteId }: PatientSeguroPanelProps) {
  const [loading, setLoading] = useState(true);
  const [cobertura, setCobertura] = useState<VerificarCoberturaResult | null>(null);
  const [afiliaciones, setAfiliaciones] = useState<AfiliacionSeguro[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cov, affs] = await Promise.all([
        segurosService.verificarCobertura(pacienteId),
        segurosService.listAfiliaciones({ id_paciente: pacienteId }),
      ]);
      setCobertura(cov);
      setAfiliaciones(affs);
    } catch {
      setError('No se pudo cargar la información de seguros.');
      setCobertura(null);
      setAfiliaciones([]);
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-[12.5px] text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Consultando cobertura…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-800">
        {error}
      </div>
    );
  }

  const vigente = cobertura?.tiene_cobertura === true;

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          {vigente ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-gray-900">Cobertura de seguro</p>
            {vigente && cobertura?.aseguradora && cobertura.convenio ? (
              <>
                <p className="text-[12px] text-gray-600 mt-0.5 truncate">
                  {cobertura.aseguradora.nombre} — {cobertura.convenio.nombre}
                </p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Cobertura {cobertura.convenio.porcentaje_cobertura}% · Copago ref.{' '}
                  {cobertura.convenio.copago_monto}
                  {cobertura.numero_afiliado
                    ? ` · Afiliado ${cobertura.numero_afiliado}`
                    : ''}
                </p>
              </>
            ) : (
              <p className="text-[12px] text-gray-500 mt-0.5">
                {cobertura?.motivo ?? 'Sin cobertura vigente hoy.'}
              </p>
            )}
          </div>
        </div>
        <span
          className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${
            vigente ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
          }`}
        >
          <Shield className="w-3 h-3" />
          {vigente ? 'Vigente' : 'Sin cobertura'}
        </span>
      </div>

      {afiliaciones.length > 0 && (
        <div className="border-t border-gray-200/80 pt-3">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Afiliaciones ({afiliaciones.length})
          </p>
          <ul className="space-y-1.5">
            {afiliaciones.map((a) => (
              <li
                key={a.id_afiliacion}
                className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-gray-600"
              >
                <span className="truncate">
                  {a.convenio_nombre ?? `Convenio #${a.id_convenio}`}
                  {a.es_principal ? (
                    <span className="ml-1.5 text-[10px] font-semibold text-blue-600 uppercase">
                      Principal
                    </span>
                  ) : null}
                </span>
                <span
                  className={`text-[10.5px] font-medium px-2 py-0.5 rounded-full ${
                    a.vigente_hoy
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {a.vigente_hoy ? 'Vigente' : 'No vigente'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href="/seguros"
        className="inline-flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
      >
        Gestionar seguros y convenios
        <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}
