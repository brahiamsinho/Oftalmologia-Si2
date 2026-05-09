# Sesión 2026-05-09 — Fix login web (lookup tenant)

## Problema

Usuario no podía pasar paso 1 del login. Logs backend: `404` en `GET /api/tenants/clinica-demo/`.

## Causa

`urls_public.py` monta `apps.tenant.urls` bajo `api/public/`. La vista pública `PublicTenantLookupView` está en `tenants/<slug>/` → URL real **`/api/public/tenants/<slug>/`**. El frontend usaba `/api/tenants/<slug>/` (sin `public/`).

## Cambio

- `frontend/src/app/(auth)/login/page.tsx`: URL de `lookupTenant` corregida.
- `frontend/src/lib/api.ts`: comentario del tipo `TenantPublicData` alineado.

## Verificación

Tras rebuild o hot reload del frontend: paso 1 con `clinica-demo` → paso 2 → `admin@oftalmologia.local` / `admin123`.
