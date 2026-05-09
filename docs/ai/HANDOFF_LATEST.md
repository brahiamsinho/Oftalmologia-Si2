# HANDOFF LATEST

## Resumen
**Fecha:** 2026-05-09 (Multi-Tenant Frontend ? segunda parte, completo)

**Frontend Web (implementado hoy, segunda ronda):**

### E. `pacientes/page.tsx` ? Restriccion `max_pacientes`
Mismo patron que Usuarios. Consulta `organization/me/`, compara `total` con `plan.max_pacientes`.
Boton "Nuevo Paciente" deshabilitado si se alcanza el limite. Banners rojo/amarillo + badge `X/Y`.

### F. Backend `CitaViewSet` ? Filtro por fecha
Se agrego soporte para `?fecha_desde=YYYY-MM-DD` y `?fecha_hasta=YYYY-MM-DD` en `get_queryset()`.
Permite calcular el conteo mensual real de citas desde el frontend.

### G. `citas-agenda/page.tsx` ? Restriccion `max_citas_mes` mensual
Hace 2 llamadas al montar: `organization/me/` (plan) y citas del mes actual (usando `fecha_desde`/`fecha_hasta`).
Si `citasMesCount >= max_citas_mes`: boton "Agendar Cita" deshabilitado, banners, tarjeta "Este Mes" con badge `X/Y`.
El conteo se recalcula al crear o eliminar citas.

### H. `lib/api.ts` ? Interceptor 403 tenant inactivo
403 en ruta no-login ? limpia `TenantStorage` + `TokenStorage` ? redirige a `/login?motivo=tenant_inactivo`.
El login detecta ese parametro y muestra un aviso naranja.

### I. `planes/page.tsx` ? Conectada con backend real
- Carga planes desde `GET /api/plans/` (endpoint publico).
- Carga plan actual desde `GET organization/me/`.
- Boton "Mejorar Plan" / "Bajar a este plan" abre modal de confirmacion.
- Maneja downgrade (checkbox de confirmacion, validacion de uso vs limites del plan nuevo).
- Llama a `POST organization/change-plan/` y muestra feedback de exito/error.

**Proximos pasos:**
1. Mobile (Flutter): implementar `WorkspaceScreen` + `TenantInterceptor` de Dio.
   Guia completa en `docs/ai/sessions/2026-05-09-agent-multi-tenant-frontend.md` Seccion 5.
2. Restricciones de plan en modulos CRM y Notificaciones.
3. Alerta si el tenant esta en TRIAL proxima a vencer.
4. Validar limite `max_almacenamiento_mb` en subida de archivos.

Detalle: `docs/ai/sessions/2026-05-09-agent-multi-tenant-frontend.md`

---

## Resumen
**Fecha:** 2026-05-09 (Multi-Tenant Frontend ? primera parte)

**Frontend Web:**
- `lib/api.ts`: `TenantStorage` + interceptor que reescribe `baseURL` a `/t/<slug>/api` automaticamente.
- `login/page.tsx`: flujo 2 pasos estilo Slack (slug ? credenciales + branding dinamico del tenant).
- `lib/services/auth.ts`: logout limpia `TenantStorage`.
- `usuarios/page.tsx`: restriccion por `max_usuarios` del plan. Boton deshabilitado + banners + badge `X/Y`.

Detalle: `docs/ai/sessions/2026-05-09-agent-multi-tenant-frontend.md`

---

## Resumen
**Fecha:** 2026-05-05 (Fase 1b multi-tenant segunda ola, parcial)

**Backend:** se reforzó el tenant-aware scoping en citas, consultas, CRM y automatizaciones con FK a `Tenant`, backfill `legacy` y serializers que bloquean tenant/relaciones cruzadas desde el cliente.

Detalle: `docs/ai/sessions/2026-05-05-agent-multi-tenant-fase1b-oleada2.md`

---

## Resumen
**Fecha:** 2026-05-04 (Fase 1b multi-tenant primera ola)

**Backend:** se agregaron FK nullable a `Tenant` en raíces críticas (`Usuario`, `Paciente`, `HistoriaClinica`, `Bitacora`, `Notificacion`, `DispositivoFcm`, `Especialista`) con backfill a `legacy`.

Detalle: `docs/ai/sessions/2026-05-04-agent-multi-tenant-fase1b-oleada1.md`

## Resumen
**Fecha:** 2026-05-04 (Fase 1a multi-tenant base)

**Backend:** se agrego la base multi-tenant con `apps.tenant`, middleware `X-Tenant-Slug` y contexto utilitario en `apps.core`.

Detalle: `docs/ai/sessions/2026-05-04-agent-multi-tenant-fase1a.md`

---

## Que debe hacer el siguiente agente
1. Leer `docs/ai/CURRENT_STATE.md` y la sesion de hoy.
2. Verificar `.env`: `NEXT_PUBLIC_API_URL=http://localhost:8000/api`.
3. El desarrollador Mobile debe leer la Seccion 5 del archivo de sesion de hoy para implementar el interceptor en Flutter/Dio.
4. Si hay tiempo, aplicar restricciones de plan en CRM y Notificaciones con el mismo patron de `organization/me/`.

## Variables (recordatorio)
```
NEXT_PUBLIC_API_URL=.../api     # sin segunda barra /api en paths del cliente
tenant_slug=...                 # guardado en localStorage por TenantStorage al hacer login
```
