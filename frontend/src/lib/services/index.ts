/**
 * lib/services/index.ts
 * Re-exporta todos los servicios para importar desde un solo lugar:
 *   import { authService, pacientesService } from '@/lib/services'
 */
export { authService }      from './auth';
export { pacientesService } from './pacientes';
export { usuariosService }  from './usuarios';
export { rolesService }     from './roles';
export { bitacoraService }  from './bitacora';
export { permisosService }  from './permisos';
export { historialService } from './historial';
export { especialistasService } from './especialistas';
export { citasService } from './citas';
export { listConsultas, type ConsultaListaItem } from './consultas';
export { evaluacionQuirurgicaService, ESTADO_LABELS, ESTADO_PREQUIRURGICO } from './evaluacion_quirurgica';
export type { EvaluacionQuirurgica, EvaluacionQuirurgicaCreate, EvaluacionQuirurgicaParams } from './evaluacion_quirurgica';
export { preoperatorioService, ESTADO_PREOP_LABELS, ESTADO_PREOPERATORIO } from './preoperatorio';
export type { Preoperatorio, PreoperatorioCreate, PreoperatorioParams } from './preoperatorio';
export { cirugiasService, ESTADO_CIRUGIA_LABELS, ESTADO_CIRUGIA } from './cirugias';
export type { Cirugia, CirugiaCreate, CirugiaReprogramar, CirugiaParams } from './cirugias';
export { postoperatorioService, ESTADO_POSTOP_LABELS, ESTADO_POSTOP } from './postoperatorio';
export type { Postoperatorio, PostoperatorioCreate, PostoperatorioParams } from './postoperatorio';
export {
  historialContactoService, campanaCRMService, segmentacionCRMService,
  CANAL_LABELS, TIPO_MENSAJE_LABELS, ESTADO_COM_LABELS,
  CANAL_CONTACTO, TIPO_MENSAJE, ESTADO_COMUNICACION,
} from './crm';
export type {
  HistorialContacto, HistorialContactoCreate, HistorialContactoParams, CampanaCRM, SegmentacionPaciente,
} from './crm';
