import api from '@/lib/api';
import type { PaginatedResponse } from '@/lib/types';

function unwrapList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

// ── Enums ──────────────────────────────────────────────────────────────────────

export type EstadoFactura =
  | 'BORRADOR'
  | 'EMITIDA'
  | 'PAGADA_PARCIAL'
  | 'PAGADA'
  | 'ANULADA';

export type TipoServicioClinico =
  | 'CONSULTA'
  | 'ESTUDIO'
  | 'CIRUGIA'
  | 'CONTROL';

export type MetodoPago =
  | 'EFECTIVO'
  | 'TARJETA'
  | 'TRANSFERENCIA'
  | 'EN_LINEA'
  | 'QR';

export type EstadoCobro =
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'RECHAZADO'
  | 'ANULADO';

// ── Interfaces ─────────────────────────────────────────────────────────────────

export interface CatalogoServicio {
  id_servicio: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo_servicio: TipoServicioClinico;
  tipo_servicio_display: string;
  precio_base: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CobroCli {
  id_cobro: number;
  id_factura: number;
  monto: string;
  metodo_pago: MetodoPago;
  metodo_pago_display: string;
  estado: EstadoCobro;
  estado_display: string;
  referencia_pasarela: string;
  observaciones: string;
  created_at: string;
  updated_at: string;
}

export interface FacturaClinica {
  id_factura: number;
  numero_factura: string;
  paciente_nombre: string;
  id_paciente: number;
  id_servicio: number | null;
  servicio_nombre: string;
  servicio_codigo: string;
  id_cita: number | null;
  id_promocion_aplicada: number | null;
  promocion_codigo: string | null;
  estado: EstadoFactura;
  estado_display: string;
  fecha_emision: string;
  monto_base: string;
  monto_cobertura_seguro: string;
  copago_seguro: string;
  monto_descuento: string;
  monto_total: string;
  saldo_pendiente: string;
  detalle_calculo: Record<string, unknown>;
  observaciones: string;
  cobros: CobroCli[];
  created_at: string;
  updated_at: string;
}

export interface PreviewResult {
  paciente_id: number;
  servicio?: { id: number; nombre: string; codigo: string; precio_base: string };
  monto_base: string;
  seguro?: {
    tiene_cobertura: boolean;
    aseguradora: string;
    convenio: string;
    porcentaje_cobertura: string;
    monto_cobertura: string;
    copago: string;
  };
  descuento?: {
    codigo: string;
    nombre: string;
    tipo_beneficio: string;
    monto_descuento: string;
  };
  monto_total: string;
  saldo_pendiente: string;
}

export interface EmitirPayload {
  paciente_id: number;
  id_servicio?: number | null;
  id_cita?: number | null;
  fecha?: string;
  promocion_id?: number | null;
  observaciones?: string;
}

export interface RegistrarCobroPayload {
  monto: string;
  metodo_pago: MetodoPago;
  estado?: EstadoCobro;
  referencia_pasarela?: string;
  observaciones?: string;
}

export interface GenerarQRResponse {
  referencia_pasarela: string;
  monto: string;
  numero_factura: string;
  qr_base64: string;
  datos_pago: {
    banco: string;
    cuenta: string;
    titular: string;
    moneda: string;
    monto: string;
    factura: string;
    paciente: string;
    referencia: string;
    descripcion: string;
  };
  instrucciones: string;
}

export interface ConfirmarPasarelaPayload {
  referencia_pasarela: string;
  exito: boolean;
}

// ── Service ───────────────────────────────────────────────────────────────────

const BASE_FAC = '/facturacion/facturas';
const BASE_SRV = '/facturacion/servicios';

export const facturacionService = {

  // ── Catálogo de servicios ──
  async listServicios(params?: {
    search?: string;
    activo?: boolean;
    tipo_servicio?: TipoServicioClinico;
  }): Promise<CatalogoServicio[]> {
    const { data } = await api.get<CatalogoServicio[] | PaginatedResponse<CatalogoServicio>>(
      `${BASE_SRV}/`,
      { params },
    );
    return unwrapList(data);
  },

  // ── Facturas ──
  async listFacturas(params?: {
    estado?: EstadoFactura;
    id_paciente?: number;
    search?: string;
    ordering?: string;
  }): Promise<FacturaClinica[]> {
    const { data } = await api.get<FacturaClinica[] | PaginatedResponse<FacturaClinica>>(
      `${BASE_FAC}/`,
      { params },
    );
    return unwrapList(data);
  },

  async getFactura(id: number): Promise<FacturaClinica> {
    const { data } = await api.get<FacturaClinica>(`${BASE_FAC}/${id}/`);
    return data;
  },

  async preview(payload: EmitirPayload): Promise<PreviewResult> {
    const { data } = await api.post<PreviewResult>(`${BASE_FAC}/preview/`, payload);
    return data;
  },

  async emitir(payload: EmitirPayload): Promise<FacturaClinica> {
    const { data } = await api.post<FacturaClinica>(`${BASE_FAC}/emitir/`, payload);
    return data;
  },

  async registrarCobro(id: number, payload: RegistrarCobroPayload): Promise<CobroCli> {
    const { data } = await api.post<CobroCli>(`${BASE_FAC}/${id}/registrar-cobro/`, payload);
    return data;
  },

  async anular(id: number): Promise<FacturaClinica> {
    const { data } = await api.post<FacturaClinica>(`${BASE_FAC}/${id}/anular/`);
    return data;
  },

  async getComprobanteTexto(id: number): Promise<{ texto: string }> {
    const { data } = await api.get<{ texto: string }>(
      `${BASE_FAC}/${id}/comprobante/?formato=texto`,
    );
    return data;
  },

  async iniciarPagoEnLinea(id: number): Promise<{
    referencia: string;
    url_pago: string;
    monto: string;
  }> {
    const { data } = await api.post(`${BASE_FAC}/${id}/iniciar-pago-en-linea/`);
    return data;
  },

  /** Genera QR de pago para la factura. Crea cobro PENDIENTE con metodo=QR. */
  async generarQR(id: number): Promise<GenerarQRResponse> {
    const { data } = await api.post<GenerarQRResponse>(`${BASE_FAC}/${id}/generar-qr/`);
    return data;
  },

  /** Confirma o rechaza un cobro PENDIENTE (QR o en línea) por referencia. */
  async confirmarPasarela(payload: ConfirmarPasarelaPayload): Promise<{ cobro: CobroCli; factura: FacturaClinica }> {
    const { data } = await api.post('/facturacion/cobros/confirmar-pasarela/', payload);
    return data;
  },
};
