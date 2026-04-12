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
