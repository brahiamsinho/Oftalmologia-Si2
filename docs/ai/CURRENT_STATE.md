# CURRENT STATE

## Actualizacion 2026-05-28 (PWA frontend con Serwist)

- Se habilitó **Progressive Web App** en el frontend Next.js:
  - manifest web (`src/app/manifest.ts`) servido como `/manifest.webmanifest`,
  - service worker generado en build (`public/sw.js`) vía `@serwist/next`,
  - pantalla offline dedicada (`/~offline`),
  - banner de instalación (`PwaInstallPrompt`) en layout global.
- Política de caché clínica-segura en SW:
  - assets estáticos precacheados,
  - rutas `/api/` en `NetworkOnly` (sin datos clínicos stale offline).
- SW deshabilitado en `development`; activo en build/start de producción.
- Archivos clave: `frontend/next.config.js`, `frontend/src/app/sw.ts`, `frontend/src/app/manifest.ts`.

## Actualizacion 2026-05-28 (asistente virtual: limpieza CU/modelo + prompt oftalmológico)

- En UI del asistente virtual (`frontend/src/app/(dashboard)/(gestion-ia)/asistente-virtual/page.tsx`):
  - se removió texto visible `CU23`,
  - se removió texto `Modelo activo: gemini-2.5-flash`,
  - se actualizó copy para contexto clínico/operativo de oftalmología,
  - se mejoró ejemplo inicial y placeholder con casos reales (agenda, cobertura, reportes).
- En backend (`backend/apps/ia/services/chatbot.py`):
  - se reforzó `_CHATBOT_SYSTEM_PROMPT` con enfoque oftalmológico:
    - agenda y operación clínica,
    - flujo de atención (consulta-estudios-cirugía-postoperatorio),
    - seguros/facturación,
    - reglas de seguridad para síntomas de alarma,
    - límites explícitos (sin diagnóstico/prescripción, sin inventar datos).
- Validación: `ReadLints` sin errores en archivos modificados.

## Actualizacion 2026-05-28 (fix seguros/descuentos: comparacion date vs datetime)

- **Incidente en Seguros:** al crear afiliaciones/convenios se disparaba `TypeError: can't compare datetime.datetime to datetime.date` desde `vigente_hoy` durante serialización.
- **Causa raíz:** algunos `DateField` con `default=timezone.now` pueden quedar como `datetime` en memoria antes de coerción completa, y la propiedad comparaba directo contra `timezone.localdate()`.
- **Fix aplicado:**
  - `backend/apps/administracionFinanciera/seguros/models.py`: helper `_as_local_date(...)` y normalización en `Convenio.vigente_hoy` y `AfiliacionSeguroPaciente.vigente_hoy`.
  - `backend/apps/administracionFinanciera/descuentos/models.py`: mismo hardening preventivo en `PromocionDescuento.vigente_hoy` y `BeneficioPaciente.vigente_hoy`.
- **Regresión agregada:**
  - `backend/apps/administracionFinanciera/seguros/tests/test_seguros.py`: prueba que valida `vigente_hoy` con `datetime` en memoria.
  - `backend/apps/administracionFinanciera/descuentos/tests/test_descuentos.py`: nueva prueba equivalente para promociones/beneficios.
- **Estado:** módulos de `Seguros` y `Campañas/Descuentos` quedan robustecidos ante mezcla transitoria `datetime`/`date` en propiedades de vigencia.

## Actualizacion 2026-05-28 (platform admin: gestión de planes)

## Actualizacion 2026-05-28 (mobile Firebase Android: alineacion package_name)

- Se alineo `mobile/android/app/google-services.json` para que `client[0].client_info.android_client_info.package_name` coincida con el `applicationId` Android actual (`com.example.oftalmologia_si2`).
- Objetivo: evitar el fallo de compilacion `:app:processDebugGoogleServices` con error `No matching client found for package name`.
- Se mantiene el uso de archivos solicitados:
  - mobile: `mobile/android/app/google-services.json`
  - backend: `backend/firebase-credentials.json` (ruta default ya vigente en `backend/config/settings.py`).

- **Backend:** se habilitó gestión CRUD de planes para superadmin de plataforma vía endpoint nuevo:
  - `GET/POST /api/public/platform/plans/`
  - `GET/PATCH/DELETE /api/public/platform/plans/<id>/`
- **Seguridad:** estas rutas usan `PlatformJWTAuthentication` + `IsPlatformAdministrator`.
- **Catálogo público se mantiene:** `GET /api/public/plans/` sigue siendo `AllowAny` y devuelve solo planes activos.
- **Frontend plataforma:** en `platform/dashboard` se agregó sección **Planes** con:
  - listado de límites/features,
  - modal para crear/editar plan,
  - activación/desactivación del plan desde el mismo formulario.
- **Validación:** `python manage.py check` OK y sin lints en archivos modificados.

## Actualizacion 2026-05-28 (fix reportes predefinidos + limpieza textos CU)

- **Incidente UI reportes:** botón "Ejecutar informe" en predefinidos devolvía `404` porque frontend llamaba `POST /reportes-qbe/plantillas/<id>/run/` y el backend no tenía esa acción en el `ViewSet`.
- **Fix backend:** se agregó acción `run_template` en `backend/apps/reportes/views.py` (`@action(detail=True, methods=['post'], url_path='run')`) que:
  - toma `qbe_payload` de la plantilla,
  - ejecuta con el mismo motor seguro (`_execute_payload`),
  - registra bitácora,
  - responde contrato `{ qbe, report }` esperado por frontend.
- **Fix frontend de texto:** se removieron referencias visibles tipo `CU18`, `CU20`, `CU21`, `CU22`, `CU23` en pantallas de reportes/seguros/descuentos y textos auxiliares.
- **Validación:** `python manage.py check` en contenedor backend sin errores.

## Actualizacion 2026-05-28 (Reportes inteligentes / Gemini)

- **Causa del 503:** `gemini-1.5-flash` fue retirado de la API (404 en v1beta). El mensaje de “cuota agotada” en UI era engañoso cuando en realidad era 404.
- **Fix:** modelo por defecto `gemini-2.5-flash` en `settings.py`, `.env`, `.env.example`; alias legacy (`1.5-flash`, `2.0-flash`) → `2.5-flash`; cadena de fallback (`2.5-flash`, `2.0-flash-lite`, `2.0-flash`) en `nlp_translator.py`.
- **Docker:** tras cambiar `.env` usar `docker compose up -d --force-recreate backend` (no basta `restart`).
- **Verificado:** `GeminiQBETranslator.translate_to_qbe('listar pacientes activos')` OK en contenedor con `GEMINI_MODEL=gemini-2.5-flash`.
- **Pendiente:** migrar SDK de `google.generativeai` a `google.genai` (deprecation warning).
- **Exportación NL:** si la consulta incluye `excel`, `pdf` o `csv`, el backend devuelve `export_formats` y el frontend descarga automáticamente (`export-excel`, `export-pdf`, `export-csv`). Botones manuales Excel/PDF/Ambos en `/reportes`.
- **Mobile reportes:** pestaña staff «Reportes» (`features/reportes/`), NL + voz (`speech_to_text`), export vía `share_plus`. `TENANT_SLUG` en `mobile/.env` arma `/t/<slug>/api/` si `API_BASE_URL` no lo trae.
- **Web voz reportes:** dictado continuo es-ES, texto sincronizado al campo, mensajes si falta permiso de micrófono.

## Actualizacion 2026-05-28 (hardening multi-tenant: pruebas anti-cruce)

- Se agregaron pruebas automatizadas de aislamiento por schema en `backend/apps/tenant/tests/test_multitenant_isolation.py`.
- Cobertura nueva:
  - `Paciente` (lectura en tenant A no ve documentos de tenant B).
  - `Cita` (lectura en tenant A no ve pacientes de tenant B).
  - `Consulta` (lectura en tenant A no ve motivos de tenant B).
- Validacion ejecutada en Docker:
  - `docker compose exec backend pytest apps/tenant/tests/test_multitenant_isolation.py -q`
  - Resultado: **3 passed**.
- Nota: en el entorno de tests actual las rutas HTTP tenant (`/t/<slug>/...`) no estaban resolviendo (`404`), por lo que la verificacion de aislamiento se implemento a nivel de schema/ORM (que es la barrera real de aislamiento en `django-tenants`).

## Actualizacion 2026-05-28 (mobile multi-tenant runtime: paso slug -> login)

- Mobile ahora soporta seleccion de tenant en runtime (sin recompilar ni editar `.env` cada vez):
  - Nueva pantalla previa: `TenantWorkspaceScreen` (`/workspace`) para ingresar `slug`.
  - Lookup público de clínica desde mobile: `GET /api/public/tenants/<slug>/`.
  - Si existe/activa, guarda `tenant_slug` en storage seguro y recién habilita login.
- Router mobile actualizado con estado de sesión explícito:
  - `needsTenant` -> fuerza `/workspace`
  - `unauthenticated` -> `/login`
  - `authenticated` -> `/home`
