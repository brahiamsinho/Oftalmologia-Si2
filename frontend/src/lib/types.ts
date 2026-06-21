/**
 * lib/types.ts
 *
 * Tipos TypeScript que espeja los modelos del backend Django.
 * Cada interfaz coincide exactamente con los serializers de la API.
 */

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  usuario: Usuario;       // el backend devuelve 'usuario', no 'user'
  tenant?: import('@/lib/api').TenantPublicData; // incluido en la respuesta del login multi-tenant
}

// ── Usuario ───────────────────────────────────────────────────────────────────
export type TipoUsuario = 'ADMIN' | 'MEDICO' | 'ESPECIALISTA' | 'ADMINISTRATIVO' | 'PACIENTE';
export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';

export interface Usuario {
  id: number;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  foto_perfil: string | null;
  tipo_usuario: TipoUsuario;
  estado: EstadoUsuario;
  ultimo_acceso: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  is_staff: boolean;
  roles?: Rol[];
  paciente?: UsuarioPacienteAcceso | null;
}

export interface UsuarioHistoriaClinicaAcceso {
  id_historia_clinica: number;
  estado: string;
}

export interface UsuarioPacienteAcceso {
  id_paciente: number;
  numero_historia: string;
  historia_clinica: UsuarioHistoriaClinicaAcceso | null;
}

export interface UsuarioCreate {
  username: string;
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  tipo_usuario: TipoUsuario;
  estado?: EstadoUsuario;
  is_staff?: boolean;
  /** Vincular ficha existente sin usuario (solo creación + tipo PACIENTE). */
  id_paciente_existente?: number;
  paciente_tipo_documento?: TipoDocumento;
  paciente_numero_documento?: string;
}

// ── Rol ───────────────────────────────────────────────────────────────────────
export interface Rol {
  id_rol: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  permisos?: Permiso[];
}

export interface Permiso {
  id_permiso: number;
  nombre: string;
  descripcion: string | null;
  modulo: string;
  /** Solo si el backend lo expone; si falta, se considera activo. */
  activo?: boolean;
}

// ── Paciente ──────────────────────────────────────────────────────────────────
export type EstadoPaciente = 'ACTIVO' | 'EN_SEGUIMIENTO' | 'POSTOPERATORIO' | 'INACTIVO';
export type Sexo = 'M' | 'F';
export type TipoDocumento = 'DNI' | 'PASAPORTE' | 'NIE' | 'OTRO';

export interface Paciente {
  id_paciente: number;
  numero_historia: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  fecha_nacimiento: string | null;
  sexo: Sexo | null;
  email: string | null;
  telefono: string | null;
  contacto_emergencia_nombre: string | null;
  contacto_emergencia_telefono: string | null;
  direccion: string | null;
  estado_paciente: EstadoPaciente;
  observaciones_generales: string | null;
  fecha_registro: string;
  usuario: number | null;
  usuario_username: string | null;
}

export interface PacienteCreate {
  tipo_documento: TipoDocumento;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento?: string;
  sexo?: Sexo;
  email?: string;
  telefono?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
  direccion?: string;
  estado_paciente?: EstadoPaciente;
  observaciones_generales?: string;
}

// ── Bitácora ──────────────────────────────────────────────────────────────────
export type AccionBitacora =
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FALLIDO'
  | 'CREAR' | 'EDITAR' | 'ELIMINAR'
  | 'CAMBIAR_PASSWORD' | 'RECUPERAR_PASSWORD' | 'DESCARGAR'
  | 'REPROGRAMAR' | 'CANCELAR' | 'CONFIRMAR';

export interface RegistroBitacora {
  id_bitacora: number;
  id_usuario: number | null;
  usuario_email?: string;
  usuario_nombre?: string;
  modulo: string;
  tabla_afectada: string | null;
  id_registro_afectado: number | null;
  accion: AccionBitacora;
  descripcion: string;
  ip_origen: string | null;
  user_agent?: string | null;
  fecha_evento: string;
}

// ── Documentos clínicos ──────────────────────────────────────────────────────
export type DocumentoClinicoTipo = 'RECETA' | 'INDICACION';
export type DocumentoClinicoEstado = 'ACTIVO' | 'REVOCADO' | 'VENCIDO';

export interface DocumentoClinicoAutorizado {
  id_documento_clinico: number;
  id_historia_clinica: number;
  paciente_nombre: string;
  numero_historia: string;
  tipo_documento: DocumentoClinicoTipo;
  tipo_documento_display: string;
  titulo: string;
  contenido: string | null;
  estado: DocumentoClinicoEstado;
  estado_display: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  creado_por: number | null;
  creador_nombre: string | null;
  origen_modulo: string | null;
  origen_registro_id: number | null;
  observaciones: string | null;
  tiene_archivo: boolean;
  nombre_archivo: string | null;
  descarga_url: string | null;
}

// ── Paginación (DRF por defecto) ──────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Tenant / Multi-tenant ─────────────────────────────────────────────────────
// Re-exportados desde lib/api.ts para que el resto del proyecto los importe
// desde un único lugar (lib/types.ts).
export type {
  TenantBranding,
  TenantSubscriptionPlan,
  TenantPublicData,
  TenantOrgData,
  TenantOrgSettings,
  TenantFlags,
  TenantSubscriptionEstado,
} from '@/lib/api';
