# Plataforma SaaS vs clínica (superadmin y multi-tenant)

**Última actualización:** 2026-05-10 (§7 shell UI superadmin, §9 mapa de archivos)  
**Audiencia:** agentes, desarrolladores nuevos, operaciones.

Este documento concentra **memoria operativa** sobre cómo está modelado el SaaS en este repo: dos mundos de autenticación (clínica vs plataforma), URLs, variables de entorno y límites de privacidad.

---

## 1. Principio de aislamiento

- **Cada clínica** = **schema PostgreSQL propio** (`django-tenants`). Pacientes, citas, usuarios operativos (`Usuario`), CRM clínico, backups por tenant, etc. **solo existen en ese schema**.
- **Schema `public`** = metadatos de **organización** (`Tenant`, `Domain`), **planes** (`SubscriptionPlan`), **suscripciones** (`TenantSubscription`), uso agregado (`TenantUsage`), y **operadores de la plataforma** (`PlatformAdministrator`).
- El superadmin de plataforma **no debe** obtener datos clínicos cruzando schemas sin un diseño explícito (impersonación auditada, etc.). La gestión central expuesta hoy opera sobre **filas de tenant/plan en `public`**, no sobre pacientes.

---

## 2. Dos identidades y dos flujos de login

| Aspecto | Clínica (tenant) | Plataforma (SaaS / superadmin) |
|--------|-------------------|--------------------------------|
| **Usuario en BD** | `Usuario` (`AUTH_USER_MODEL`), tabla en **schema del tenant** | `PlatformAdministrator`, tabla **`platform_administrator` en `public`** |
| **Login API** | `POST /t/<slug>/api/auth/login/` | `POST /api/public/platform/auth/login/` |
| **Sesión actual** | `GET /t/<slug>/api/auth/me/` … | `GET /api/public/platform/auth/me/` |
| **Frontend** | `/login` (paso workspace + credenciales) | `/platform/login` → `/platform/dashboard` |
| **Cliente HTTP** | `frontend/src/lib/api.ts` (prefijo `/t/<slug>/api`) | `frontend/src/lib/platformApi.ts` (`/api/public`) |
| **Token storage (browser)** | `access_token`, `refresh_token`, `tenant_slug` | `platform_access_token` |

---

## 3. JWT y alcance (`token_scope`)

- Tokens emitidos en login de **clínica** incluyen `token_scope=tenant` (access + refresh vía `RefreshToken`).
- Tokens de **plataforma** son **solo access**, claim `token_scope=platform`, clase `PlatformAccessToken` (`apps/platform_admin/tokens.py`). Duración: `PLATFORM_JWT_ACCESS_MINUTES` (default 720).
- **DRF default auth:** `TenantScopedJWTAuthentication` — rechaza Bearer con `token_scope=platform` en rutas de API de clínica (evita usar token plataforma contra datos tenant).
- **Gestión de tenants:** `TenantManagementViewSet` usa `PlatformJWTAuthentication` + `IsPlatformAdministrator`.

Referencias de código: `apps/core/authentication.py`, `apps/usuarios/users/views.py` (`_jwt_response`), `apps/tenant/views.py`.

---

## 4. URLs públicas (`config/urls_public.py`)

Prefijo efectivo: **`/api/`** + rutas:

| Ruta | Uso |
|------|-----|
| `GET /api/public/tenants/<slug>/` | Lookup público de organización (antes de login clínica). |
| `GET /api/public/plans/` | Catálogo de planes (AllowAny). |
| `GET|POST /api/public/tenants/` … | CRUD **solo superadmin** (`TenantManagementViewSet`). |
| `POST /api/public/tenants/<id>/activar|suspender|cambiar-plan/` | Acciones superadmin. |
| `POST /api/public/platform/auth/login/` | Login plataforma. |
| `GET /api/public/platform/auth/me/` | Perfil sesión plataforma. |

Los includes están en `apps/tenant/urls.py` bajo `public/` → **`/api/public/...`**.

---

## 5. Backend — apps relevantes

| App | Capa | Rol |
|-----|------|-----|
| `apps.tenant` | SHARED | `Tenant`, `Domain`, `SubscriptionPlan`, `TenantSubscription`, … |
| `apps.platform_admin` | SHARED | `PlatformAdministrator`, login plataforma, admin Django opcional |
| `apps.usuarios.users` | TENANT | `Usuario`, login clínica |

Migraciones shared vs tenant: **`migrate_schemas --shared`** / **`migrate_schemas --tenant`** (ver `README`).

---

## 6. Variables de entorno (bootstrap superadmin)

Definir en `.env` (plantilla en `.env.example`):

