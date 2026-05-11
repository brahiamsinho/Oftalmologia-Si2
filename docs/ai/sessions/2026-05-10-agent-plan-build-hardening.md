# Sesión: plan de implementación — Fase 0 + endurecimiento build

**Fecha:** 2026-05-10

## Objetivo

Ejecutar el plan acordado (todo list): desbloquear `next build`, corregir tipos/ESLint detectados, documentar estado de URLs tenant en `NEXT_STEPS`.

## Cambios realizados

1. **Fase 0 — Lucide:** `Scalpel` → `Slice` en `cirugias/page.tsx` y `Sidebar.tsx`.
2. **`pacientesService.listAll()`** en `lib/services/pacientes.ts`; sustituye `fetchAll()` inexistente en cuatro páginas de atención clínica.
3. **Import CRM:** `Paciente` desde `@/lib/types` en `crm/contactos/page.tsx`.
4. **ESLint:** limpieza imports/vars; comillas en JSX contactos; eliminación estado `total` no leído en `citas-agenda`.
5. **`resolveApiBaseUrl`:** fallback documentado + warning único en build.
6. **Login:** wrapper `Suspense` alrededor del contenido que usa `useSearchParams`.
7. **Memoria:** `CURRENT_STATE.md`, `NEXT_STEPS.md` (ítem tenant URLs), esta sesión.

## No implementado en esta sesión (fases posteriores del plan)

- CU21/CU22 QBE registry y tests.
- Pantalla selección clínica dedicada (solo documentado como pendiente UX).
- Refresh JWT plataforma, panel backups, mobile tenant URLs, etc.

## Verificación

`cd frontend && npm run build` → **exit code 0** (warnings conocidos en `layout.tsx` y `page.tsx` raíz).
