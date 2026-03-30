/**
 * context/AuthContext.tsx
 *
 * Contexto global de autenticación.
 * Provee:
 *   - user: usuario autenticado (o null)
 *   - isLoading: mientras verifica la sesión inicial
 *   - login(email, password) → solo correo; redirige al dashboard
 *   - logout() → limpia tokens y redirige al login
 */

'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/auth';
import { TokenStorage } from '@/lib/api';
import type { Usuario } from '@/lib/types';

interface AuthContextValue {
  user: Usuario | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user,      setUser]      = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Al montar: si hay token guardado, recuperamos el usuario
  useEffect(() => {
    const token = TokenStorage.getAccess();
    if (!token) {
      setIsLoading(false);
      return;
    }
    authService.me()
      .then(setUser)
      .catch(() => TokenStorage.clear())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { usuario } = await authService.login({ email: email.trim(), password });
    setUser(usuario);
    router.push('/dashboard');
  }, [router]);

  const refreshUser = useCallback(async () => {
    const usuario = await authService.me();
    setUser(usuario);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook para consumir el contexto en cualquier componente */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