- `PLATFORM_ADMIN_EMAIL`, `PLATFORM_ADMIN_PASSWORD` — si ambas están definidas, `backend/entrypoint.sh` ejecuta `manage.py ensure_platform_admin` al arrancar (idempotente). Además, con `RUN_SEEDERS=1`, el entrypoint ejecuta el seeder `seed_platform_admin` en `public` (fallback solo desarrollo si `DEBUG=True` y faltan variables; ver §7b).
- `PLATFORM_JWT_ACCESS_MINUTES` — vida del access JWT plataforma.

**Seguridad:** no commitear contraseñas reales; en producción usar secretos gestionados.

---

## 7. Frontend — panel plataforma

- **`/platform/login`** — obtiene `access` y guarda en `platform_access_token`. La página define **fondo oscuro** en su propio contenedor (`bg-slate-950`); el layout padre `app/platform/layout.tsx` solo renderiza `children` (no fuerza tema).
- **`/platform/dashboard`** — lista tenants (`GET …/tenants/`), planes (`GET …/plans/`), **crear** clínica (`POST …/tenants/`), **activar/suspender**, **cambiar plan** con confirmación en downgrade. UI en **tema claro** alineado al dashboard de clínica.
- **Shell (sidebar + navbar):** `app/platform/dashboard/layout.tsx` usa `SidebarProvider`, `PlatformSidebar` y `PlatformHeader` — mismo patrón que `app/(dashboard)/layout.tsx` (sidebar 220px / 64px colapsada, overlay en móvil, área principal `bg-gray-50`, header sticky). Navegación: Organizaciones → esta ruta; “Login clínica” → `/login`; “Salir” limpia `platform_access_token` y va a `/platform/login`. Componentes: `frontend/src/components/platform/PlatformSidebar.tsx`, `PlatformHeader.tsx`; contexto compartido `frontend/src/context/SidebarContext.tsx` con el panel clínica.

**Nota API planes:** el catálogo `GET /api/public/plans/` es `AllowAny`; en el ViewSet se usa `authentication_classes = []` para que un Bearer JWT de plataforma no dispare el authenticator por defecto y devuelva 401 (ver `CURRENT_STATE`).

---

## 7b. Seeder inicial (schema `public`)

- Módulo `seeders/seed_platform_admin.py`; comando `python manage.py seed --schema public --only platform_admin`.
- En Docker, el `entrypoint` ejecuta ese seeder en `public_seeders` cuando `RUN_SEEDERS=1`.
- Si faltan `PLATFORM_ADMIN_EMAIL` / `PLATFORM_ADMIN_PASSWORD` en `.env` y `DEBUG=True`, usa credenciales **solo desarrollo** documentadas en `README.md` (no aplica en producción con `DEBUG=False`).

---

## 8. Pendientes conscientes (no bloquean el MVP descrito)

| Ítem | Nota |
|------|------|
| Refresh JWT plataforma | No implementado; sesión larga vía `PLATFORM_JWT_ACCESS_MINUTES`. |
| Servicio único “reglas por plan” | Lógica repartida (backup, citas, CRM…); refactor opcional. |
| Tests automatizados flujo plataforma | Recomendado añadir. |
| `DECISIONS_LOG.md` | Entrada 2026-05-10 registrada; mantener alineada con cambios futuros en auth/plataforma. |

---

## 9. Archivos clave (mapa rápido)

```
backend/config/settings.py          # SHARED_APPS, SIMPLE_JWT, PLATFORM_*
backend/config/urls_public.py
backend/apps/tenant/urls.py
backend/apps/tenant/views.py        # TenantManagementViewSet
backend/apps/platform_admin/
backend/apps/core/authentication.py
backend/apps/core/permissions.py    # IsPlatformAdministrator
backend/entrypoint.sh
frontend/src/lib/api.ts
frontend/src/lib/platformApi.ts
frontend/src/context/SidebarContext.tsx       # compartido con dashboard clínica
frontend/src/app/platform/layout.tsx          # solo children
frontend/src/app/platform/login/page.tsx
frontend/src/app/platform/dashboard/layout.tsx # shell superadmin
frontend/src/app/platform/dashboard/page.tsx
frontend/src/components/platform/PlatformSidebar.tsx
frontend/src/components/platform/PlatformHeader.tsx
```

---

## 10. Cómo usar esta memoria

1. Antes de tocar auth o rutas públicas, **leer este archivo** y `ARCHITECTURE.md`.  
2. Tras cambios que afecten SaaS o tenants, actualizar **este archivo**, `CURRENT_STATE.md`, `HANDOFF_LATEST.md` y, si hay decisión nueva, `DECISIONS_LOG.md`.
