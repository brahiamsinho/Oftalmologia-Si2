'use client';

/**
 * Solo monta el panel de clínica cuando AuthContext ya validó /auth/me/.
 * Evita tormentas de 401 (Sidebar/TenantProvider antes de sesión) y reduce
 * carreras con el middleware que solo mira la cookie.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function ClinicSessionGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2
          className="h-8 w-8 animate-spin text-blue-600"
          aria-label="Cargando sesión"
        />
      </div>
    );
  }

  return <>{children}</>;
}
