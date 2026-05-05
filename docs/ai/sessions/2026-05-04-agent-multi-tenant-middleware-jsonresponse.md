# 2026-05-04 — hardening middleware multi-tenant

## Goal
Corregir el middleware multi-tenant de Fase 1a para que no devuelva `rest_framework.Response` desde Django middleware y reforzar su aislamiento por request.

## Instructions
- Mantener la arquitectura actual.
- No tocar backend de negocio ni Fase 1b.
- No cambiar el contrato `X-Tenant-Slug`.
- No hacer build frontend.
- Guardar decisiones relevantes en engram.

## Discoveries
- El middleware ya resolvía `request.tenant`, pero devolver `DRF Response` desde middleware es un acoplamiento frágil con el ciclo de renderizado de DRF.
- La limpieza de `ContextVar` al inicio/final del request reduce el riesgo de fuga de tenant entre requests.
- El tenant `Tenant` puede resolverse sin `TenantSettings`; `select_related('settings')` no rompe si no existe la fila relacionada.

## Accomplished
- ✅ `TenantMiddleware` ahora responde errores con `JsonResponse` de Django.
- ✅ El contexto del tenant se reinicia por request con `ContextVar` limpio.
- ✅ Tests cubren 400/403, bypass de `/api/auth/` y `/api/health/`, limpieza entre requests, excepción en `get_response` y tenant sin settings.
- ✅ Se actualizó la memoria de continuidad en `docs/ai/`.

## Next Steps
- Avanzar con Fase 1b de scoping tenant en repositorios/servicios.
- Verificar si alguna ruta pública adicional necesita bypass explícito.

## Relevant Files
- `backend/apps/core/tenant_middleware.py` — resolución/bypass/error responses.
- `backend/apps/core/tenant_context.py` — contexto por `ContextVar`.
- `backend/apps/core/tests/test_tenant_middleware.py` — cobertura del middleware.
- `docs/ai/CURRENT_STATE.md` — estado actualizado.
- `docs/ai/DECISIONS_LOG.md` — nueva decisión técnica.
