# 2026-05-04 — multi-tenant base Fase 1a

## Goal
Implementar la infraestructura base multi-tenant en Django sin aplicar scoping masivo todavía.

## Instructions
- Respetar arquitectura modular existente.
- No tocar frontend.
- No hacer build.
- Mantener compatibilidad con `/api/` y con módulos actuales.
- Guardar decisiones importantes en engram.

## Discoveries
- El proyecto usa apps modulares por dominio y `config/settings.py` centraliza `INSTALLED_APPS` y `MIDDLEWARE`.
- No existía infraestructura tenant previa ni middleware de contexto.
- El API ya tiene endpoints públicos claros (`/api/health/` y `/api/auth/`), útiles para bypass.

## Accomplished
- ✅ Se creó `apps.tenant` con `Tenant` y `TenantSettings`.
- ✅ Se agregó migración inicial y bootstrap del tenant `legacy`.
- ✅ Se implementó `TenantMiddleware` con header `X-Tenant-Slug`, `request.tenant`, validación de activo y bypass público.
- ✅ Se agregó `tenant_context` para acceso consistente desde servicios.
- ✅ Se actualizaron docs de continuidad (`CURRENT_STATE`, `HANDOFF_LATEST`, `NEXT_STEPS`, `DECISIONS_LOG`).
- ✅ Se agregaron tests mínimos del middleware.

## Next Steps
- Definir Fase 1b de scoping por tenant en consultas/servicios/repositorios.
- Evaluar si login/register deben usar tenant explícito o fallback controlado.
- Alinear modelos existentes con tenant cuando el diseño esté cerrado.

## Relevant Files
- `backend/apps/tenant/models.py` — modelos base de tenant.
- `backend/apps/core/tenant_middleware.py` — resolución por header y contexto.
- `backend/apps/core/tenant_context.py` — contexto en memoria por request.
- `backend/config/settings.py` — registro de app y middleware.
- `backend/apps/core/tests/test_tenant_middleware.py` — validación mínima del flujo.
