import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = [
  "/dashboard",
  "/pacientes",
  "/usuarios",
  "/roles",
  "/bitacora",
  "/historial",
  "/reportes",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken =
    request.cookies.has("access_token") ||
    request.headers.get("cookie")?.includes("access_token");

  // Rutas del dashboard: requieren cookie de sesión (validación real en cliente).
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (isProtected && !hasToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // No redirigir /login → /dashboard solo por cookie: el JWT puede estar
  // vencido o ser inválido y provoca bucle con el interceptor (401 → /login).

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pacientes/:path*",
    "/usuarios/:path*",
    "/roles/:path*",
    "/bitacora/:path*",
    "/historial/:path*",
    "/reportes",
    "/reportes/:path*",
    "/login",
  ],
};
