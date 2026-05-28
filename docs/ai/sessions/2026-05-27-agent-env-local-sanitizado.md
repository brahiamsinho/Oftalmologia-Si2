# Sesion 2026-05-27 - .env local sanitizado

## Objetivo

Adaptar `/.env` para desarrollo local y eliminar datos de produccion/secrets expuestos.

## Cambios aplicados

- Ajustes de entorno local:
  - `DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0`
  - `CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000`
  - `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
  - `FRONTEND_URL=http://localhost:3000`
  - `API_BASE_URL=http://10.0.2.2:8000/api` (emulador Android)
- Sanitizacion:
  - Se removieron claves y datos de produccion presentes en `.env` (DuckDNS token/domain, dominio Azure, email de LE, Gemini key y Stripe secret/public real).
  - Se dejaron placeholders y comentarios para separar local vs produccion.

## Memoria actualizada

- `docs/ai/CURRENT_STATE.md`
- `docs/ai/HANDOFF_LATEST.md`
- `docs/ai/NEXT_STEPS.md`

## Nota operativa

Para deploy, usar un `.env` exclusivo del servidor fuera del repo y nunca reutilizar este `.env` local.
