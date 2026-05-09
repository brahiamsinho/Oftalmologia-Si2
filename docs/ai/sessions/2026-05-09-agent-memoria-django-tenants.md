# 2026-05-09-agent-memoria-django-tenants

## Resumen
Actualizacion de memoria del proyecto para reflejar la migracion completa a `django-tenants` con schema-per-tenant. El contexto anterior en `docs/ai/` solo registraba las fases 1a y 1b (header `X-Tenant-Slug` + FK nullable), pero el codigo backend ya estaba migrado al enfoque completo con schemas.

## Archivos verificados
- `backend/config/settings.py` — SHARED_APPS, TENANT_APPS, TenantSubfolderMiddleware, django_tenants.postgresql_backend, TenantSyncRouter
- `backend/config/urls.py` — URLs tenant-scoped (`/t/<slug>/api/...`)
- `backend/config/urls_public.py` — URLs publicas (`/api/...`, `/api/public/...`)
- `backend/apps/tenant/models.py` — Tenant (TenantMixin), Domain (DomainMixin), SubscriptionPlan, TenantSubscription, TenantUsage, TenantSettings
- `backend/apps/tenant/views.py` — TenantCurrentView, TenantSettingsCurrentView, TenantChangePlanView, PublicTenantLookupView, TenantManagementViewSet
- `backend/apps/tenant/urls.py` — rutas de organizacion y administracion central
- `backend/apps/usuarios/users/views.py` — login/register/me con tenant info, JWT claims de tenant
- `backend/entrypoint.sh` — bootstrap completo (migrate_schemas, planes, tenants, seeders, collectstatic)

## Archivos actualizados
- `docs/ai/CURRENT_STATE.md` — agregada seccion completa de django-tenants, endpoints clave actualizados, riesgos actualizados, gap critico de clientes
- `docs/ai/ARCHITECTURE.md` — reescrito con seccion multi-tenant completa, schemas, apps por capa, flujo de clientes, reglas nuevas
- `docs/ai/HANDOFF_LATEST.md` — nuevo entry de migracion completa al inicio
- `docs/ai/NEXT_STEPS.md` — Fase 2 marcada como completada, tareas urgentes de frontend/mobile con tenant URLs agregadas, pendientes tecnicos multi-tenant

## Hallazgo critico
**Frontend (Next.js) y Mobile (Flutter) NO han sido actualizados** para usar URLs con prefijo de tenant. Ambos clientes siguen usando `/api/...` directo. Esto es un gap critico porque:
1. Las URLs de tenant (`/t/<slug>/api/...`) son las que resuelven el schema correcto.
2. Sin el prefijo, el middleware usa el schema `public` y las queries no encuentran las tablas de datos de clinica.
3. El login, pacientes, citas, etc. fallaran si se llaman sin el prefijo de tenant.

## Proximo paso obligatorio
Adaptar frontend y mobile para:
1. Tener un flujo de seleccion de clinica (o URL directa `/t/<slug>/`).
2. Construir `apiBaseUrl` dinamico: `/t/<tenantSlug>/api/`.
3. Consumir `GET /api/tenants/<slug>/` para validar clinica antes de entrar.
4. Consumir `GET /t/<slug>/api/auth/tenant/` para obtener branding antes del login.
5. Todas las llamadas posteriores usar el prefijo de tenant.