- `ApiClient` ahora puede reinicializarse (`ApiClient.reset()`) cuando cambia tenant para evitar usar base URL vieja.
- `AppConfig` ahora:
  - mantiene `runtimeTenantSlug`,
  - calcula tenant API base dinámica (`/t/<slug>/api/`),
  - calcula base pública (`/api/public/`) para lookup de clínica.
- Login muestra clínica activa y botón **Cambiar** para limpiar sesión + tenant y volver al paso de slug.

## Actualizacion 2026-05-28 (seeders más realistas para demo/reportes)

- Seeder demo actualizado (`backend/seeders/seed_demo_paciente.py`):
  - 3 médicos con subespecialidad (general, retina/vítreo, glaucoma).
  - Paciente demo con datos más completos (tipo doc, sexo, dirección, contacto de emergencia, observaciones).
  - 3 citas futuras con motivos clínicos y observaciones más verosímiles.
- Seeder histórico 6 meses mejorado (`backend/seeders/seed_reporting_6months.py`):
  - 48 pacientes (8 por mes) con nombres/apellidos realistas, sexo, fecha de nacimiento, teléfono, dirección y notas.
  - 3 citas por paciente con motivos/observaciones clínicos variados y distribución de estados más cercana a operación real.
  - Se corrigió colisión de `numero_historia` ante restores/borrados:
    - ahora usa formato determinístico por documento `HC-RPT6M-<token>` (idempotente).
- Verificación en Docker:
  - `seed --only demo_paciente` OK.
  - `seed --only reporting_6months` OK (`174 creados, 18 existentes`).

## Actualizacion 2026-05-28 (flota SaaS demo: 5 clínicas con planes y data 6 meses)

- Nuevo seeder maestro: `backend/seeders/seed_saas_demo_fleet.py`.
- Integrado en comando seed con key `saas_demo_fleet`:
  - `python manage.py seed --schema public --only saas_demo_fleet`
- Provisiona 5 clínicas demo con distribución de planes:
  - 2 `FREE`: `clinica-norte`, `clinica-sur`
  - 2 `PLUS`: `clinica-andina`, `clinica-pacifico`
  - 1 `PRO`: `clinica-prime`
- Por cada clínica:
  - crea/actualiza tenant, domain, settings, subscription, usage,
  - asegura schema,
  - crea/actualiza admin de tenant (credenciales definidas),
  - corre `seed_tipos_cita` y `seed_reporting_6months` en su schema.
- Ejecución validada en Docker:
  - `seed --schema public --only saas_demo_fleet` -> **990 creados, 0 existentes** (primera corrida).

## Actualizacion 2026-05-28 (fix backup-scheduler multi-tenant: hora string)

- Se corrigió fallo del scheduler automático:
  - Error previo: `'str' object has no attribute 'hour'` en tenants al evaluar `hora_backup`.
- Cambios en `backend/apps/backup/management/commands/backup_automatico.py`:
  - helper `_normalize_backup_time(...)` para tolerar:
    - `datetime.time`
    - `str` con formato `HH:MM` o `HH:MM:SS`
    - fallback seguro `03:00` en valores inválidos.
  - `hora_backup` por defecto ahora se crea como `time(3, 0)` (no string).
- Tests nuevos en `backend/apps/backup/tests.py`:
  - parse `HH:MM:SS`
  - parse `HH:MM`
  - fallback en string inválido
- Validación:
  - `python manage.py test apps.backup` -> **18 tests OK**.
  - `python manage.py backup_automatico --force` -> **4 ejecutados, 0 errores** (FREE se salta por política de plan).

## Actualizacion 2026-05-27 (Stripe para cambio de plan + seed histórico 6 meses)

- Planes / pasarela:
  - Se implementó flujo de Stripe para upgrades de plan.
  - Backend nuevo:
    - `POST /t/<slug>/api/organization/change-plan/checkout/` crea sesión Checkout.
    - `POST /t/<slug>/api/organization/change-plan/confirm-stripe/` confirma pago y aplica plan.
    - `POST /api/public/stripe/webhook/` webhook opcional para confirmación server-side.
  - Config agregada en settings:
    - `STRIPE_SECRET_KEY`
    - `STRIPE_WEBHOOK_SECRET`
    - `STRIPE_CURRENCY` (default `usd`)
  - Dependencia agregada: `stripe` en `requirements/base.txt`.
- Frontend:
  - `planes/page.tsx` ahora redirige a Checkout en upgrades pagados.
  - Al volver de Stripe (`?checkout=success&session_id=...`) confirma sesión y refresca plan actual.
 - Hardening de errores Stripe:
   - `organization/change-plan/checkout` y `confirm-stripe` ahora capturan `AuthenticationError/StripeError` y devuelven 400 con mensaje útil (sin 500).
- Datos para reportes:
  - Nuevo seeder `seed_reporting_6months` con pacientes+citas distribuidos en 6 meses (histórico mínimo para análisis/reportería).
  - Integrado al comando `manage.py seed --only reporting_6months` y al `entrypoint` tenant seeders.

## Actualizacion 2026-05-27 (SaaS: crear clinica con administrador obligatorio)

- Se extendio el alta de organización en SaaS para crear administrador inicial de clínica en el mismo flujo.
- Backend:
  - `TenantCreateSerializer` ahora exige:
    - `admin_email`
    - `admin_password`
    - `admin_nombres`
    - `admin_apellidos`
    - `admin_username` opcional
  - Luego de crear tenant/settings/subscription/usage, crea el usuario admin dentro del schema del tenant usando `schema_context(...)` y `create_superuser(...)`.
  - Se valida nombre/apellido admin no vacíos y se controla unicidad de correo dentro del tenant.
- Frontend:
  - Modal “Nueva clínica” (`platform/dashboard`) ahora solicita datos del administrador inicial y los envía al endpoint de creación.
  - Mensajería del modal actualizada para dejar explícito que también se crea el admin inicial.

## Actualizacion 2026-05-27 (fix errores de arranque Docker: frontend + scheduler)

- Frontend:
  - Se ajusto `frontend/next.config.js` para permitir `images.unsplash.com` en `images.remotePatterns`.
  - Con esto se corrige el `500` en `/` por `next/image` host no configurado.
- Scheduler backup:
  - Se hardenizo `backend/apps/backup/management/commands/backup_automatico.py` para no lanzar traceback al iniciar si las tablas base aun no existen durante bootstrap.
  - Ahora, ante `ProgrammingError`/`OperationalError` al consultar tenants, el comando sale con warning y reintenta en el siguiente ciclo.
- Frontend entrypoint:
  - `frontend/docker-entrypoint.sh` ahora usa `rm -rf .next || true` para evitar ruido por `Resource busy` durante limpieza de cache.

## Actualizacion 2026-05-27 (.env local limpio sin datos de produccion)

- Se normalizo `/.env` para desarrollo local:
  - Hosts/origenes movidos a `localhost` (`DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`).
  - API web a `NEXT_PUBLIC_API_URL=http://localhost:8000/api` (sin `/api/v1`).
  - API mobile dev emulador Android a `API_BASE_URL=http://10.0.2.2:8000/api`.
