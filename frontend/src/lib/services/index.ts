/**
 * lib/services/index.ts
 * Re-exporta todos los servicios para importar desde un solo lugar:
 *   import { authService, pacientesService } from '@/lib/services'
 */
export { authService }    from './auth';
export { pacientesService } from './pacientes';
export { usuariosService }  from './usuarios';
export { rolesService }     from './roles';
export { bitacoraService }  from './bitacora';
