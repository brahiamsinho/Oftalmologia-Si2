# Sesión 2026-05-28 — Platform admin gestión de planes

## Objetivo

Permitir que el `platform admin` gestione planes (crear, editar, activar/inactivar y ajustar límites/features) desde el dashboard de plataforma.

## Cambios implementados

### Backend

- Archivo: `backend/apps/tenant/views.py`
  - `SubscriptionPlanViewSet` volvió a quedar como catálogo público read-only (`AllowAny`, solo planes activos).
  - Se creó `PlatformPlanManagementViewSet` con CRUD completo de `SubscriptionPlan`.
  - Seguridad de gestión: `PlatformJWTAuthentication` + `IsAuthenticated` + `IsPlatformAdministrator`.

- Archivo: `backend/apps/tenant/urls.py`
  - Se registró nuevo router:
    - `platform/plans` -> `PlatformPlanManagementViewSet`
  - Endpoints resultantes:
    - `GET/POST /api/public/platform/plans/`
    - `GET/PATCH/DELETE /api/public/platform/plans/<id>/`

### Frontend

- Archivo: `frontend/src/app/platform/dashboard/page.tsx`
  - Se agregó sección **Planes** en dashboard plataforma.
  - Funcionalidades nuevas:
    - Listado de planes con precio, límites, features y estado.
    - Botón **Nuevo plan**.
    - Botón **Editar** por plan.
    - Modal crear/editar con campos:
      - código, nombre, descripción, precio, moneda,
      - límites (`max_usuarios`, `max_pacientes`, `max_citas_mes`, `max_almacenamiento_mb`),
      - features (`permite_crm`, `permite_notificaciones`, `permite_reportes_avanzados`, `permite_soporte_prioritario`),
      - `activo`.
  - Integración API de gestión:
    - `GET /api/public/platform/plans/`
    - `POST /api/public/platform/plans/`
    - `PATCH /api/public/platform/plans/<id>/`

## Validación

- `python manage.py check` (contenedor backend) -> OK.
- Lints/diagnósticos en archivos editados -> sin errores.

## Notas

- Se mantiene separación de responsabilidades:
  - catálogo público de planes: `/api/public/plans/` (solo lectura),
  - administración de planes (solo superadmin): `/api/public/platform/plans/`.