- Se retiraron del `.env` valores de produccion y secretos reales expuestos (DuckDNS, Azure domain, email Let's Encrypt, API key Gemini y claves Stripe).
- Se dejaron placeholders seguros para desarrollo y comentarios para separar claramente entorno local vs produccion.

## Actualizacion 2026-05-27 (rutas canonicas para subagente orchestrator)

- Se actualizo `.cursor/agents/orchestrator.md` para fijar rutas canonicas del monorepo:
  - Backend: `.../backend`
  - Frontend: `.../frontend`
  - Mobile: `.../mobile`
  - Memoria/contexto: `.../docs`
- Objetivo: reducir ambiguedad en delegacion y asegurar que el orquestador use siempre las carpetas correctas.

## Actualizacion 2026-05-27 (Cursor subagentes reales + rules ligeras)

- Se reordeno `.cursor/` siguiendo documentacion de Cursor:
  - **Subagentes reales** en `.cursor/agents/*.md` (`orchestrator`, `backend`, `frontend`, `mobile`, `ui-ux`, `architecture`, `architect-planner`, `code-review`, `qa-testing`, `devops`, `infra`).
  - **Rules** en `.cursor/rules/` solo para politica/routing:
    - `00-core-policy.mdc` (`alwaysApply: true`)
    - `10-routing-hints.mdc` (sugerencias de delegacion)
- Se removio la duplicacion previa de `agent-*.mdc` para evitar conflicto entre roles de rules y roles de subagentes.
- `README` actualizado en:
  - `.cursor/agents/README.md`
  - `.cursor/rules/README.md`

## Actualizacion 2026-05-27 (migracion OpenCode -> Cursor subagentes/rules)

- Se creo la equivalencia oficial en Cursor usando **Project Rules** en `.cursor/rules/agent-*.mdc` (orchestrator + 10 especialistas), invocables por `@agent-*`.
- Se agrego `.cursor/rules/README.md` como indice operativo y `.cursor/agents/README.md` como puntero.
- Se mantuvo `.opencode/agents/` como fuente original compatible con OpenCode y se dejo trazado el puente OpenCode <-> Cursor en `.opencode/README.md`.
- Se corrigio conflicto de merge en `.opencode/README.md` (marcadores `<<<<<<<`, `=======`, `>>>>>>>`).

## Actualizacion 2026-05-10 (build frontend + Fase 0 plan)

- **Lucide:** `Scalpel` → `Slice` en cirugías y sidebar (icono no exportado en lucide 0.460).
- **Pacientes:** `pacientesService.listAll()` (paginación agregada vía `fetchAll`); reemplaza usos erróneos de `fetchAll()` en cirugías, evaluaciones, pre/postoperatorio.
- **CRM contactos:** tipo `Paciente` importado desde `@/lib/types`.
- **ESLint:** imports/vars sin uso en varias páginas; `react/no-unescaped-entities` en contactos; estado `total` no usado en citas-agenda.
- **`api.ts`:** si falta `NEXT_PUBLIC_API_URL`, fallback `http://localhost:8000/api` (como `.env.example`) + un solo `console.warn` en SSR/build; permite `next build` sin `.env`.
- **Login:** `useSearchParams` envuelto en `<Suspense>` para prerender.
- **`npm run build`:** exit 0 (quedan warnings eslint next/font e img en landing).

## Memoria / índice para agentes (2026-05-10)

| Documento                      | Contenido                                                                                                                                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`docs/ai/PLATFORM_SAAS.md`** | **Referencia canónica:** login clínica vs plataforma, JWT `token_scope`, URLs `/api/public/...`, env `PLATFORM_*`, panel web (login, dashboard, **shell sidebar/header**, archivos frontend). Leer antes de cambiar auth o tenants. |
| `docs/ai/ARCHITECTURE.md`      | Multi-tenant, schemas, flujos web; enlaza a PLATFORM_SAAS.                                                                                                                                                                          |
| `docs/ai/DECISIONS_LOG.md`     | Decisión formal superadmin SaaS (2026-05-10).                                                                                                                                                                                       |
| `docs/ai/HANDOFF_LATEST.md`    | Últimos cambios y archivos tocados.                                                                                                                                                                                                 |
| `docs/ai/NEXT_STEPS.md`        | Backlog priorizado.                                                                                                                                                                                                                 |

---

## Actualizacion 2026-05-10 (shell UI `/platform/dashboard`)

- **Frontend:** layout dedicado con sidebar + navbar reutilizando `SidebarContext` / `useMediaQuery` como el dashboard clínica; componentes `components/platform/PlatformSidebar.tsx`, `PlatformHeader.tsx`. Login plataforma conserva fondo oscuro en la propia página.

## Actualizacion 2026-05-10 (Cursor: rules oficiales para “subagentes”)

- **Project Rules** en `.cursor/rules/agent-*.mdc` según [documentación Cursor Rules](https://cursor.com/docs/context/rules): `alwaysApply: false` sin `description` ni `globs` → aplicación solo al **@-mencionar** la regla (equivalente manual a subagentes). Índice `.cursor/rules/README.md`. Carpeta `.cursor/agents/` reducida a puntero.

## Actualizacion 2026-05-10 (fix 401 GET /api/public/plans/ con JWT plataforma)

- **Backend:** `SubscriptionPlanViewSet` ahora usa `authentication_classes = []`. El catálogo es `AllowAny`, pero el default `TenantScopedJWTAuthentication` rechazaba Bearer `token_scope=platform` → 401 → interceptor `platformApi` redirigía a `/platform/login`.

## Actualizacion 2026-05-10 (seeder superadmin plataforma)

- **Seeder:** `seeders/seed_platform_admin.py` — crea `PlatformAdministrator` en schema `public`; integrado en `manage.py seed --schema public --only platform_admin` y en `entrypoint.sh` (`public_seeders`). `ensure_platform_admin` reutiliza la misma lógica.

## Actualizacion 2026-05-10 (dashboard plataforma — acciones CRUD tenants)

- **Frontend:** `/platform/dashboard` con crear organización (slug, nombre, plan, trial), botones Activar/Suspender/Cambiar plan; lista de planes desde `GET /api/public/plans/`; checkbox confirmación al downgrade de plan.

## Actualizacion 2026-05-10 (login superadmin / plataforma SaaS)

- **Modelo** `PlatformAdministrator` (`apps.platform_admin`, SHARED_APPS solo): credenciales en schema `public`; no es `Usuario` de clínica.
- **API:** `POST /api/public/platform/auth/login/` → `{ access, administrator }` (sin refresh por ahora para no depender del blacklist JWT ligado a `AUTH_USER_MODEL` tenant). `GET /api/public/platform/auth/me/` sesión actual.
- **JWT:** tokens de plataforma con `token_scope=platform`; tokens de clínica con `token_scope=tenant` (emitidos en `_jwt_response`). Auth por defecto: `TenantScopedJWTAuthentication` rechaza Bearer de plataforma en APIs `/t/<slug>/`.
- **Gestión tenants:** `GET/POST …/api/public/tenants/` y acciones sólo con JWT plataforma (`TenantManagementViewSet`).
- **Frontend:** rutas `/platform/login` y `/platform/dashboard`; tokens en `platform_access_token` (separados del panel clínica).
- **Ops:** `manage.py ensure_platform_admin`; entrypoint ejecuta el seeder `seed_platform_admin` en arranque (`public_seeders`).

## Actualizacion 2026-05-28 (credenciales demo centralizadas + platform admin seed-only)

- Se creó `docs/ai/DEMO_CREDENTIALS.md` con credenciales demo centralizadas:
  - platform admin (`public`)
  - flota SaaS 5 clínicas
  - admin/paciente/médicos de `clinica-demo`.
- `seed_platform_admin` quedó **seed-only** (sin dependencia de `.env` para email/password).
- `entrypoint.sh` eliminó bloque opcional `6b` que creaba platform admin vía variables `.env`.
- Verificación ejecutada:
  - `python manage.py seed --schema public --only platform_admin` -> `0 creados, 1 ya existían`.

## Actualizacion 2026-05-09 (hardening reportes/ia post-merge main)

- **`NlpToReportView`:** `IsAuthenticated` (antes `AllowAny` + comentarios de prueba) — evita abuso y coste Gemini sin sesión.
- **`GEMINI_MODEL`:** lee `config` / entorno; default `gemini-2.5-flash` (alineado con `.env.example` si se define allí).
- **`QBEEngine.execute`:** filtros y `order_by` pasan por `_normalize_filters` / `_normalize_order_by` (misma regla que el builder estricto).

## Actualizacion 2026-05-09 (app IA CU23 — NL → QBE + Gemini)

- **Nueva app tenant** `apps.ia`: `GeminiQBETranslator` en `services/nlp_translator.py` (Gemini JSON-only → dict validado para `QBEEngine`).
- **Settings** `config/settings.py`: `GEMINI_API_KEY`, `GEMINI_MODEL` (sin `settings/base.py` en el repo; variables en `.env.example`).
- **API** `POST /t/<slug>/api/ia/nlp-to-report/` cuerpo `{"query":"..."}` → respuesta `{ "qbe": {...}, "report": { "meta", "data" } }` o errores parciales.
- **Dependencia** `google-generativeai` en `requirements/base.txt`.

## Actualizacion 2026-05-09 (reportes: predefinidos + export Excel)

- **Migración datos** `apps.reportes.0002_reportes_predefinidos`: semillas CU22 _Pacientes Nuevos Recientes_ (filtro `fecha_registro__gte` + campos reales) y _Ausentismo de Citas_ (`estado=NO_ASISTIO`). Sin FK tenant (schema django-tenants).
- **openpyxl** en `requirements/base.txt`; **`services/export_engine.py`**: `qbe_result_to_excel_bytes(result)` → `BytesIO` con cabecera `meta['columns']`.
- **API** `POST .../reportes-qbe/plantillas/export-excel/` mismo JSON que `execute`; respuesta `HttpResponse` .xlsx `Content-Disposition: attachment`.

## Actualizacion 2026-05-09 (modulo Reportes QBE — CU21/CU22 esqueleto)

- **Nueva app tenant** `apps.reportes`: modelo `ReportTemplate` (nombre, descripcion, `qbe_payload`, `is_system_report`, `created_by`, `created_at`).
- **Motor** `apps.reportes.services.qbe_engine`: `QBEQueryBuilder` + validación de payload sin SQL crudo; registro de modelos vacío hasta que dominio exponga whitelist.
- **API DRF**: `ReportTemplateViewSet` (CRUD) + `POST .../reportes-qbe/plantillas/execute/` con `ReportExecutionSerializer` (prefijo `reportes-qbe` evita choque con `apps.crm.reportes`).
- **Integración**: `TENANT_APPS` + `config/urls.py` incluye `apps.reportes.urls`. Migración `0001_initial`.
- **Nota**: Coexiste con `apps.crm.reportes` (CU17 reportes predefinidos CRM); este módulo es el esqueleto QBE genérico para personalizados/predefinidos Si2.

## Actualizacion 2026-05-09 (fix login paso 1 — lookup tenant)

- **Bug:** El login web (paso 1 workspace) llamaba `GET /api/tenants/<slug>/` pero las rutas públicas del backend viven bajo `config/urls_public.py` → prefijo **`/api/public/`**.
- **Fix:** `frontend/src/app/(auth)/login/page.tsx` ahora usa `GET /api/public/tenants/<slug>/`. Comentario alineado en `frontend/src/lib/api.ts`.
- **Uso:** Workspace `clinica-demo` + `admin@oftalmologia.local` / `admin123` (tras seed en tenant).

## Actualizacion 2026-05-09 (backup tests green + hardening tenant-aware)

- Se completó la estabilización de `apps.backup` con foco en pruebas automatizadas y compatibilidad con `django-tenants`.
- Ajustes en código:
  - `backend/apps/backup/views.py`: `BackupConfigViewSet.get_queryset()` ahora ordena por `id_config` para evitar warning de paginación inconsistente.
- Ajustes en pruebas:
  - `backend/apps/backup/tests.py` refactorizado para evitar dependencia de tablas tenant en schema público de test.
  - Nuevas regresiones cubiertas:
    - validación de límites usando ventana temporal (`timedelta`) en `validate_backup_limit`.
    - restore con tenant explícito sin asumir `backup.tenant` FK.
  - tests de concurrencia en restore ahora usan mock de queryset (`TenantBackup.objects.filter(...).exists()`).
- Validación ejecutada:
  - `docker compose exec backend python manage.py test apps.backup`
  - Resultado: **OK (15 tests)**.
- Cobertura adicional implementada para `tenant_context` en command scheduler:
  - `BackupAutomaticoCommandTest.test_handle_uses_tenant_context_for_active_tenant`
  - `BackupAutomaticoCommandTest.test_handle_tenant_slug_not_found_skips_tenant_context`

## Actualizacion 2026-05-09 (hardening smoke test backup/restore)

- Se completo smoke test real del flujo backup/restore en tenant `clinica-demo` con endpoints vigentes:
  - `GET/PATCH /t/clinica-demo/api/backup-config/` (`PATCH` por id: `/backup-config/1/`)
  - `GET/POST /t/clinica-demo/api/backup/`
  - `POST /t/clinica-demo/api/backup/{id}/restore/`
  - `GET /t/clinica-demo/api/backup/plan-info/`
- Se validó upgrade de plan a `PLUS` con `POST /t/clinica-demo/api/organization/change-plan/` y creación/restauración de backup exitosas.
- Se ejecutó scheduler forzado con éxito:
  - `docker compose exec backend python manage.py backup_automatico --force --tenant-slug clinica-demo`
- Fixes aplicados en backend backup:
  - `backend/apps/backup/validators.py`: agregado `from datetime import timedelta` (evita `NameError` al validar límites por plan).
  - `backend/apps/backup/services.py`: `restore_backup(..., tenant=None)` ahora resuelve schema desde tenant explícito (sin asumir FK `backup.tenant`).
  - `backend/apps/backup/views.py`: `restore()` ahora pasa `tenant=request.tenant` a `BackupService.restore_backup(...)`.
- Documentación operativa corregida a rutas reales:
  - `README.md`
  - `docs/api/backup.md`
  - Se removieron rutas antiguas `/api/organization/backup*` para backup app.

## Actualizacion 2026-05-09 (sistema completo de backup/restore multi-tenant)

- **Nuevo app `apps.backup`** implementado con sistema completo de backup/restore por tenant.
- **Modelos:**
  - `TenantBackup`: registro de cada backup (archivo, tamaño, estado, fechas, usuario creador/restaurador, motivo restore)
  - `TenantBackupConfig`: configuracion de backups automaticos (hora, frecuencia, retencion)
- **Servicio `BackupService`:** usa `pg_dump --schema=<tenant_schema>` + gzip + Django storage para crear backups; restore con DROP/CREATE SCHEMA + psql import.
- **REST API completa:**
  - CRUD de backups por tenant
  - Restore con confirmacion explicita + motivo
  - Download de archivo `.sql.gz`
  - Configuracion de backup automatico
  - Informacion de limites por plan
- **Management command `backup_automatico`:** ejecuta backups automaticos para cada tenant segun su config; usa `tenant_context` para cambiar schema; soporta `--force` y `--tenant-slug`.
- **Validadores:** limites por plan (FREE=0, PLUS=5/semana, PRO=ilimitado), validacion de restore, concurrencia.
- **Bitacora:** todas las operaciones de backup/restore se registran con IP y user-agent.
- **Docker Compose:** agregado servicio `backup-scheduler` que ejecuta `backup_automatico` cada hora.
- **Dockerfile:** agregado `postgresql-client` para `pg_dump` y `psql` en runtime.
- **Settings:** agregadas variables `BACKUP_STORAGE_PATH`, `BACKUP_TIMEOUT_SECONDS`, `BACKUP_MAX_SIZE_MB`, `BACKUP_PLAN_LIMITS`.
- **Documentacion:** `docs/api/backup.md` con ejemplos curl y especificacion completa.
- **Tests:** unitarios para modelos, validadores y servicio (mock de subprocess y storage).
- **README.md:** actualizado con seccion multi-tenant, comandos de backup, ejemplos de API.
- **Migracion creada:** `apps/backup/migrations/0001_initial.py`.

## Actualizacion 2026-05-09 (migracion completa a django-tenants con schemas)

- **Backend migrado completamente a `django-tenants` con schema-per-tenant.** El enfoque anterior (header `X-Tenant-Slug` + FK nullable + scoping manual) fue reemplazado por aislamiento real via schemas de PostgreSQL.
- **Configuracion en `settings.py`:**
  - `TENANT_MODEL = 'tenant.Tenant'`, `TENANT_DOMAIN_MODEL = 'tenant.Domain'`
  - `PUBLIC_SCHEMA_NAME = 'public'`, `TENANT_SUBFOLDER_PREFIX = 't'`
  - `PUBLIC_SCHEMA_URLCONF = 'config.urls_public'`
  - `DATABASES.default.ENGINE = 'django_tenants.postgresql_backend'`
  - `DATABASE_ROUTERS = ('django_tenants.routers.TenantSyncRouter',)`
  - Middleware: `django_tenants.middleware.TenantSubfolderMiddleware` (primero en la lista)
- **SHARED_APPS (schema public):** `django_tenants`, `apps.tenant`, `django.contrib.*`, `rest_framework`, `rest_framework_simplejwt`, `corsheaders`, `django_filters`, `apps.core`
- **TENANT_APPS (schema por clinica):** auth, sessions, admin, token_blacklist, `apps.usuarios.*`, `apps.bitacora`, `apps.pacientes.*`, `apps.atencionClinica.*` (todas las sub-apps), `apps.crm`, `apps.notificaciones.*`
- **URLs separadas:**
  - `config/urls.py` → URLs dentro de tenant scope: `/t/<slug>/api/...`
  - `config/urls_public.py` → URLs en schema public: `/api/...` (health, tenant lookup, admin)
- **Modelos en `apps.tenant`:**
  - `Tenant` (hereda `TenantMixin`): slug, nombre, razon_social, nit, activo, auto_create_schema=True
  - `Domain` (hereda `DomainMixin`): dominio por tenant
  - `SubscriptionPlan`: FREE/PLUS/PRO con limites y features
  - `TenantSubscription`: estado, trial, renovacion automatica
  - `TenantUsage`: contadores por periodo
  - `TenantSettings`: timezone, idioma, branding (nombre, colores, logo), flags
- **Endpoints nuevos:**
  - `GET /t/<slug>/api/organization/me/` → datos publicos del tenant actual
  - `GET/PATCH/PUT /t/<slug>/api/organization/settings/` → config visual/funcional (ADMIN/ADMINISTRATIVO)
  - `POST /t/<slug>/api/organization/change-plan/` → cambio de plan (ADMIN/ADMINISTRATIVO)
  - `GET /api/tenants/<slug>/` → busqueda publica de tenant (antes de entrar al scope)
  - `GET/POST /api/tenants/` → administracion central de tenants (superadmin)
  - `POST /api/tenants/{id}/activar|suspender|cambiar-plan/` → acciones de superadmin
- **Auth con tenant:**
  - `GET /t/<slug>/api/auth/tenant/` → config publica del tenant antes del login
  - `POST /t/<slug>/api/auth/login/` → respuesta incluye `usuario`, `tenant`, `access`, `refresh`
  - JWT refresh token incluye claims: `tenant_id`, `tenant_schema`, `tenant_slug`
  - `GET /api/auth/me/` → incluye `tenant` en la respuesta
  - `POST /api/auth/register/` → registro con tenant info + FCM push
- **Entrypoint completo (`entrypoint.sh`):**
  1. Espera PostgreSQL
  2. Asegura schema `public` existe
  3. `migrate_schemas --shared --noinput`
  4. Bootstrap: planes (FREE/PLUS/PRO), tenant public, tenant demo (`clinica_demo`)
  5. `migrate_schemas --tenant --noinput`
  6. Seeders: public (admin) + tenant demo (admin, permisos, roles, tipos_cita, demo_paciente)
  7. `collectstatic`
- **Variables de entorno nuevas:** `PUBLIC_DOMAIN`, `DEMO_TENANT_SCHEMA`, `DEMO_TENANT_SLUG`, `DEMO_TENANT_NAME`, `DEMO_TENANT_EMAIL`, `DEMO_TENANT_DOMAIN`, `BOOTSTRAP_PUBLIC_SCHEMA`, `RUN_MIGRATIONS`, `BOOTSTRAP_TENANTS`, `RUN_SEEDERS`, `RUN_COLLECTSTATIC`
- **Tenant demo por defecto:** schema `clinica_demo`, slug `clinica-demo`, plan FREE con trial 14 dias
- **Migraciones:** ahora se usa `migrate_schemas --shared` y `migrate_schemas --tenant` en lugar de `migrate` simple
- **⚠️ GAP CRITICO:** Frontend (Next.js) y Mobile (Flutter) **NO han sido actualizados** para usar URLs con prefijo de tenant. Siguen usando `/api/...` directo. Esto requiere adaptacion urgente en ambos clientes.

## Actualizacion 2026-05-09 (push turnos: cierre backend recordatorios → FCM)

- Se completo el faltante principal de push para turnos programados:
  - `backend/apps/notificaciones/automatizaciones/serializers.py` ahora usa `enviar_push_a_usuario(...)` dentro de `procesar_tarea_recordatorio(...)`.
  - Antes: el job solo persistia `Notificacion` en BD (campanita interna).
  - Ahora: persiste en BD y ademas intenta envio FCM real a los dispositivos registrados del usuario.
- Payload push agregado para trazabilidad en cliente:
  - `tipo=recordatorio_control`
  - `postoperatorio_id`
  - `tarea_id`
- Comportamiento por entorno:
  - Si `FIREBASE_CREDENTIALS_PATH` no esta configurado, no rompe el flujo; queda guardada en BD y loguea warning.
  - Si hay credenciales + tokens FCM, envia push.
- Estado verificado de la capa push existente:
  - Mobile ya inicializaba Firebase en `main.dart` y gestionaba token/foreground/background en `core/notifications/push_notifications.dart`.
  - Backend ya tenia registro de dispositivos (`/api/notificaciones/dispositivos/`) y servicio de envio push (`apps.notificaciones.services`).

## Actualizacion 2026-05-08 (mobile: agendar cita desde la app)

- Se implemento flujo completo para agendar citas desde la app paciente:
  - **Backend**: nuevo endpoint `GET /api/especialistas-disponibles/` (solo lectura, para pacientes).
  - **CitasRepository**: metodos `scheduleAppointment()`, `getAvailableSpecialists()`, `getAppointmentTypes()`.
  - **ScheduleAppointmentScreen**: flujo de 3 pasos (especialista → fecha/hora → confirmar).
  - **Ruta**: `/schedule-appointment` agregada en `routes.dart`.
  - **Home**: boton "Agendar cita >" en tarjeta de proxima cita conectado al flujo.
- Validacion: `flutter analyze` sin errores.

## Actualizacion 2026-05-08 (mobile: recuperacion de contraseña con Mailhog)

- Se implemento flujo completo de recuperacion de contraseña en mobile:
  - **AuthRepository**: `requestPasswordReset(email)` y `confirmPasswordReset(token, newPassword)`.
  - **ForgotPasswordScreen**: input email → POST /auth/reset-password/ → mensaje de exito generico.
  - **ResetPasswordScreen**: input token + nueva contraseña → POST /auth/reset-password/confirm/ → exito → login.
  - **Rutas**: `/forgot-password` y `/reset-password` agregadas en `routes.dart`.
  - **Login**: boton "¿Olvidaste tu contraseña?" ahora navega a `/forgot-password`.
- Backend ya tenia endpoints implementados: siempre responde 200 en solicitud (no revela si email existe), token expira en 2h.
- En desarrollo: token se obtiene del email en Mailhog (UI web).
- Validacion: `flutter analyze` sin errores.

## Actualizacion 2026-05-08 (mobile UI/UX UX-05: accesibilidad tactil/contraste/semantics)

- Se aplicaron mejoras de accesibilidad en 7 archivos de la app paciente:
  - **Semantics labels**: avatar, notificaciones, fecha, accesos rapidos, tabs de citas, tiles de citas, cards de consultas/estudios, botones de login/register.
  - **Touch targets minimos 44x44**: `_TabChip` (ConstrainedBox minHeight: 44), `_QuickTile` (ConstrainedBox minHeight: 44), `FilledButton` (minimumSize: 48).
  - **Feedback visual**: `InkWell` con `borderRadius` consistente en todos los elementos interactivos.
  - **Labels descriptivos**: cada elemento interactivo tiene `Semantics(label: ...)` con contexto claro para lectores de pantalla.
- Validacion: `flutter analyze` sin errores, solo info warnings (`prefer_const_constructors`, `unnecessary_brace_in_string_interps`).

## Actualizacion 2026-05-08 (mobile UI/UX iteracion 3: tokenizacion completa Batch A+B+C)

- **Batch A (Home screens):** `patient_home_screen.dart`, `patient_appointments_section.dart`, `patient_next_appointment_card.dart`.
- **Batch B (Historial + Auth):** `patient_clinical_screen.dart`, `login_screen.dart`, `register_screen.dart`.
- **Batch C (Header + Accesos):** `patient_home_header.dart`, `patient_quick_access_row.dart`.
- Tokens aplicados: `space1` (4), `space2` (8), `space3` (12), `space4` (16), `space5` (20), `space6` (24), `motionNormal` (220ms).
- Validacion: `flutter analyze` sin errores, solo info warnings (`prefer_const_constructors` por uso de tokens no-const).
- Spacing y motion centralizados en `theme.dart` para toda la app paciente.

## Actualizacion 2026-05-08 (mobile UI/UX iteracion 3: tokenizacion Batch A)

- Se reemplazaron valores hardcodeados de spacing por tokens `AppTheme.space*` en:
  - `patient_home_screen.dart` (Profile tab + \_ProfileCard)
  - `patient_appointments_section.dart` (padding, gaps, AnimatedSwitcher duration)
  - `patient_next_appointment_card.dart` (margins, padding, gaps entre elementos)
- Validacion: `flutter analyze` sin errores, solo 25 info warnings (`prefer_const_constructors` por uso de tokens no-const).
- Tokens aplicados: `space1` (4), `space2` (8), `space3` (12), `space4` (16), `space5` (20), `space6` (24), `motionNormal` (220ms).

## Actualizacion 2026-05-08 (mobile UI/UX iteracion 2: tokens + next appointment + perfil)

- Se agregaron tokens de motion y spacing en `config/theme.dart`:
  - `motionFast` (150ms), `motionNormal` (220ms), `motionSlow` (280ms)
  - `space1` (4) a `space6` (24) para padding/margins consistentes
- Se agrego `AppShimmerCard` en `app_async_states.dart` para loading de cards hero.
- Se refactorizo `PatientNextAppointmentCard`:
  - usa `AppShimmerCard`, `AppErrorStateCard`, `AppEmptyStateCard` compartidos
  - agrega `AnimatedSwitcher` con transicion fade
  - elimina `_LoadingCard` y `_ErrorCard` duplicados
- Se refactorizo `_ProfileTab` en `PatientHomeScreen`:
  - envuelto en `AppFadeSlideIn` para entrada suave
  - agregado `_ProfileCard` con jerarquia visual mejorada (avatar, email separado)
  - usa tokens de spacing cuando aplica
- Validacion: `flutter analyze` sin errores, solo 3 info de `prefer_const_constructors`.

## Actualizacion 2026-05-08 (mobile UI/UX iteracion 1: estados reutilizables + microanimaciones)

- Se creo `mobile/lib/core/ui/widgets/app_async_states.dart` con componentes reutilizables de UX:
  - `AppEmptyStateCard`
  - `AppErrorStateCard`
  - `AppSkeletonTile`
  - `AppFadeSlideIn`
- Se refactorizo `PatientAppointmentsSection` para usar estados compartidos (loading/error/empty) y `AnimatedSwitcher` + entrada `fade/slide`.
- Se refactorizo `PatientClinicalScreen` (Consultas y Estudios) para homogeneizar feedback de carga/error/vacio con los mismos componentes compartidos y transiciones suaves.
- Se mejoro consistencia visual/tactil en estados de error (`FilledButton` con altura minima) y semantica basica en empty state.
- Validacion ejecutada: `flutter analyze` sobre los 3 archivos modificados, sin issues.

## Actualizacion 2026-05-08 (rollback comando Sleek + artefacto DESING)

- Se retiro el comando `.opencode/commands/sleek-design.md` para evitar dependencia operativa de API externa en flujo base del proyecto.
- Se removio su referencia en `.opencode/README.md` y en `docs/ai/PROMPTS_LIBRARY.md`.
- Se removio la entrada agregada de `sleek-design-mobile-apps` en `docs/ai/SKILLS_REGISTRY.md`.
- Se creo `docs/ai/DESING.md` como registro vivo de decisiones y backlog UI/UX mobile del proyecto actual (paciente-first).

## Actualizacion 2026-05-08 (workflow Sleek para diseno mobile)

- Se agrego el comando `/sleek-design` en `.opencode/commands/sleek-design.md` para ejecutar diseno mobile con Sleek (`https://sleek.design/api/v1/*`) con flujo completo: resolver proyecto, enviar chat, poll de run, screenshots y export de HTML por `componentId`.
- El comando incorpora reglas de seguridad: uso exclusivo de `SLEEK_API_KEY` por header Bearer, host unico HTTPS, no exponer secretos, no usar `.env` real y rechazo de `imageUrls` no HTTPS.
- Se actualizo `.opencode/README.md`, `docs/ai/PROMPTS_LIBRARY.md` y `docs/ai/SKILLS_REGISTRY.md` para registrar el nuevo workflow y la skill de workspace `sleek-design-mobile-apps`.

## Actualizacion 2026-05-08 (workflows OpenCode: commands, skills, plugin y todo-list)

- Se agrego el comando seguro `/commit` en `.opencode/commands/commit.md`, diseñado para revisar `git status`, diffs, `.gitignore`, nombres de archivos sensibles y staged changes antes de crear un commit.
- Se agregaron comandos reutilizables en `.opencode/commands/`: `/check-project`, `/update-memory`, `/review-security`, `/validate-stack`, `/puds-status`, `/handoff` y `/todo-start`.
- Se agregaron skills locales OpenCode en `.opencode/skills/`: `project-memory`, `puds-traceability`, `security-review`, `docker-debug`, `clinical-ux-review` y `todo-workflow`.
- Se agrego el plugin local `.opencode/plugins/env-protection.js`, que bloquea acceso a archivos `.env` reales y permite plantillas como `.env.example`, `.env.sample` y `.env.template`.
- Se actualizaron los agentes de `.opencode/agents/` para recomendar uso de todo-list en tareas multi-paso y permitir `skill: allow` en especialistas.
- El `orchestrator` ahora recomienda skills segun contexto: memoria, seguridad, PUDS, Docker, UX clinica y organizacion con todos.
- Se actualizaron `.opencode/README.md`, `.opencode/skills/README.md`, `docs/ai/SKILLS_REGISTRY.md` y `docs/ai/PROMPTS_LIBRARY.md` para documentar los workflows reutilizables.

## Actualizacion 2026-05-08 (sistema multi-agente OpenCode local)

- Se creo la estructura OpenCode-compatible `.opencode/agents/` con agentes especializados en formato hibrido: frontmatter machine-readable soportado por OpenCode + cuerpo tecnico operativo.
- Agentes creados: `orchestrator`, `backend`, `frontend`, `mobile`, `ui-ux`, `architecture`, `architect-planner`, `code-review`, `qa-testing`, `devops` e `infra`.
- El `orchestrator` enruta tareas por intencion: backend, frontend, mobile, UI/UX, arquitectura, planificacion, review, testing, DevOps e infraestructura; para tareas mixtas divide trabajo y consolida respuesta.
- Se creo `.opencode/README.md` con lista de agentes, flujo de orquestacion, reglas de routing y nota de integracion con skills. No se deja README dentro de `.opencode/agents/` porque OpenCode lo carga como agente.
- Se creo `.opencode/skills/` como punto local para skills OpenCode del proyecto. No se detectaron skills OpenCode locales alli; adicionalmente existen skills de workspace en `.agents/skills/`: `caveman` y `find-skills`.
- Correccion frente a la documentacion oficial: OpenCode carga agentes de proyecto desde `.opencode/agents/`; el nombre del agente viene del nombre del archivo; para heredar modelo se omite `model` en lugar de usar `model: Inherit`.

## Actualizacion 2026-05-04 (Fase 1b multi-tenant primera ola)

- Se tenantizaron roots críticos con FK nullable a `Tenant`: `Usuario`, `Paciente`, `HistoriaClinica`, `Bitacora`, `Notificacion`, `DispositivoFcm` y `Especialista`.
- Las tablas existentes fueron backfilled al tenant `legacy` y las nuevas altas asignan tenant server-side desde contexto runtime o fallback `legacy`.
- Se añadió scoping mínimo por tenant en listados de `Usuario`, `Paciente`, `HistoriaClinica`, `Bitacora` y `Especialista` cuando `request.tenant` existe.
- Se agregó un test de aislamiento para `Paciente` (create + list + retrieve cross-tenant 404).
- Aún no se fuerza `NOT NULL` en estas raíces: quedó para la siguiente ola porque auth pública sigue bypassing el middleware de tenant.

## Actualizacion 2026-05-05 (Fase 1b multi-tenant segunda ola, parcial)

- Se reforzó el scoping tenant-aware en `citas`, `consultas`, `crm` y `notificaciones.automatizaciones` con FK nullable a `Tenant`, backfill a `legacy` y validaciones cross-tenant en serializers.
- Se agregó `for_tenant()`/`for_current_tenant()` más consistente en el queryset base de tenants.
- Se tenantizaron `SegmentacionPaciente`, `CampanaCRM`, `HistorialContacto`, `ReglaRecordatorio`, `TareaRecordatorioProgramada`, `LogEjecucionRecordatorio`, `Consulta`, `Estudio`, `Cita` y `DisponibilidadEspecialista`.
- Se añadieron pruebas mínimas de aislamiento cross-tenant para `Citas` y `CRM`.
- La suite local no pudo ejecutarse por entorno incompleto: `ModuleNotFoundError: No module named 'django'` / `rest_framework` en el Python del host.

## Actualizacion 2026-05-04 (Fase 1a multi-tenant base)

- Se agrego la infraestructura base de tenants sin scoping masivo todavia.
- Nuevo app backend `apps.tenant` con `Tenant` y `TenantSettings`.
- Middleware `apps.core.tenant_middleware.TenantMiddleware` resuelve `X-Tenant-Slug`, asigna `request.tenant` y expone el tenant en contexto utilitario.
- Los errores del middleware ahora salen como `JsonResponse` de Django y el `ContextVar` se limpia al inicio/final de cada request.
- Se bootstrappea el tenant default `legacy` para compatibilidad inicial.
- Se agregaron tests minimos para header tenant, tenant ausente/inexistente/inactivo y bypass de health/public.
- No se toco frontend ni el scoping por modulo existente.

## Estado Actual del Proyecto

**Sprint 1 backend completo** + **Mobile paciente integrado** (login + home con citas reales). Frontend Next.js con auth por correo alineado al mismo contrato de API.

## Actualizacion 2026-05-01 (Fase 1 CU12)

- Nuevo modulo backend `apps.atencionClinica.evaluacion_quirurgica` implementado.
- Endpoint CRUD habilitado: `GET/POST /api/evaluaciones-quirurgicas/` y `GET/PATCH/DELETE /api/evaluaciones-quirurgicas/{id}/`.
- Validaciones de consistencia activas:
  - historia clinica debe pertenecer al paciente.
  - consulta debe pertenecer al paciente.
- Permisos por rol:
  - mutaciones (create/update/delete): `IsAuthenticated + IsMedicoOrAdmin`.
  - lectura por queryset segun `tipo_usuario` (PACIENTE propio, MEDICO/ESPECIALISTA propias evaluaciones, staff global).
- Bitacora en create/update/delete (`modulo='evaluacion_quirurgica'`).
- Integracion de app realizada en `config/settings.py` y `config/urls.py`.
- Tests minimos agregados para permisos, validaciones y CRUD base del modulo.

## Actualizacion 2026-05-01 (Fase 2 CU13)

- Nuevo modulo backend `apps.atencionClinica.preoperatorio` implementado.
- Endpoint CRUD habilitado: `GET/POST /api/preoperatorios/` y `GET/PATCH/DELETE /api/preoperatorios/{id}/`.
- Entidad incluye estado preoperatorio, checklist y examenes:
  - `estado_preoperatorio`
  - `checklist_completado` / `checklist_detalle`
  - `examenes_requeridos` / `examenes_completados`
  - `apto_anestesia`
- Validaciones activas:
  - historia clinica corresponde al paciente
  - evaluacion quirurgica corresponde al paciente
  - cita corresponde al paciente
  - estado `APROBADO` exige `checklist_completado=true` y `apto_anestesia=true`
- Permisos por rol:
  - mutaciones: `IsAuthenticated + IsMedicoOrAdmin`.
  - lectura por queryset segun `tipo_usuario` (PACIENTE propio, MEDICO/ESPECIALISTA por `validado_por`, staff global).
- Bitacora en create/update/delete (`modulo='preoperatorio'`).
- Integracion en `config/settings.py` y `config/urls.py`.
- Tests minimos agregados para permisos, validaciones y CRUD base del modulo.

## Actualizacion 2026-05-01 (Fase 3 CU14)

- Nuevo modulo backend `apps.atencionClinica.cirugias` implementado.
- Endpoint CRUD habilitado: `GET/POST /api/cirugias/` y `GET/PATCH/DELETE /api/cirugias/{id}/`.
- Accion adicional habilitada: `POST /api/cirugias/{id}/reprogramar/`.
- Entidad incluye:
  - `estado_cirugia`
  - `fecha_programada`
  - `fecha_real_inicio` / `fecha_real_fin`
  - `cirujano`
  - `resultado`
  - `complicaciones`
- Validaciones activas:
  - historia clinica corresponde al paciente
  - preoperatorio corresponde al paciente
  - cita corresponde al paciente
  - estado `FINALIZADA` exige `fecha_real_inicio` y `fecha_real_fin`
  - `fecha_real_fin >= fecha_real_inicio`
- Permisos por rol:
  - mutaciones y reprogramacion: `IsAuthenticated + IsMedicoOrAdmin`.
  - lectura por queryset segun `tipo_usuario` (PACIENTE propio, MEDICO/ESPECIALISTA por `cirujano`, staff global).
- Bitacora en create/update/delete y reprogramacion (`modulo='cirugias'`).
- Integracion en `config/settings.py` y `config/urls.py`.
- Tests minimos agregados para permisos, validaciones, CRUD y accion de reprogramacion.

## Actualizacion 2026-05-04 (Fase 4 CU15)

- Nuevo modulo backend `apps.atencionClinica.postoperatorio` implementado.
- Endpoint CRUD habilitado: `GET/POST /api/postoperatorios/` y `GET/PATCH/DELETE /api/postoperatorios/{id}/`.
- Filtros funcionales habilitados por query params:
  - `id_paciente`
  - `id_cirugia`
  - `estado_postoperatorio`
  - `fecha=YYYY-MM-DD` (sobre `fecha_control`)
- Entidad minima incluida:
  - `alertas`
  - `proximo_control`
  - `profesional_atiende`
  - `estado_postoperatorio`
- Validaciones activas:
  - historia clinica corresponde al paciente
  - cirugia corresponde al paciente
  - `proximo_control >= fecha_control`
- Permisos por rol:
  - mutaciones: `IsAuthenticated + IsMedicoOrAdmin`.
  - lectura por queryset segun `tipo_usuario` (PACIENTE propio, MEDICO/ESPECIALISTA por `profesional_atiende`, staff global).
- Bitacora en create/update/delete (`modulo='postoperatorio'`).
- Integracion en `config/settings.py` y `config/urls.py`.
- Tests minimos agregados en `backend/apps/atencionClinica/postoperatorio/tests/test_postoperatorio.py`.

## Actualizacion 2026-05-04 (Fase 5 CU16 CRM pacientes)

- Nuevo modulo backend `apps.crm` implementado en `backend/apps/crm/`.
- Endpoints CRUD habilitados:
  - `GET/POST /api/crm-segmentaciones/`
  - `GET/PATCH/DELETE /api/crm-segmentaciones/{id}/`
  - `GET/POST /api/crm-campanas/`
  - `GET/PATCH/DELETE /api/crm-campanas/{id}/`
  - `GET/POST /api/crm-contactos/`
  - `GET/PATCH/DELETE /api/crm-contactos/{id}/`
- Entidades minimas incluidas:
  - Segmentacion (`nombre`, `criterios`, `activo`)
  - Campana (`segmentacion`, `estado`, `fecha_inicio`, `fecha_fin`)
  - Historial de contacto (`paciente`, `campana`, `canal`, `resultado`, `fecha_contacto`)
- Validaciones activas:
  - `fecha_fin` de campana no puede ser anterior a `fecha_inicio`.
- Permisos por rol:
  - mutaciones: `IsAuthenticated + IsAdministrativoOrAdmin`.
  - lectura: `IsAuthenticated`.
- Bitacora en create/update/delete para las 3 entidades (`modulo='crm'`).
- Integracion en `config/settings.py` y `config/urls.py` manteniendo prefijo base `/api/`.
- Tests minimos agregados en `backend/apps/crm/tests/test_crm.py` (permisos, validacion y CRUD base).

## Actualizacion 2026-05-04 (Fase 6 CU17 recordatorios automaticos)

- Nuevo modulo backend `apps.notificaciones.automatizaciones` implementado en `backend/apps/notificaciones/automatizaciones/`.
- Endpoints CRUD/listado habilitados bajo `/api/notificaciones/`:
  - `GET/POST /api/notificaciones/reglas/`
  - `GET/PATCH/DELETE /api/notificaciones/reglas/{id}/`
  - `GET /api/notificaciones/tareas/`
  - `POST /api/notificaciones/tareas/generar/`
  - `POST /api/notificaciones/tareas/procesar/`
  - `GET /api/notificaciones/logs/`
- Entidades minimas incluidas:
  - `ReglaRecordatorio`
  - `TareaRecordatorioProgramada`
  - `LogEjecucionRecordatorio`
- Estrategia segura de ejecucion:
  - comando cron-friendly `python manage.py procesar_recordatorios --limit N`
  - procesamiento asincrono por lote sin bloquear requests web.
- Permisos y seguridad:
  - mutaciones de reglas y generacion/procesamiento de tareas restringidas a `IsAdministrativoOrAdmin`.
  - lecturas en `IsAuthenticated`.
  - bitacora en create/update/delete de reglas y generacion de tareas.
- Integracion en `config/settings.py` (`apps.notificaciones.automatizaciones`) y enrutamiento en `apps/notificaciones/urls.py`.
- Tests minimos agregados en `backend/apps/notificaciones/automatizaciones/tests/test_automatizaciones.py`.
- En host local no se pudo ejecutar pytest por entorno incompleto (`ModuleNotFoundError: No module named 'django'` y warning `Unknown config option: DJANGO_SETTINGS_MODULE`).

## Qué Ya Está Hecho

### Backend (Django / DRF)

- **`TIME_ZONE`:** `America/La_Paz` (Bolivia, mismo huso que Santa Cruz).
- **Permisos (`/api/permisos/`):** `ReadOnlyModelViewSet`; listado/ detalle para **ADMIN** y **ADMINISTRATIVO**; altas/bajas de códigos vía seed/migraciones.
- **Bitácora:** eventos adicionales en consultas, estudios, citas (update/delete), roles (CRUD y asignación de permisos), eliminación de paciente; más entradas con `user_agent` e IP.
- Arquitectura modular, Docker, PostgreSQL, Mailhog.
- CustomUser (`apps.users.Usuario`), JWT + blacklist, prefijo API **`/api/`** (no `/api/v1/`).
- Apps Sprint 1: usuarios, pacientes, especialistas, historias clínicas modulares, citas, bitácora, etc.
- **`POST /api/auth/login/`**: body **`{ "email", "password" }`** — solo correo; validación con `check_password` (no `authenticate()`).
- **`CitaViewSet.get_queryset()`**: PACIENTE solo ve sus citas; MEDICO/ESPECIALISTA las suyas; ADMIN/ADMINISTRATIVO todas.
- **`ConsultaViewSet` / `EstudioViewSet` `get_queryset()`:** PACIENTE solo registros de su ficha (`Paciente.usuario`); MEDICO/ESPECIALISTA consultas propias / estudios ligados a consultas donde actuó como `especialista`; ADMIN/ADMINISTRATIVO todo el conjunto, con filtro opcional `?paciente_id=` en estudios/consultas para staff.
- **`ALLOWED_HOSTS`**: con `DJANGO_DEBUG=True` se añade `*` para desarrollo (móvil por IP LAN sin listar cada host).
- **`SIMPLE_JWT['SIGNING_KEY']`**: si `DJANGO_SECRET_KEY` tiene menos de 32 bytes en UTF-8, se deriva SHA-256 hex (evita `InsecureKeyLengthWarning`).
- **Seeders**: `seed`, `seed --only demo_paciente` — paciente demo + 2 médicos + 2 citas (ver `seed_demo_paciente.py`).

### Mobile (Flutter)

- Login modular: `login_header`, `login_form`, `login_actions`; tema alineado a diseño clínica.
- **`API_BASE_URL`** en `mobile/.env` (**obligatoria**): debe apuntar a la base del API (`.../api`); `AppConfig.apiBaseUrl` **normaliza barra final** (`.../api/`); si falta la variable, la app falla al usar la API (sin fallback hardcodeado).
- **Textos y legales por `.env` (opcional):** `APP_NAME`, `LOGIN_SUBTITLE`, `LEGAL_TERMS_URL`, `LEGAL_PRIVACY_URL` — `MaterialApp.title` y cabecera de login usan `APP_NAME`; términos/privacidad abren con `url_launcher` si hay URL válida.
- **Registro:** `RegisterScreen` → `POST auth/register/` solo **paciente** (`tipo_usuario` fijo en app y **`RegisterView` fuerza `PACIENTE`** en backend); guarda JWT; diálogo con estado de envío de correo (`email_confirmacion_enviada`). Backend envía **correo de confirmación** vía SMTP (`EMAIL_HOST`/`EMAIL_PORT`, Mailhog en Docker); `SITE_DISPLAY_NAME` y pie opcional `REGISTRATION_EMAIL_FOOTER_HINT` en `.env` raíz. Mobile: `MAILHOG_WEB_URL` o `MAILHOG_INFER_FROM_API=true` + `MAILHOG_UI_PORT` en `mobile/.env` para abrir la UI de Mailhog tras registrarse.
- Rutas relativas sin `/` inicial: `auth/login/`, `citas/`, etc.
- Android: `usesCleartextTraffic` para HTTP en dev.
- Timeout HTTP 30 s (margen arranque Docker/Postgres).
- **`intl` + `initializeDateFormatting('es')`** en `main.dart`.
- Home **paciente** (`PatientHomeScreen`): cabecera, tarjeta **próxima cita** o **última cita** (si no hay turnos futuros), accesos rápidos (Mis citas → pestaña Citas; Historial → pantalla **Consultas / Estudios**; Contacto → `tel:` vía **`CLINIC_PHONE`** opcional en `mobile/.env`), lista Próximas/Historial, estados carga/vacío/error; `GET citas/` vía `CitasRepository` + Riverpod; pestaña **Citas** con el mismo listado (sin enlace redundante “Ver todas”); **Perfil** + logout; pull-to-refresh invalida también datos de consultas/estudios.
- **Mobile historial clínico:** `PatientClinicalScreen` — `GET consultas/lista/` y `GET consultas/estudios/` vía `ClinicalRepository` + providers Riverpod; listas con pull-to-refresh.
- **Staff / admin / médico** (`HomeScreen` → `_StaffHomeShell`): KPIs desde API (`pacientes/`, `citas/`, `especialistas/` con conteos DRF; `null`/“—” si 403 por rol); primeras 5 citas; bottom nav **Citas** (listado según `get_queryset` del backend), **Pacientes** (lista primera página o mensaje si 403), **Perfil** + logout.

### Frontend (Next.js)

- Login usa **`email` + `password`** en `POST /api/auth/login/` (tipo `LoginCredentials` actualizado).
- Demo admin en UI: `admin@oftalmologia.local` / `admin123`.
- **`NEXT_PUBLIC_API_URL`** obligatoria (sin fallback hardcodeado en runtime); `next.config.js` deriva rewrites e `images.remotePatterns` de esa URL.
- **Cliente Axios:** rutas relativas al `baseURL` (p. ej. `pacientes/`, `citas/`) — **no** anteponer otra vez `/api/` (evita `/api/api/...`).
- **Atención clínica:** `POST /consultas/lista/` para consultas; `POST /consultas/estudios/` para estudios/mediciones (multipart). **Mediciones (web):** ruta `/mediciones` — listado `GET /consultas/estudios/` (paginado vía `fetchAll`), edición `PATCH` (JSON o multipart si hay archivo nuevo), eliminación `DELETE`; enlace en sidebar **Atención clínica → Mediciones**.
- **Layout dashboard:** sidebar tipo drawer en `<768px` con overlay; desktop mantiene ancho colapsable; columna de contenido con **`min-h-0 overflow-hidden`** y `<main>` con **`min-h-0`** para que el flex no recorte la zona scrollable bajo `h-screen overflow-hidden`.
- **Permisos (pantalla):** catálogo **solo lectura**; asignación en **Roles**.
- **Bitácora (pantalla):** métricas con `count` de API; hora mostrada en **`America/La_Paz`** (Bolivia).
- **Dashboard:** KPIs desde API (incl. citas `ATENDIDA`); sin contador hardcodeado de “visitas”.
- **Consultas:** ruta **`/consultas`** lista `GET /consultas/lista/`; tras registrar consulta se redirige allí. **Registrar consulta:** al elegir cita se rellena el paciente; el desplegable de citas filtra por paciente y excluye canceladas; **backend:** al crear consulta con cita, pasa a estado **ATENDIDA** si estaba programada/confirmada/reprogramada; validación de coherencia paciente–cita.
- **Roles:** listado de permisos en el modal sin filtrar por `activo` inexistente en API (`activo !== false` / tipo opcional).
- **Usuarios (alta PACIENTE):** `POST /users/` acepta `id_paciente_existente` (vincular ficha sin `usuario`) o `paciente_tipo_documento` / `paciente_numero_documento` (nueva ficha con `generar_numero_historia`). Listado pacientes: `GET /pacientes/?sin_cuenta=true`. Web: modal “Nuevo usuario” con bloque azul si tipo Paciente.
- **Pacientes (modal):** mensaje genérico ante errores sin mapa de campos (`detail`, `non_field_errors`, 500); **no** usar `items-center` en overlays altos (centraba el cuerpo y ocultaba cabecera y botones): patrón `min-h-[100dvh]` + tarjeta `self-start` + `max-h` con **scroll interno** y pie fijo; overlay renderizado con **`createPortal(..., document.body)`** para que no lo recorte el `overflow` del `<main>`; `z-[200]`; cierre al clic en backdrop; `noValidate` + scroll al tope si falla validación o error API.
- **Historial clínico:** modelo **una HC por paciente** (`OneToOne`); el POST fallaba con 400 si el paciente ya tenía historia. Backend: `validate_id_paciente` con mensaje claro. Frontend: `fetchAll` de pacientes, opciones deshabilitadas con “ya tiene historia”, banner de error con cuerpo de la API, aviso si no queda ningún paciente elegible.
- **`fetchAll` (Axios):** normaliza URLs `next` con host `0.0.0.0` o `backend` al origen de `NEXT_PUBLIC_API_URL`.

### Infra / configuración / despliegue

- **Backend Docker `entrypoint.sh`:** tras esperar a Postgres, ejecuta **`migrate --noinput`** y luego `collectstatic`; evita BD vacía sin tablas (`django_session`, JWT blacklist, `usuarios`, etc.). El **seed** sigue siendo manual (`python manage.py seed`).
- **URLs e IPs:** raíz `.env` — `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`, puertos `HOST_PORT_*`. **Mobile:** `mobile/.env` → `API_BASE_URL` (obligatorio; sin fallback en código). Ver comentarios en `.env.example`.
- **Git:** `.env` y `mobile/.env` en `.gitignore`; solo versionar `.env.example` / `mobile/.env.example`.
- **Backend Docker:** `ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]` para que el bind mount `./backend:/app` no dependa del bit ejecutable de `entrypoint.sh` en el host.
- **Ubuntu + Docker 28:** usar plugin **Compose v2** (`docker compose`); el `docker-compose` Python 1.29 puede fallar con `KeyError: 'ContainerConfig'`. Guía: `docs/guides/despliegue-ubuntu-nube.md`.
- **Tests backend:** `backend/conftest.py` + `pytest.ini` definen variables mínimas si no hay `.env` completo.

## Credenciales de Desarrollo (referencia)

| Uso           | Email                      | Password    |
| ------------- | -------------------------- | ----------- |
| Admin (seed)  | `admin@oftalmologia.local` | `admin123`  |
| Paciente demo | `brandon@gmail.com`        | `Felipe321` |

Ejecutar: `docker compose exec backend python manage.py seed --only demo_paciente` (requiere `tipos_cita` ya sembrados).

## Endpoints Clave (recordatorio)

- Tenant lookup publico: `GET /api/tenants/<slug>/` → datos basicos de clinica
- Tenant actual (dentro de scope): `GET /t/<slug>/api/organization/me/`
- Auth tenant (antes de login): `GET /t/<slug>/api/auth/tenant/`
- Login: `POST /t/<slug>/api/auth/login/` → `{ email, password }` → `{ usuario, tenant, access, refresh }`
- Citas (filtradas por rol y tenant): `GET /t/<slug>/api/citas/?ordering=fecha_hora_inicio`
- Health: `GET /api/health/` (publico, sin tenant)

## Riesgos Conocidos

- **Frontend y Mobile sin tenant URLs:** los clientes siguen apuntando a `/api/...` directo. Si el backend solo acepta rutas `/t/<slug>/api/...`, los clientes actuales no funcionaran.
- `numero_documento` UNIQUE en Paciente — registro auto puede dejar `PENDIENTE-{id}` hasta actualizacion.
- Movil en **dispositivo fisico**: `API_BASE_URL` = IP LAN del PC (`ipconfig`), misma Wi‑Fi; no usar `10.0.2.2` fuera del emulador Android.
- Tras cambiar `DJANGO_SECRET_KEY` corta por derivacion JWT, tokens previos invalidan hasta nuevo login.
- Con `django-tenants`, las migraciones deben ejecutarse con `migrate_schemas --shared` y `migrate_schemas --tenant`. Usar `migrate` simple puede crear tablas en el schema equivocado.
- Si una app nueva se agrega en `SHARED_APPS` en lugar de `TENANT_APPS` (o viceversa), las tablas se crean en el schema incorrecto.

---

_(Actualizado: 2026-05-09)_
