import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/dashboard', '/pacientes', '/usuarios', '/roles', '/bitacora', '/historial', '/reportes'];
const AUTH_ONLY  = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has('access_token')
    || request.headers.get('cookie')?.includes('access_token');

  // Rutas del dashboard: requieren sesión
  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  if (isProtected && !hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Login: si ya hay sesión, mandar al dashboard
  const isAuthRoute = AUTH_ONLY.some(p => pathname.startsWith(p));
  if (isAuthRoute && hasToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/pacientes/:path*',
    '/usuarios/:path*',
    '/roles/:path*',
    '/bitacora/:path*',
    '/historial/:path*',
    '/reportes',
    '/reportes/:path*',
    '/login',
  ],
};
