'use client';

/**
 * CU21 — Gestionar facturación, cobros y pasarela de pago.
 * Lista facturas clínicas, permite emitir nuevas, registrar cobros y anular.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Receipt,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  CreditCard,
  FileText,
  Ban,
  Eye,
  DollarSign,
  Clock,
  TrendingUp,
  ShieldCheck,
  Tag,
  QrCode,
  ArrowLeftRight,
} from 'lucide-react';

import {
  facturacionService,
  type FacturaClinica,
  type CatalogoServicio,
  type EstadoFactura,
  type MetodoPago,
  type PreviewResult,
  type GenerarQRResponse,
} from '@/lib/services/facturacion';
import { pacientesService } from '@/lib/services/pacientes';
import type { Paciente } from '@/lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const ESTADO_LABELS: Record<EstadoFactura, string> = {
  BORRADOR: 'Borrador',
  EMITIDA: 'Emitida',
  PAGADA_PARCIAL: 'Pago parcial',
  PAGADA: 'Pagada',
  ANULADA: 'Anulada',
};

const ESTADO_COLORS: Record<EstadoFactura, string> = {
  BORRADOR: 'bg-gray-100 text-gray-600',
  EMITIDA: 'bg-blue-100 text-blue-700',
  PAGADA_PARCIAL: 'bg-amber-100 text-amber-700',
  PAGADA: 'bg-green-100 text-green-700',
  ANULADA: 'bg-red-100 text-red-600',
};

const METODOS_PAGO: { value: MetodoPago; label: string }[] = [
  { value: 'EFECTIVO',      label: 'Efectivo' },
  { value: 'TARJETA',       label: 'Tarjeta' },
  { value: 'TRANSFERENCIA', label: 'Transferencia bancaria' },
  { value: 'EN_LINEA',      label: 'Pago en línea' },
  { value: 'QR',            label: 'Pago QR' },
];

function fmt(v: string | number | undefined | null): string {
  if (v == null || v === '') return '$0.00';
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? '$0.00' : `$${n.toFixed(2)}`;
}

function Badge({ estado }: { estado: EstadoFactura }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${ESTADO_COLORS[estado]}`}>
      {ESTADO_LABELS[estado]}
    </span>
  );
}

const TABS: { key: EstadoFactura | 'TODAS'; label: string }[] = [
  { key: 'TODAS', label: 'Todas' },
  { key: 'EMITIDA', label: 'Emitidas' },
  { key: 'PAGADA_PARCIAL', label: 'Pago parcial' },
  { key: 'PAGADA', label: 'Pagadas' },
  { key: 'BORRADOR', label: 'Borrador' },
  { key: 'ANULADA', label: 'Anuladas' },
];

// ── Modal Emitir Factura ───────────────────────────────────────────────────────

function ModalEmitirFactura({
  servicios,
  onClose,
  onSuccess,
}: {
  servicios: CatalogoServicio[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<'form' | 'preview' | 'saving'>('form');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);

  const [pacienteId, setPacienteId] = useState('');
  const [pacienteSearch, setPacienteSearch] = useState('');
  const [pacienteOpts, setPacienteOpts] = useState<Paciente[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [servicioId, setServicioId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoadingPacientes(true);
      try {
        const all = await pacientesService.listAll({
          search: pacienteSearch.trim() || undefined,
          ordering: 'apellidos',
        });
        if (!cancelled) {
          const onlyWithAccount = all.filter(p => p.usuario !== null);
          setPacienteOpts(onlyWithAccount);
          if (onlyWithAccount.length === 1) {
            setPacienteId(String(onlyWithAccount[0].id_paciente));
          } else if (
            pacienteId &&
            !onlyWithAccount.some(p => String(p.id_paciente) === pacienteId)
          ) {
            setPacienteId('');
          }
        }
      } catch {
        if (!cancelled) setPacienteOpts([]);
      } finally {
        if (!cancelled) setLoadingPacientes(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pacienteId, pacienteSearch]);

  const pacienteSeleccionado = pacienteOpts.find(
    p => String(p.id_paciente) === pacienteId,
  );

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pacienteId || !servicioId) {
      setError('Selecciona un paciente y un servicio.');
      return;
    }
    setStep('saving');
    try {
      const result = await facturacionService.preview({
        paciente_id: parseInt(pacienteId),
        id_servicio: parseInt(servicioId),
        fecha,
      });
      setPreview(result);
      setStep('preview');
    } catch (err: unknown) {
      setStep('form');
      setError(err instanceof Error ? err.message : 'Error al calcular preview');
    }
  };

  const handleEmitir = async () => {
    setError(null);
    setStep('saving');
    try {
      await facturacionService.emitir({
        paciente_id: parseInt(pacienteId),
        id_servicio: parseInt(servicioId),
        fecha,
        observaciones,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setStep('preview');
      setError(err instanceof Error ? err.message : 'Error al emitir la factura');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">
              {step === 'preview' ? 'Confirmar Factura' : 'Nueva Factura'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handlePreview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paciente <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={pacienteSearch}
                    onChange={e => setPacienteSearch(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Buscar paciente con cuenta app (nombre, documento o email)…"
                  />
                  <select
                    value={pacienteId}
                    onChange={e => setPacienteId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">
                      {loadingPacientes ? 'Cargando pacientes…' : 'Seleccionar paciente…'}
                    </option>
                    {pacienteOpts.map(p => (
                      <option key={p.id_paciente} value={p.id_paciente}>
                        {`${p.apellidos}, ${p.nombres} · ${p.numero_documento}`}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {pacienteSeleccionado
                        ? `Seleccionado: ${pacienteSeleccionado.nombre_completo} (ID ${pacienteSeleccionado.id_paciente})`
                        : 'Solo se listan pacientes con usuario de app vinculado.'}
                    </span>
                    <a
                      href="/pacientes"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Nuevo paciente
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servicio clínico <span className="text-red-500">*</span>
                </label>
                <select
                  value={servicioId}
                  onChange={e => setServicioId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar servicio…</option>
                  {servicios.map(s => (
                    <option key={s.id_servicio} value={s.id_servicio}>
                      {s.nombre} ({s.codigo}) — {fmt(s.precio_base)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de emisión
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Notas opcionales…"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Ver preview
                </button>
              </div>
            </form>
          )}

          {step === 'preview' && preview && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Revisa el cálculo antes de emitir la factura.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                {preview.servicio && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Servicio</span>
                    <span className="font-medium">{preview.servicio.nombre}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto base</span>
                  <span className="font-medium">{fmt(preview.monto_base)}</span>
                </div>

                {preview.seguro?.tiene_cobertura && (
                  <>
                    <div className="flex justify-between text-blue-700">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Seguro ({preview.seguro.porcentaje_cobertura}%)
                      </span>
                      <span>- {fmt(preview.seguro.monto_cobertura)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-xs">
                      <span className="pl-4">{preview.seguro.aseguradora} · {preview.seguro.convenio}</span>
                      <span>Copago: {fmt(preview.seguro.copago)}</span>
                    </div>
                  </>
                )}

                {preview.descuento && (
                  <div className="flex justify-between text-green-700">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Descuento ({preview.descuento.codigo})
                    </span>
                    <span>- {fmt(preview.descuento.monto_descuento)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
                  <span>Total a pagar</span>
                  <span className="text-blue-700 text-base">{fmt(preview.monto_total)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Volver
                </button>
                <button
                  onClick={handleEmitir}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  Emitir factura
                </button>
              </div>
            </div>
          )}

          {step === 'saving' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm text-gray-500">Procesando…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal Registrar Cobro ─────────────────────────────────────────────────────

function ModalRegistrarCobro({
  factura,
  onClose,
  onSuccess,
}: {
  factura: FacturaClinica;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [monto, setMonto]             = useState(factura.saldo_pendiente || '');
  const [metodo, setMetodo]           = useState<MetodoPago>('EFECTIVO');
  const [referencia, setReferencia]   = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Estado del flujo QR
  const [qrData, setQrData]           = useState<GenerarQRResponse | null>(null);
  const [generandoQR, setGenerandoQR] = useState(false);
  const [confirmandoQR, setConfirmandoQR] = useState(false);

  const esQR           = metodo === 'QR';
  const esTransferencia = metodo === 'TRANSFERENCIA';

  // ── Flujo QR: paso 1 — generar imagen QR ──────────────────────────────
  const handleGenerarQR = async () => {
    setError(null);
    setGenerandoQR(true);
    try {
      const data = await facturacionService.generarQR(factura.id_factura);
      setQrData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al generar QR');
    } finally {
      setGenerandoQR(false);
    }
  };

  // ── Flujo QR: paso 2 — confirmar pago escaneado ───────────────────────
  const handleConfirmarQR = async () => {
    if (!qrData) return;
    setError(null);
    setConfirmandoQR(true);
    try {
      await facturacionService.confirmarPasarela({
        referencia_pasarela: qrData.referencia_pasarela,
        exito: true,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al confirmar pago QR');
    } finally {
      setConfirmandoQR(false);
    }
  };

  // ── Flujo normal: efectivo, tarjeta, transferencia ────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (esTransferencia && !referencia.trim()) {
      setError('El número de referencia de transferencia es obligatorio.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await facturacionService.registrarCobro(factura.id_factura, {
        monto,
        metodo_pago: metodo,
        estado: 'CONFIRMADO',
        referencia_pasarela: referencia.trim(),
        observaciones,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar cobro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {esQR
              ? <QrCode className="w-5 h-5 text-violet-600" />
              : <CreditCard className="w-5 h-5 text-green-600" />}
            <h2 className="text-base font-semibold text-gray-900">Registrar Cobro</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Info factura */}
          <div className="bg-blue-50 rounded-lg p-3 text-sm">
            <p className="text-gray-600">Factura: <span className="font-semibold text-gray-900">{factura.numero_factura}</span></p>
            <p className="text-gray-600">Paciente: <span className="font-medium">{factura.paciente_nombre}</span></p>
            <p className="text-gray-600">Saldo pendiente: <span className="font-bold text-blue-700">{fmt(factura.saldo_pendiente)}</span></p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Selector de método */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago</label>
            <select
              value={metodo}
              onChange={e => { setMetodo(e.target.value as MetodoPago); setQrData(null); setError(null); setReferencia(''); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              {METODOS_PAGO.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* ── FLUJO QR ───────────────────────────────────────────────── */}
          {esQR && (
            <div className="space-y-4">
              {!qrData ? (
                <>
                  <p className="text-sm text-gray-500">
                    Se generará un código QR con el monto pendiente de <strong>{fmt(factura.saldo_pendiente)}</strong>.
                    El paciente lo escanea con su app bancaria para pagar.
                  </p>
                  <div className="flex gap-3">
                    <button type="button" onClick={onClose}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                      Cancelar
                    </button>
                    <button type="button" onClick={handleGenerarQR} disabled={generandoQR}
                      className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 flex items-center justify-center gap-2 disabled:opacity-50">
                      {generandoQR ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                      {generandoQR ? 'Generando…' : 'Generar QR'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* QR generado */}
                  <div className="flex flex-col items-center gap-3 py-2">
                    <img
                      src={`data:image/png;base64,${qrData.qr_base64}`}
                      alt="Código QR de pago"
                      className="w-48 h-48 border border-gray-200 rounded-lg shadow-sm"
                    />
                    <div className="text-center text-xs text-gray-500 space-y-0.5">
                      <p className="font-semibold text-gray-700">{qrData.datos_pago.banco}</p>
                      <p>Cuenta: <span className="font-mono">{qrData.datos_pago.cuenta}</span></p>
                      <p className="text-lg font-bold text-violet-700 mt-1">
                        {qrData.datos_pago.moneda} {qrData.monto}
                      </p>
                      <p className="text-gray-400 text-[10px] font-mono break-all">
                        Ref: {qrData.referencia_pasarela.slice(0, 20)}…
                      </p>
                    </div>
                    <p className="text-[11px] text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Esperando que el paciente escanee y transfiera. Una vez recibido el pago, presiona &quot;Confirmar pago QR&quot;.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setQrData(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                      Regenerar
                    </button>
                    <button type="button" onClick={handleConfirmarQR} disabled={confirmandoQR}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50">
                      {confirmandoQR ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {confirmandoQR ? 'Confirmando…' : 'Confirmar pago QR'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── FLUJO NORMAL (efectivo, tarjeta, transferencia) ─────────── */}
          {!esQR && (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" step="0.01" min="0.01" required
                    value={monto} onChange={e => setMonto(e.target.value)}
                    className="w-full pl-9 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Referencia de transferencia — obligatoria solo para TRANSFERENCIA */}
              {esTransferencia && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
                      N° de referencia / confirmación <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={referencia}
                    onChange={e => setReferencia(e.target.value)}
                    required
                    placeholder="Ej: TRX-20250601-00123"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Número de comprobante o referencia que entrega el banco al paciente.
                  </p>
                </div>
              )}

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea rows={2} value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={esTransferencia ? 'Banco emisor, titular, etc.' : 'Notas opcionales…'}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Confirmar cobro
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal Comprobante ─────────────────────────────────────────────────────────

function ModalComprobante({
  factura,
  onClose,
}: {
  factura: FacturaClinica;
  onClose: () => void;
}) {
  const [texto, setTexto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    facturacionService
      .getComprobanteTexto(factura.id_factura)
      .then(r => setTexto(r.texto))
      .catch(e => setError(e instanceof Error ? e.message : 'Error al cargar comprobante'))
      .finally(() => setLoading(false));
  }, [factura.id_factura]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Comprobante · {factura.numero_factura}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
          )}
          {texto && (
            <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 leading-relaxed">
              {texto}
            </pre>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function FacturacionPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [facturas, setFacturas] = useState<FacturaClinica[]>([]);
  const [servicios, setServicios] = useState<CatalogoServicio[]>([]);
  const [search, setSearch] = useState('');
  const [tabActivo, setTabActivo] = useState<EstadoFactura | 'TODAS'>('TODAS');

  const [showEmitir, setShowEmitir] = useState(false);
  const [facturaCobrando, setFacturaCobrando] = useState<FacturaClinica | null>(null);
  const [facturaComprobante, setFacturaComprobante] = useState<FacturaClinica | null>(null);
  const [anulando, setAnulando] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [facs, srvs] = await Promise.all([
        facturacionService.listFacturas(),
        facturacionService.listServicios({ activo: true }),
      ]);
      setFacturas(facs);
      setServicios(srvs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAnular = async (factura: FacturaClinica) => {
    if (!confirm(`¿Anular la factura ${factura.numero_factura}? Esta acción no se puede deshacer.`)) return;
    setAnulando(factura.id_factura);
    try {
      await facturacionService.anular(factura.id_factura);
      setSuccess(`Factura ${factura.numero_factura} anulada correctamente.`);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al anular');
    } finally {
      setAnulando(null);
    }
  };

  // ── Filtros ──
  const filtered = facturas.filter(f => {
    const matchTab = tabActivo === 'TODAS' || f.estado === tabActivo;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      f.numero_factura.toLowerCase().includes(q) ||
      f.paciente_nombre.toLowerCase().includes(q) ||
      (f.servicio_nombre?.toLowerCase().includes(q) ?? false);
    return matchTab && matchSearch;
  });

  // ── Stats ──
  const stats = {
    total: facturas.length,
    emitidas: facturas.filter(f => f.estado === 'EMITIDA').length,
    pagadas: facturas.filter(f => f.estado === 'PAGADA').length,
    montoTotal: facturas
      .filter(f => f.estado !== 'ANULADA')
      .reduce((acc, f) => acc + parseFloat(f.monto_total || '0'), 0),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            Facturación y Cobros
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            CU21 · Gestión de facturas, cobros y pasarela de pago clínica
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
            title="Recargar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowEmitir(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Factura
          </button>
        </div>
      </div>

      {/* ── Alertas ── */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto"><XCircle className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p>{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto"><XCircle className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total facturas</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.emitidas}</p>
            <p className="text-xs text-gray-500">Pendientes cobro</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.pagadas}</p>
            <p className="text-xs text-gray-500">Pagadas</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{fmt(stats.montoTotal)}</p>
            <p className="text-xs text-gray-500">Monto total</p>
          </div>
        </div>
      </div>

      {/* ── Filtros + Búsqueda ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-100 px-4 gap-0">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setTabActivo(tab.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${tabActivo === tab.key
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.label}
              {tab.key !== 'TODAS' && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                  ${tabActivo === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                  {facturas.filter(f => f.estado === tab.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por número, paciente, servicio…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <Receipt className="w-10 h-10 opacity-30" />
            <p className="text-sm">No se encontraron facturas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nro. Factura</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Paciente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Servicio</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Saldo</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(f => (
                  <tr key={f.id_factura} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">
                      {f.numero_factura || `#${f.id_factura}`}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{f.paciente_nombre}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{f.servicio_nombre || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(f.monto_total)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${parseFloat(f.saldo_pendiente) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {fmt(f.saldo_pendiente)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge estado={f.estado} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Comprobante */}
                        <button
                          onClick={() => setFacturaComprobante(f)}
                          title="Ver comprobante"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Registrar cobro */}
                        {(f.estado === 'EMITIDA' || f.estado === 'PAGADA_PARCIAL') && (
                          <button
                            onClick={() => setFacturaCobrando(f)}
                            title="Registrar cobro"
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}

                        {/* Anular */}
                        {f.estado !== 'ANULADA' && f.estado !== 'PAGADA' && (
                          <button
                            onClick={() => handleAnular(f)}
                            disabled={anulando === f.id_factura}
                            title="Anular factura"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                          >
                            {anulando === f.id_factura
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Ban className="w-4 h-4" />
                            }
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modales ── */}
      {showEmitir && (
        <ModalEmitirFactura
          servicios={servicios}
          onClose={() => setShowEmitir(false)}
          onSuccess={() => {
            setSuccess('Factura emitida correctamente.');
            fetchData();
          }}
        />
      )}
      {facturaCobrando && (
        <ModalRegistrarCobro
          factura={facturaCobrando}
          onClose={() => setFacturaCobrando(null)}
          onSuccess={() => {
            setSuccess('Cobro registrado correctamente.');
            fetchData();
          }}
        />
      )}
      {facturaComprobante && (
        <ModalComprobante
          factura={facturaComprobante}
          onClose={() => setFacturaComprobante(null)}
        />
      )}
    </div>
  );
}
