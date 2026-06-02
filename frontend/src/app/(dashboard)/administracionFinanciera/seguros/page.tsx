'use client';

/**
 * Seguros y convenios (gestión administrativa).
 * Backend: /api/seguros/aseguradoras|convenios|afiliaciones/
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  UserPlus,
} from 'lucide-react';

import { pacientesService } from '@/lib/services/pacientes';
import {
  segurosService,
  type AfiliacionSeguro,
  type Aseguradora,
  type Convenio,
  type VerificarCoberturaResult,
} from '@/lib/services/seguros';
import type { Paciente } from '@/lib/types';

type TabId = 'aseguradoras' | 'convenios' | 'afiliaciones' | 'verificar';

const TABS: { id: TabId; label: string }[] = [
  { id: 'aseguradoras', label: 'Aseguradoras' },
  { id: 'convenios', label: 'Convenios' },
  { id: 'afiliaciones', label: 'Afiliaciones' },
  { id: 'verificar', label: 'Verificar cobertura' },
];

function pacienteLabel(p: Paciente): string {
  const doc = p.numero_documento?.trim() ? ` · ${p.numero_documento}` : '';
  return `${p.apellidos}, ${p.nombres}${doc}`;
}

function PacienteLookup({
  id,
  label,
  placeholder,
  selected,
  onSelect,
}: {
  id: string;
  label: string;
  placeholder: string;
  selected: Paciente | null;
  onSelect: (p: Paciente | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Paciente[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selected && query.trim() === '') {
      setQuery(pacienteLabel(selected));
    }
  }, [selected, query]);

  useEffect(() => {
    const raw = query.trim();
    if (raw.length < 2) {
      setOptions([]);
      return;
    }
    // Evita buscar con la etiqueta compuesta del paciente ya seleccionado.
    if (selected && raw === pacienteLabel(selected)) {
      setOptions(selected ? [selected] : []);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const page = await pacientesService.list({
          search: raw,
          ordering: 'apellidos',
          page: 1,
        });
        if (!cancelled) {
          setOptions(page.results ?? []);
          setOpen(true);
        }
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, selected]);

  const handleSelect = (p: Paciente) => {
    onSelect(p);
    setQuery(pacienteLabel(p));
    setOpen(false);
  };

  return (
    <div className="relative min-w-[260px]">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={query}
        placeholder={placeholder}
        onFocus={() => {
          if (options.length > 0) setOpen(true);
        }}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          if (!v.trim()) {
            onSelect(null);
            setOptions([]);
            setOpen(false);
          } else {
            setOpen(true);
          }
        }}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
      {loading && (
        <div className="pointer-events-none absolute right-3 top-[37px]">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" aria-hidden />
        </div>
      )}
      {open && (options.length > 0 || query.trim().length >= 2) && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-500">Sin resultados para “{query.trim()}”.</p>
          ) : (
            options.map((p) => {
              const active = selected?.id_paciente === p.id_paciente;
              return (
                <button
                  key={p.id_paciente}
                  type="button"
                  onClick={() => handleSelect(p)}
                  className={`block w-full px-3 py-2 text-left text-sm transition ${
                    active ? 'bg-teal-50 text-teal-800' : 'hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium">{p.apellidos}, {p.nombres}</p>
                  <p className="text-xs text-gray-500">
                    ID #{p.id_paciente}
                    {p.numero_documento ? ` · ${p.numero_documento}` : ''}
                    {p.email ? ` · ${p.email}` : ''}
                  </p>
                </button>
              );
            })
          )}
        </div>
      )}
      {selected && (
        <p className="mt-1 text-xs text-gray-500">
          Seleccionado: {selected.nombre_completo || `${selected.nombres} ${selected.apellidos}`} (ID #
          {selected.id_paciente})
        </p>
      )}
    </div>
  );
}

export default function SegurosPage() {
  const [tab, setTab] = useState<TabId>('aseguradoras');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [afiliaciones, setAfiliaciones] = useState<AfiliacionSeguro[]>([]);

  const [newAseg, setNewAseg] = useState({ codigo: '', nombre: '', razon_social: '' });
  const [newConv, setNewConv] = useState({
    id_aseguradora: '',
    codigo: '',
    nombre: '',
    porcentaje_cobertura: '80',
    copago_monto: '0',
  });
  const [newAfil, setNewAfil] = useState({
    id_paciente: '',
    id_convenio: '',
    numero_afiliado: '',
    es_principal: true,
  });
  const [afiliacionPaciente, setAfiliacionPaciente] = useState<Paciente | null>(null);

  const [verificarPaciente, setVerificarPaciente] = useState<Paciente | null>(null);
  const [verificarResult, setVerificarResult] = useState<VerificarCoberturaResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, c, af] = await Promise.all([
        segurosService.listAseguradoras(),
        segurosService.listConvenios(),
        segurosService.listAfiliaciones(),
      ]);
      setAseguradoras(a);
      setConvenios(c);
      setAfiliaciones(af);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos de seguros.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  const handleCreateAseguradora = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await segurosService.createAseguradora({
        codigo: newAseg.codigo.trim(),
        nombre: newAseg.nombre.trim(),
        razon_social: newAseg.razon_social.trim(),
        activo: true,
      });
      setNewAseg({ codigo: '', nombre: '', razon_social: '' });
      flash('Aseguradora creada.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la aseguradora.');
    }
  };

  const handleCreateConvenio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await segurosService.createConvenio({
        id_aseguradora: Number(newConv.id_aseguradora),
        codigo: newConv.codigo.trim(),
        nombre: newConv.nombre.trim(),
        porcentaje_cobertura: newConv.porcentaje_cobertura,
        copago_monto: newConv.copago_monto,
        activo: true,
      });
      setNewConv({
        id_aseguradora: '',
        codigo: '',
        nombre: '',
        porcentaje_cobertura: '80',
        copago_monto: '0',
      });
      flash('Convenio creado.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el convenio.');
    }
  };

  const handleCreateAfiliacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await segurosService.createAfiliacion({
        id_paciente: Number(newAfil.id_paciente),
        id_convenio: Number(newAfil.id_convenio),
        numero_afiliado: newAfil.numero_afiliado.trim(),
        es_principal: newAfil.es_principal,
        es_titular: true,
        activo: true,
      });
      setNewAfil({ id_paciente: '', id_convenio: '', numero_afiliado: '', es_principal: true });
      setAfiliacionPaciente(null);
      flash('Afiliación registrada.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la afiliación.');
    }
  };

  const handleVerificar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerificarResult(null);
    const id = Number(verificarPaciente?.id_paciente ?? 0);
    if (!id) {
      setError('Seleccioná un paciente para verificar su cobertura.');
      return;
    }
    try {
      const res = await segurosService.verificarCobertura(id);
      setVerificarResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo verificar la cobertura.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-600 shadow-sm">
            <Shield className="h-6 w-6 text-white" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Seguros</p>
            <h1 className="text-2xl font-bold text-gray-900">Seguros y convenios</h1>
            <p className="mt-0.5 max-w-2xl text-sm text-gray-600">
              Aseguradoras, acuerdos de cobertura y afiliación de pacientes. Usá Verificar cobertura
              antes de atender o facturar.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          Actualizar
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          {success}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setError(null);
            }}
            className={`min-h-[44px] rounded-t-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? 'border border-b-white border-gray-200 bg-white text-teal-800'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-sm text-gray-500" role="status">
          Cargando…
        </p>
      )}

      {!loading && tab === 'aseguradoras' && (
        <section className="space-y-6">
          <form
            onSubmit={(e) => void handleCreateAseguradora(e)}
            className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:grid-cols-4"
          >
            <input
              required
              placeholder="Código (ej. NSS)"
              value={newAseg.codigo}
              onChange={(e) => setNewAseg((s) => ({ ...s, codigo: e.target.value }))}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Nombre"
              value={newAseg.nombre}
              onChange={(e) => setNewAseg((s) => ({ ...s, nombre: e.target.value }))}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              placeholder="Razón social"
              value={newAseg.razon_social}
              onChange={(e) => setNewAseg((s) => ({ ...s, razon_social: e.target.value }))}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              <Building2 className="h-4 w-4" aria-hidden />
              Agregar
            </button>
          </form>
          <DataTable
            headers={['Código', 'Nombre', 'Estado']}
            rows={aseguradoras.map((a) => [
              a.codigo,
              a.nombre,
              a.activo ? 'Activa' : 'Inactiva',
            ])}
            empty="No hay aseguradoras. Ejecutá el seeder o creá una arriba."
          />
        </section>
      )}

      {!loading && tab === 'convenios' && (
        <section className="space-y-6">
          <form
            onSubmit={(e) => void handleCreateConvenio(e)}
            className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-6"
          >
            <select
              required
              value={newConv.id_aseguradora}
              onChange={(e) => setNewConv((s) => ({ ...s, id_aseguradora: e.target.value }))}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Aseguradora…</option>
              {aseguradoras.map((a) => (
                <option key={a.id_aseguradora} value={a.id_aseguradora}>
                  {a.nombre}
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Código convenio"
              value={newConv.codigo}
              onChange={(e) => setNewConv((s) => ({ ...s, codigo: e.target.value }))}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Nombre"
              value={newConv.nombre}
              onChange={(e) => setNewConv((s) => ({ ...s, nombre: e.target.value }))}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              max={100}
              placeholder="% cobertura"
              value={newConv.porcentaje_cobertura}
              onChange={(e) => setNewConv((s) => ({ ...s, porcentaje_cobertura: e.target.value }))}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              placeholder="Copago"
              value={newConv.copago_monto}
              onChange={(e) => setNewConv((s) => ({ ...s, copago_monto: e.target.value }))}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              <FileText className="h-4 w-4" aria-hidden />
              Agregar
            </button>
          </form>
          <DataTable
            headers={['Convenio', 'Aseguradora', '%', 'Copago', 'Vigente']}
            rows={convenios.map((c) => [
              `${c.codigo} — ${c.nombre}`,
              c.aseguradora_nombre ?? String(c.id_aseguradora),
              `${c.porcentaje_cobertura}%`,
              c.copago_monto,
              c.vigente_hoy ? 'Sí' : 'No',
            ])}
            empty="No hay convenios."
          />
        </section>
      )}

      {!loading && tab === 'afiliaciones' && (
        <section className="space-y-6">
          <form
            onSubmit={(e) => void handleCreateAfiliacion(e)}
            className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
          >
            <PacienteLookup
              id="afiliacion-paciente-lookup"
              label="Paciente"
              placeholder="Buscar paciente por nombre, documento o email…"
              selected={afiliacionPaciente}
              onSelect={(p) => {
                setAfiliacionPaciente(p);
                setNewAfil((s) => ({ ...s, id_paciente: p ? String(p.id_paciente) : '' }));
              }}
            />
            <select
              required
              value={newAfil.id_convenio}
              onChange={(e) => setNewAfil((s) => ({ ...s, id_convenio: e.target.value }))}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Convenio…</option>
              {convenios.map((c) => (
                <option key={c.id_convenio} value={c.id_convenio}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Nº afiliado"
              value={newAfil.numero_afiliado}
              onChange={(e) => setNewAfil((s) => ({ ...s, numero_afiliado: e.target.value }))}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            <label className="flex min-h-[44px] items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={newAfil.es_principal}
                onChange={(e) => setNewAfil((s) => ({ ...s, es_principal: e.target.checked }))}
              />
              Cobertura principal
            </label>
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              <UserPlus className="h-4 w-4" aria-hidden />
              Afiliar
            </button>
          </form>
          <DataTable
            headers={['Paciente', 'Convenio', 'Nº afiliado', 'Principal', 'Vigente']}
            rows={afiliaciones.map((a) => [
              a.paciente_nombre ?? String(a.id_paciente),
              a.convenio_nombre ?? String(a.id_convenio),
              a.numero_afiliado,
              a.es_principal ? 'Sí' : 'No',
              a.vigente_hoy ? 'Sí' : 'No',
            ])}
            empty="No hay afiliaciones."
          />
        </section>
      )}

      {!loading && tab === 'verificar' && (
        <section className="space-y-4">
          <form
            onSubmit={(e) => void handleVerificar(e)}
            className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <PacienteLookup
              id="verificar-paciente-lookup"
              label="Paciente"
              placeholder="Buscar paciente por nombre, documento o email…"
              selected={verificarPaciente}
              onSelect={setVerificarPaciente}
            />
            <button
              type="submit"
              disabled={!verificarPaciente}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              <Search className="h-4 w-4" aria-hidden />
              Verificar
            </button>
          </form>
          {verificarResult && (
            <div
              className={`rounded-2xl border p-4 text-sm ${
                verificarResult.tiene_cobertura
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}
            >
              {verificarResult.tiene_cobertura ? (
                <>
                  <p className="font-semibold">Cobertura vigente</p>
                  <p className="mt-2">
                    {verificarResult.aseguradora?.nombre} — {verificarResult.convenio?.nombre}
                  </p>
                  <p>
                    Afiliado: {verificarResult.numero_afiliado} · Cobertura{' '}
                    {verificarResult.convenio?.porcentaje_cobertura}% · Copago ref.{' '}
                    {verificarResult.convenio?.copago_monto}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold">Sin cobertura vigente</p>
                  <p className="mt-1">{verificarResult.motivo}</p>
                </>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function DataTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  if (!rows.length) {
    return <p className="text-sm text-gray-500">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase text-gray-600">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-gray-800">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
