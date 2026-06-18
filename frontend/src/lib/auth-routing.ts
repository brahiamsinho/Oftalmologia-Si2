import type { TipoUsuario } from '@/lib/types';

export function getLandingRoute(tipoUsuario?: TipoUsuario | null): string {
  return tipoUsuario === 'PACIENTE' ? '/InteligenciaArtificial' : '/dashboard';
}
