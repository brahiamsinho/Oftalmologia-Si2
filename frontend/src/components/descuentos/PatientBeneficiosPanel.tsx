'use client';

import { useCallback, useEffect, useState } from 'react';
import { Gift, Loader2, Tag } from 'lucide-react';
import { descuentosService, type BeneficiosAplicablesResult } from '@/lib/services/descuentos';

interface PatientBeneficiosPanelProps {
  pacienteId: number;
}

export function PatientBeneficiosPanel({ pacienteId }: PatientBeneficiosPanelProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BeneficiosAplicablesResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await descuentosService.beneficiosAplicables(pacienteId);
      setData(result);
    } catch {
      setError('No se pudieron cargar descuentos aplicables.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-[12.5px] text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Consultando promociones…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-[12.5px] text-gray-500">
        {error}
      </div>
    );
  }

  const aplicables = (data?.beneficios ?? []).filter((b) => b.aplicable);
  const mejor = data?.mejor_beneficio;

  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Gift className="w-4 h-4 text-violet-600" />
        <p className="text-[12.5px] font-semibold text-gray-900">Descuentos y campañas</p>
        <span className="ml-auto text-[11px] font-medium text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
          {aplicables.length} aplicable{aplicables.length === 1 ? '' : 's'}
        </span>
      </div>

      {mejor ? (
        <p className="text-[12px] text-gray-600">
          Mejor beneficio: <span className="font-medium">{mejor.nombre}</span>
          {' — '}
          {mejor.tipo_beneficio === 'PORCENTAJE' ? `${mejor.valor}%` : `$${mejor.valor}`}
        </p>
      ) : (
        <p className="text-[12px] text-gray-500">Sin promociones aplicables hoy.</p>
      )}

      {aplicables.length > 0 && (
        <ul className="space-y-1 pt-1">
          {aplicables.slice(0, 3).map((b) => (
            <li key={b.id_promocion} className="flex items-center gap-1.5 text-[11.5px] text-gray-600">
              <Tag className="w-3 h-3 text-violet-500 flex-shrink-0" />
              {b.codigo}: {b.nombre}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
