# HANDOFF LATEST

## Resumen

**Fecha:** 2026-05-09 — Fix login web: lookup tenant usa `GET /api/public/tenants/<slug>/` (antes `/api/tenants/...` → 404). Archivos: `frontend/src/app/(auth)/login/page.tsx`, `frontend/src/lib/api.ts`.

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

### J. `TenantContext` + refactor de llamadas duplicadas

Se creo `context/TenantContext.tsx`:
- Hace `GET organization/me/` UNA sola vez al montar el dashboard layout.
- Expone `orgData`, `planInfo`, `flags` y `refresh` a todo el arbol de componentes.
- Las paginas `usuarios`, `pacientes` y `citas-agenda` ahora consumen `useTenant()`
  en vez de hacer su propia llamada a `organization/me/` ? 0 requests duplicados.

### K. Sidebar con branding real + modulos condicionales

`Sidebar.tsx` ahora:
- Muestra nombre y logo real de la clinica usando `TenantStorage` + `orgData.branding`.
- Si `branding.logo_url` existe, renderiza `<Image>` del logo real; si no, usa el icono
  con `color_primario` del plan.
- Badge "Trial" en el header y en el item "Planes" si `subscription.estado === 'TRIAL'`.
- Modulo **CRM** aparece solo si `planInfo.permite_crm && flags.mostrar_modulo_crm`.
- Modulo **Notificaciones** aparece solo si `planInfo.permite_notificaciones && flags.mostrar_notificaciones`.
- Modulo **Reportes** aparece solo si `planInfo.permite_reportes_avanzados`.
- Se agrego grupo "Cuenta" con "Mi Perfil" y "Planes".

### L. `authService.login()` guarda tenant del response

El login multi-tenant devuelve `{ usuario, tenant, access, refresh }`.
`authService.login()` ahora llama `TenantStorage.setTenantData()` y `TenantStorage.setSlug()`
con los datos frescos del response, sincrorizando el storage sin necesidad de paso adicional.

### M. Nuevos tipos: `TenantOrgData`, `TenantOrgSettings`, `TenantFlags`

`lib/api.ts` ahora exporta:
- `TenantOrgData` ? shape de `GET organization/me/` (branding, config, settings, subscription, usage).
- `TenantOrgSettings` ? shape del endpoint `GET/PATCH organization/settings/`.
- `TenantFlags` ? flags de modulos (`mostrar_modulo_crm`, `mostrar_notificaciones`, etc.).
- `TenantSubscriptionEstado` ? union type del estado de suscripcion.

### N. `TenantContext` ampliado ? `usage` + `trial`
- Expone `usage` (contadores reales del backend) y `trial` (`isTrial`, `diasRestantes`).
- Pages `usuarios`, `pacientes`, `citas` usan `usage.xxx_actuales` para l?mites reales.
- `citas-agenda` elimina el fetch mensual extra cuando el backend expone `usage`.

### O. Banner TRIAL en el dashboard layout
`TrialBanner` se muestra entre el Header y `<main>` si `trial.isTrial === true`.
Colores rojo/naranja/amarillo seg?n d?as restantes. Bot?n "Ver Planes" + dismiss.

### P. P?gina `/configuracion-org`
Conectada a `GET/PATCH organization/settings/`. Permite cambiar: nombre de la cl?nica,
logo (preview en tiempo real), colores (color picker + hex), timezone, idioma, y flags
de m?dulos (`permit_reserva_online`, `mostrar_modulo_crm`, `mostrar_notificaciones`).
Al guardar llama `refresh()` del TenantContext ? Sidebar actualiza inmediatamente.

### Q. CU12 - Evaluaciones Quirurgicas (frontend completo)

Nuevos archivos:
- `frontend/src/lib/services/evaluacion_quirurgica.ts` ? CRUD completo + tipos TypeScript.
- `frontend/src/app/(dashboard)/(gestion-atencionclinica)/evaluaciones-quirurgicas/page.tsx` ? pagina completa.

La pagina incluye:
- Header con boton "Nueva evaluacion".
- 4 tarjetas de estadisticas: Total / Aptos / No aptos / Pendientes.
- Filtros: busqueda en texto + filtro por estado prequirurgico.
- Lista de tarjetas con: nombre de paciente, fecha, badge de estado, riesgo, preview de hallazgos.
- Modal crear/editar con 4 secciones: Paciente y HC / Datos de evaluacion / Hallazgos y plan / Estudios y observaciones.
- Toggle para `requiere_estudios_complementarios` que muestra campo `estudios_solicitados` de forma condicional.
- Modal de confirmacion de eliminacion.
- `Sidebar.tsx` actualizado: nuevo NavItem "Eval. Quirurgica" con icono `Scissors` bajo Atencion Clinica.
- `Header.tsx` actualizado: breadcrumb para `/evaluaciones-quirurgicas`.
- `lib/services/index.ts` actualizado: exporta `evaluacionQuirurgicaService`.

API backend: `GET/POST/PATCH/DELETE /evaluaciones-quirurgicas/`
Permisos backend: lectura para todos los autenticados; escritura solo `IsMedicoOrAdmin`.

### R. CU13 - Preoperatorio (frontend completo)

Nuevos archivos:
- `frontend/src/lib/services/preoperatorio.ts` ? CRUD completo + tipos TypeScript.
- `frontend/src/app/(dashboard)/(gestion-atencionclinica)/preoperatorio/page.tsx` ? pagina completa.

La pagina incluye:
- 4 stat cards: Total / Aprobados / En proceso / Pendientes.
- Filtros: busqueda + filtro por estado.
- Lista de tarjetas con: nombre paciente, badge de estado, fecha creacion, fecha cirugia programada, chips checklist/anestesia.
- Modal 5 secciones: Paciente y referencias / Estado / Checklist / Examenes / Aptitud.
- Selector de evaluacion quirurgica vinculando CU12 con CU13.
- Toggle visual para `checklist_completado` y `apto_anestesia`.
- Aviso en tiempo real si el usuario intenta seleccionar estado APROBADO sin cumplir los requisitos.
- Validacion espejo de la regla backend: APROBADO requiere checklist_completado=true y apto_anestesia=true.
- `Sidebar.tsx` actualizado: NavItem "Preoperatorio" con icono `ClipboardList`.
- `Header.tsx` actualizado: breadcrumb `/preoperatorio`.
- `lib/services/index.ts` actualizado: exporta `preoperatorioService`.

API backend: `GET/POST/PATCH/DELETE /preoperatorios/`
Permisos backend: lectura para todos los autenticados; escritura solo `IsMedicoOrAdmin`.
Regla de negocio clave: `estado=APROBADO` solo cuando `checklist_completado && apto_anestesia`.

### S. CU14 - Cirugias (frontend completo)

Nuevos archivos:
- `frontend/src/lib/services/cirugias.ts` ? CRUD + accion especial `reprogramar()`.
- `frontend/src/app/(dashboard)/(gestion-atencionclinica)/cirugias/page.tsx` ? pagina completa.

La pagina incluye:
- 4 stat cards: Total / Programadas / En curso / Finalizadas.
- Filtros: busqueda + filtro por estado (5 estados: PROGRAMADA, REPROGRAMADA, EN_CURSO, FINALIZADA, CANCELADA).
- Lista de tarjetas con: nombre paciente, badge de estado, fecha programada, procedimiento (preview), fechas reales + duracion calculada en minutos, chips de reprogramacion y complicaciones.
- Modal CRUD (5 secciones): Paciente y referencias / Programacion / Procedimiento / Resultado y complicaciones / Observaciones.
- Selector de preoperatorio vinculando CU13 con CU14.
- Validacion espejo de las reglas del backend (FINALIZADA requiere fechas reales; fecha_inicio <= fecha_fin).
- Aviso en tiempo real si estado = FINALIZADA sin fechas reales ingresadas.
- Mini-modal exclusivo "Reprogramar" ? llama a `POST /cirugias/{id}/reprogramar/` con nueva fecha + motivo.
- Boton "Reprogramar" visible solo en estados no terminales (no FINALIZADA ni CANCELADA).
- `Sidebar.tsx` actualizado: NavItem "Cirugias" con icono `Scalpel`.
- `Header.tsx` actualizado: breadcrumb `/cirugias`.
- `lib/services/index.ts` actualizado: exporta `cirugiasService`.

### T. CU15 - Postoperatorio (frontend completo)

Nuevos archivos:
- `frontend/src/lib/services/postoperatorio.ts` ? CRUD completo + tipos TypeScript.
- `frontend/src/app/(dashboard)/(gestion-atencionclinica)/postoperatorio/page.tsx` ? pagina completa.

La pagina incluye:
- Banner de alertas: muestra controles con proximo_control vencido o en las proximas 48h.
- 4 stat cards: Total / Estables / En observacion / Complicados (el contador de Complicados se pone en rojo si > 0).
- 3 filtros: busqueda libre, estado, y filtro por fecha exacta (?fecha=YYYY-MM-DD ? feature nativa del backend).
- Tarjetas con borde de color lateral (verde=estable, azul=observacion, rojo=complicado, gris=cerrado).
- Indicador de urgencia del proximo control: "Vencido" / "Ma?ana" / "en Xd" con colores rojo/amber/teal.
- Zona visual especial para alertas clinicas (fondo ambar) en tarjeta y en formulario.
- Modal CRUD (4 secciones): Paciente y referencias / Fechas / Alertas / Evoluci?n y observaciones.
- Selector de cirug?a (vinculo CU14 ? CU15).
- Aviso contextual en el formulario si estado = COMPLICADO.
- Validacion: fecha_control obligatoria; proximo_control >= fecha_control.
- `Sidebar.tsx` actualizado: NavItem "Postoperatorio" con icono HeartPulse.
- `Header.tsx` actualizado: breadcrumb `/postoperatorio`.

API backend: `GET/POST/PATCH/DELETE /cirugias/` + `POST /cirugias/{id}/reprogramar/`
Permisos backend: lectura para todos los autenticados; escritura y reprogramar solo `IsMedicoOrAdmin`.
Reglas de negocio:
  1. `fecha_programada` y `procedimiento` obligatorios.
  2. `estado=FINALIZADA` ? `fecha_real_inicio` y `fecha_real_fin` obligatorias.
  3. `fecha_real_inicio` <= `fecha_real_fin` (validacion cronologica).
  4. `cirujano` se asigna automaticamente a `request.user` al crear (no es campo editable del formulario).
  5. 
**Fecha:** 2026-05-09 (continuacion: suite backup adaptada y verde)

**Cambio mayor:** se implementó el plan de estabilización de pruebas para `apps.backup` y se dejó la suite del módulo en verde bajo Docker.

**Cambios aplicados:**
- `backend/apps/backup/views.py`
  - orden explícito en `BackupConfigViewSet.get_queryset()` para evitar warning de paginación (`order_by('id_config')`).
- `backend/apps/backup/tests.py`
  - refactor de tests para contexto `django-tenants` sin depender de tablas tenant en schema público de test.
  - regresión agregada para validación de límites con ventana temporal (`timedelta`).
  - regresión agregada para restore con tenant explícito sin FK `backup.tenant`.
  - pruebas de concurrencia migradas a mocks de queryset.

**Validación ejecutada:**
- `docker compose exec backend python manage.py test apps.backup`
- Resultado: **OK (15 tests)**.

**Cobertura nueva agregada:**
- Tests del command `backup_automatico` para verificar uso de `tenant_context` y comportamiento cuando `--tenant-slug` no existe.

**Pendiente inmediato:**
1. Agregar integración tenant-schema real (opcional) con `tenant_context` para uno o dos tests E2E del módulo backup.
2. Continuar con panel frontend de backups.

Detalle de sesión: `docs/ai/sessions/2026-05-09-agent-backup-tests-green.md`

---

## Resumen
**Fecha:** 2026-05-09 (continuacion: hardening + validacion backup/restore)

**Cambio mayor:** se cerraron errores runtime restantes del flujo backup/restore multi-tenant y se validó E2E con tenant demo.

**Fixes aplicados:**
- `backend/apps/backup/validators.py`: import faltante `timedelta` (error 500 al crear backup manual).
- `backend/apps/backup/services.py`: restore ya no depende de `backup.tenant` (modelo schema-local sin FK tenant); ahora recibe tenant explícito.
- `backend/apps/backup/views.py`: `restore()` pasa `tenant=request.tenant` al servicio.

**Validacion ejecutada:**
- Login tenant: `POST /t/clinica-demo/api/auth/login/`
- Plan info: `GET /t/clinica-demo/api/backup/plan-info/`
- Cambio de plan: `POST /t/clinica-demo/api/organization/change-plan/` → `PLUS`
- Backup manual: `POST /t/clinica-demo/api/backup/` ✅
- Restore: `POST /t/clinica-demo/api/backup/{id}/restore/` ✅
- Scheduler forzado: `python manage.py backup_automatico --force --tenant-slug clinica-demo` ✅

**Docs corregidas:**
- `README.md` y `docs/api/backup.md` actualizados a rutas reales `/t/<slug>/api/backup*` y `/t/<slug>/api/backup-config/`.

**Pendiente inmediato:**
1. Agregar/ajustar tests backend para cubrir los dos bugs corregidos (`timedelta` + restore sin `backup.tenant`).
2. Resolver warning de paginación en `backup-config` (queryset sin ordering explícito).
3. Implementar panel frontend para gestión de backups.

Detalle de sesión: `docs/ai/sessions/2026-05-09-agent-backup-smoke-fixes.md`

---

## Resumen
**Fecha:** 2026-05-09 (sistema completo de backup/restore multi-tenant)

**Cambio mayor:** se implemento un sistema completo de backup/restore por tenant con API REST, backups automaticos programables, limites por plan y auditoria completa.

**Archivos creados:**
- `backend/apps/backup/` (app completa con modelos, servicios, vistas, serializers, URLs, admin, tests, management command)
- `docs/api/backup.md` (documentacion completa de la API)

**Archivos modificados:**
- `backend/config/settings.py`: agregado `apps.backup` a TENANT_APPS + settings de backup
- `backend/config/urls.py`: registradas URLs de backup
- `backend/Dockerfile`: agregado `postgresql-client` para pg_dump/psql
- `docker-compose.yml`: agregado servicio `backup-scheduler`
- `README.md`: actualizado con seccion multi-tenant + comandos de backup

**Verificacion:**
- Modelos: `TenantBackup` (metadata) + `TenantBackupConfig` (config automatica)
- Servicio: `BackupService` con `pg_dump --schema` + gzip + storage
- REST API: CRUD + restore + download + config + plan-info
- Management command: `backup_automatico` con `--force` y `--tenant-slug`
- Validadores: limites por plan (FREE=0, PLUS=5/semana, PRO=ilimitado)
- Bitacora: todas las operaciones registradas
- Docker: scheduler corre cada hora

**Pendiente inmediato:**
1. Rebuild Docker backend: `docker compose build backend` (para incluir postgresql-client)
2. Ejecutar migraciones: `docker compose run --rm backend python manage.py migrate`
3. Implementar panel frontend para gestion de backups
4. Actualizar seeders para crear `TenantBackupConfig` por defecto

**Documentacion de referencia:** `docs/api/backup.md`, `README.md` (seccion Backup/Restore)

Detalle: `docs/ai/sessions/2026-05-09-backup-restore-system.md`

---

## Resumen
**Fecha:** 2026-05-09 (migracion completa a django-tenants con schemas)

**Cambio mayor:** el backend migro completamente del enfoque anterior (header `X-Tenant-Slug` + FK nullable + scoping manual) a `django-tenants` con **schema-per-tenant** en PostgreSQL.

**Verificacion completa:**
- `settings.py`: `SHARED_APPS`, `TENANT_APPS`, `TenantSubfolderMiddleware`, `django_tenants.postgresql_backend`, `TenantSyncRouter`, `PUBLIC_SCHEMA_URLCONF`.
- `config/urls.py`: URLs tenant-scoped (`/t/<slug>/api/...`).
- `config/urls_public.py`: URLs publicas (`/api/...`, `/api/public/...`).
- `apps/tenant/models.py`: `Tenant` (TenantMixin), `Domain` (DomainMixin), `SubscriptionPlan`, `TenantSubscription`, `TenantUsage`, `TenantSettings`.
- `apps/tenant/views.py`: `TenantCurrentView`, `TenantSettingsCurrentView`, `TenantChangePlanView`, `PublicTenantLookupView`, `TenantManagementViewSet`.
- `apps/tenant/urls.py`: rutas de organizacion y administracion central.
- `apps/usuarios/users/views.py`: login/register/me incluyen `tenant` en respuesta; JWT refresh con claims de tenant.
- `entrypoint.sh`: bootstrap completo (migrate_schemas --shared, planes, tenant public, tenant demo, migrate_schemas --tenant, seeders, collectstatic).

**Estado de clientes:**
- **Frontend (Next.js):** NO actualizado. Sigue usando `/api/...` sin prefijo de tenant.
- **Mobile (Flutter):** NO actualizado. Sigue usando `/api/...` sin prefijo de tenant.

**Gap critico:** los clientes deben migrar a URLs con prefijo `/t/<slug>/api/...` para funcionar con el nuevo esquema.

**Documentacion de referencia:** `tenant.md` y `backend/tenant.md` describen el enfoque completo con ejemplos de endpoints y flujos.

Detalle: `docs/ai/sessions/2026-05-09-agent-memoria-django-tenants.md`

---

## Resumen
**Fecha:** 2026-05-09 (push turnos: recordatorios automaticos → FCM)

**Verificacion:** la base de push ya estaba implementada en backend+mobile (registro de token FCM, listeners foreground/background, pantalla de notificaciones).

**Faltante detectado y cerrado:** en el procesamiento de recordatorios automaticos (CU17), la tarea solo creaba `Notificacion` en BD y no enviaba push real.

**Cambio aplicado:**
- Archivo: `backend/apps/notificaciones/automatizaciones/serializers.py`
- Metodo: `procesar_tarea_recordatorio(...)`
- Antes: `Notificacion.objects.create(...)`
- Ahora: `enviar_push_a_usuario(...)` con payload (`tipo`, `postoperatorio_id`, `tarea_id`)

**Resultado:**
- Se mantiene historial interno de notificaciones.
- Si Firebase esta configurado y el usuario tiene dispositivos registrados, se envia push FCM real.
- Si Firebase no esta configurado, el flujo no falla (warning + notificacion en BD).

**Pendiente operativo (no de codigo):** para iOS falta `GoogleService-Info.plist` en `mobile/ios/Runner/` si se quiere soporte push en iPhone.

Detalle: `docs/ai/sessions/2026-05-09-agent-push-turnos-fcm.md`

---

## Resumen
**Fecha:** 2026-05-08 (mobile: agendar cita)

**Agendar cita:** se implemento flujo completo para agendar citas desde la app paciente:
- **Backend**: `GET /api/especialistas-disponibles/` (solo lectura, especialistas activos).
- **CitasRepository**: `scheduleAppointment()`, `getAvailableSpecialists()`, `getAppointmentTypes()`.
- **ScheduleAppointmentScreen**: 3 pasos (especialista → fecha/hora → confirmar).
- **Ruta**: `/schedule-appointment` en `routes.dart`.
- **Home**: boton "Agendar cita >" en tarjeta de proxima cita.

**Validacion:** `flutter analyze` sin errores.

Detalle: `docs/ai/sessions/2026-05-08-agent-mobile-schedule-appointment.md`

---

## Resumen
**Fecha:** 2026-05-08 (mobile: recuperacion de contraseña)

**Reset password:** se implemento flujo completo de recuperacion de contraseña en mobile:
- `AuthRepository`: metodos `requestPasswordReset()` y `confirmPasswordReset()`.
- `ForgotPasswordScreen`: solicita email, envia solicitud al backend, muestra exito generico.
- `ResetPasswordScreen`: ingresa token (de Mailhog) + nueva contraseña, confirma reset.
- Rutas `/forgot-password` y `/reset-password` en `routes.dart`.
- Boton en login conectado al flujo.

**Backend:** endpoints ya existian (`POST /auth/reset-password/`, `POST /auth/reset-password/confirm/`). Token expira en 2h. En dev se usa Mailhog.

**Validacion:** `flutter analyze` sin errores.

Detalle: `docs/ai/sessions/2026-05-08-agent-mobile-reset-password.md`

---

## Resumen
**Fecha:** 2026-05-08 (mobile UI/UX UX-05: accesibilidad)

**Accesibilidad (UX-05):** se aplicaron mejoras de accesibilidad en 7 archivos de la app paciente:
- **Semantics labels** en todos los elementos interactivos (avatar, notificaciones, fecha, accesos rapidos, tabs, citas, consultas, estudios, botones).
- **Touch targets minimos 44x44** en `_TabChip`, `_QuickTile` y `FilledButton` usando `ConstrainedBox` y `minimumSize`.
- **Feedback visual** consistente con `InkWell` + `borderRadius`.
- **Labels descriptivos** para lectores de pantalla con contexto completo.

**Validacion:** `flutter analyze` sin errores.

Detalle: `docs/ai/sessions/2026-05-08-agent-mobile-uiux-ux05-accesibilidad.md`

---

## Resumen
**Fecha:** 2026-05-08 (mobile UI/UX iteracion 3: tokenizacion completa)

**Tokenizacion Batch A+B+C:** se reemplazaron valores hardcodeados de spacing/motion por tokens `AppTheme.space*` y `AppTheme.motion*` en toda la app paciente:
- **Batch A:** `patient_home_screen.dart`, `patient_appointments_section.dart`, `patient_next_appointment_card.dart`
- **Batch B:** `patient_clinical_screen.dart`, `login_screen.dart`, `register_screen.dart`
- **Batch C:** `patient_home_header.dart`, `patient_quick_access_row.dart`

**Resultado:** spacing y motion centralizados en `theme.dart`, facil ajuste global, consistencia visual en toda la app.

**Validacion:** `flutter analyze` sin errores (solo info warnings de `prefer_const_constructors`).

Detalle: `docs/ai/sessions/2026-05-08-agent-mobile-uiux-iteracion3.md`

---

## Resumen
**Fecha:** 2026-05-08 (mobile UI/UX iteracion 2)

**Tokens:** se agregaron motion tokens (`motionFast/Normal/Slow`) y spacing scale (`space1`–`space6`) en `config/theme.dart`.

**Shared widgets:** se agrego `AppShimmerCard` para loading de cards hero.

**Refactor:**
- `PatientNextAppointmentCard` usa estados compartidos + `AnimatedSwitcher`.
- `_ProfileTab` envuelto en `AppFadeSlideIn` con `_ProfileCard` mejorado.

**Resultado UX:** consistencia total en estados async (loading/empty/error) en Home, Citas, Historial y Next Appointment. Perfil con entrada animada y jerarquia clara.

**Validacion:** `flutter analyze` sin errores.

Detalle: `docs/ai/sessions/2026-05-08-agent-mobile-uiux-iteracion2.md`

---

## Resumen
**Fecha:** 2026-05-08 (mobile UI/UX iteracion 1)

**Mobile:** se agrego capa UI compartida en `mobile/lib/core/ui/widgets/app_async_states.dart` para estados `loading/empty/error` y animacion `fade+slide`.

**Refactor:**
- `patient_appointments_section.dart` usa componentes compartidos + `AnimatedSwitcher`.
- `patient_clinical_screen.dart` usa mismos patrones UX en tabs de Consultas/Estudios.

**Resultado UX:** feedback consistente, menor duplicacion, microinteracciones suaves, base reusable para siguientes pantallas.

**Validacion:** `flutter analyze` de archivos modificados sin warnings/errores.

Detalle: `docs/ai/sessions/2026-05-08-agent-mobile-uiux-iteracion1.md`

---

## Resumen
**Fecha:** 2026-05-08 (rollback Sleek command + DESING.md)

**Rollback:** se eliminó el comando `/sleek-design` (`.opencode/commands/sleek-design.md`) y sus referencias en `.opencode/README.md` y `docs/ai/PROMPTS_LIBRARY.md`.

**Ajuste de registro:** se removió en `docs/ai/SKILLS_REGISTRY.md` la entrada agregada para `sleek-design-mobile-apps` dentro de tabla de skills workspace.

**Nuevo artefacto:** se creó `docs/ai/DESING.md` para guardar diseño actual del proyecto (foco mobile paciente), principios UX, backlog y convención de evidencia por iteración.

Detalle: `docs/ai/sessions/2026-05-08-agent-desing-md-rollover.md`

---

## Resumen
**Fecha:** 2026-05-08 (workflow Sleek diseno mobile)

**Comando:** se agrego `.opencode/commands/sleek-design.md` para operar Sleek API end-to-end en tareas de UI mobile: proyecto, chat run async, polling, screenshots por `componentId` y export de HTML para implementacion.

**Seguridad:** reglas explicitas para no exponer `SLEEK_API_KEY`, no leer `.env` real, usar solo `https://sleek.design`, `imageUrls` HTTPS y manejo de errores `401/403/404/409` + run-level (`out_of_credits`, `execution_failed`).

**Docs:** se actualizaron `.opencode/README.md`, `docs/ai/PROMPTS_LIBRARY.md`, `docs/ai/SKILLS_REGISTRY.md`, `CURRENT_STATE.md`, `NEXT_STEPS.md` y sesion nueva.

Detalle: `docs/ai/sessions/2026-05-08-agent-sleek-design-workflow.md`

---

## Resumen
**Fecha:** 2026-05-08 (workflows OpenCode: commands, skills, plugin y todo-list)

**Comandos:** se agrego `.opencode/commands/` con `/check-project`, `/commit`, `/update-memory`, `/review-security`, `/validate-stack`, `/puds-status`, `/handoff` y `/todo-start`. `/commit` exige revision de secretos, `.gitignore`, staged/unstaged changes y mensaje antes de commitear.

**Skills:** se agregaron skills locales en `.opencode/skills/`: `project-memory`, `puds-traceability`, `security-review`, `docker-debug`, `clinical-ux-review` y `todo-workflow`.

**Plugin:** se agrego `.opencode/plugins/env-protection.js` para bloquear acceso a `.env` reales y permitir archivos plantilla como `.env.example`.

**Agentes:** los agentes de `.opencode/agents/` ahora recomiendan todo-list para trabajo multi-paso y permiten skills. El `orchestrator` enruta skills segun tipo de tarea.

**Docs:** se actualizaron `.opencode/README.md`, `.opencode/skills/README.md`, `docs/ai/SKILLS_REGISTRY.md`, `docs/ai/PROMPTS_LIBRARY.md`, `CURRENT_STATE.md`, `NEXT_STEPS.md`, `DECISIONS_LOG.md` y esta sesion.

Detalle: `docs/ai/sessions/2026-05-08-agent-opencode-workflows.md`

---

## Resumen
**Fecha:** 2026-05-08 (sistema multi-agente OpenCode local)

**Agentes:** se agrego `.opencode/agents/` con agentes en formato hibrido OpenCode-compatible: `orchestrator`, `backend`, `frontend`, `mobile`, `ui-ux`, `architecture`, `architect-planner`, `code-review`, `qa-testing`, `devops` e `infra`.

**Routing:** `orchestrator` queda como agente `primary`; los especialistas quedan como `subagent`. Clasifica intencion, delega por dominio, divide tareas mixtas y consolida resultados. Ahora enruta tambien mobile, UI/UX y DevOps.

**Skills:** se creo `.opencode/skills/` como ubicacion local OpenCode. No habia skills OpenCode locales alli; adicionalmente existen skills de workspace en `.agents/skills/`: `caveman` y `find-skills`.

**Compatibilidad:** se corrigio la version inicial basada en `.agents/`; OpenCode oficialmente carga agentes desde `.opencode/agents/` y hereda modelo omitiendo `model`.

Detalle: `docs/ai/sessions/2026-05-08-agent-multi-agent-system.md`

---

## Resumen
**Fecha:** 2026-05-05 (Fase 1b multi-tenant segunda ola, parcial)

**Backend:** se reforzó el tenant-aware scoping en citas, consultas, CRM y automatizaciones con FK a `Tenant`, backfill `legacy` y serializers que bloquean tenant/relaciones cruzadas desde el cliente.

**Datos/negocio:** `SegmentacionPaciente` y `ReglaRecordatorio` pasaron a unicidad por tenant; `Consulta`, `Estudio`, `Cita`, `DisponibilidadEspecialista`, `CampanaCRM`, `HistorialContacto`, `TareaRecordatorioProgramada` y `LogEjecucionRecordatorio` ahora guardan tenant explícito.

**Testing:** se agregaron tests de aislamiento cross-tenant para `Citas` y `CRM`; la ejecución local quedó bloqueada por faltantes del entorno Python (`django`/`rest_framework`).

Detalle: `docs/ai/sessions/2026-05-05-agent-multi-tenant-fase1b-oleada2.md`

---

## Resumen
**Fecha:** 2026-05-04 (Fase 1b multi-tenant primera ola)

**Backend:** se agregaron FK nullable a `Tenant` en raíces críticas (`Usuario`, `Paciente`, `HistoriaClinica`, `Bitacora`, `Notificacion`, `DispositivoFcm`, `Especialista`) con backfill a `legacy`.

**Datos/negocio:** nuevas altas se autopoblan con tenant desde contexto runtime; si no hay contexto, caen a `legacy` para no romper auth pública ni flujos legacy.

**Aislamiento mínimo:** `Usuario`, `Paciente`, `HistoriaClinica`, `Bitacora` y `Especialista` ya respetan `request.tenant` en sus listados cuando existe; `Paciente` además tiene test de aislamiento cross-tenant.

**Decisión de prudencia:** no se forzó `NOT NULL` todavía porque el circuito de auth pública no pasa por el middleware de tenant y requería fallback estable.

Detalle: `docs/ai/sessions/2026-05-04-agent-multi-tenant-fase1b-oleada1.md`

## Resumen
**Fecha:** 2026-05-04 (Fase 1a multi-tenant base)

**Backend:** se agrego la base multi-tenant con `apps.tenant`, middleware `X-Tenant-Slug` y contexto utilitario en `apps.core`.

**Datos/negocio:** `Tenant` controla slug unico, nombre, activo y dominio base; `TenantSettings` guarda timezone, idioma, branding minimo y flags.

**Ejecucion segura:** el middleware marca `request.tenant`; si falta el header en endpoints protegidos responde `400`; si el tenant no existe o esta inactivo responde `403`. Las respuestas de error ahora usan `JsonResponse` de Django (no DRF `Response`) y el `ContextVar` se resetea por request. `/api/health/` y `/api/auth/` quedan exentos.

**Bootstrap:** migracion de datos crea el tenant `legacy` con settings por defecto para compatibilidad inicial.

**Testing:** agregados tests minimos del middleware en `backend/apps/core/tests/test_tenant_middleware.py`.

Detalle: `docs/ai/sessions/2026-05-04-agent-multi-tenant-fase1a.md`


---

### U. CU16 - CRM para la comunicacion con pacientes (backend extendido)

**Fecha:** 2026-05-09

El modulo `backend/apps/crm` existia parcialmente. Se extendio el modelo `HistorialContacto`
con los campos requeridos por CU16.

**Archivos modificados:**
- `backend/apps/crm/models.py` - 2 nuevos `TextChoices` (TipoMensaje, EstadoComunicacion) + 5 nuevos campos.
- `backend/apps/crm/serializers.py` - Validacion: estado=RESPONDIDO requiere respuesta_paciente.
- `backend/apps/crm/views.py` - Filtros ampliados (tipo_mensaje, estado_comunicacion); search incluye asunto, mensaje, respuesta.
- `backend/apps/crm/admin.py` - fieldsets completos + list_display/list_filter con campos nuevos.
- `backend/apps/crm/migrations/0003_historialcontacto_cu16_fields.py` - Migracion para aplicar.

**Nuevos campos en `HistorialContacto`:**
```
tipo_mensaje        RECORDATORIO|NOTIFICACION|SEGUIMIENTO|RESULTADO|INFORMATIVO|OTRO  (default: SEGUIMIENTO)
asunto              CharField 200, opcional
mensaje             TextField, opcional  -- contenido del mensaje enviado
respuesta_paciente  TextField, opcional  -- respuesta o interaccion del paciente
estado_comunicacion PENDIENTE|ENVIADO|ENTREGADO|LEIDO|RESPONDIDO|FALLIDO  (default: PENDIENTE)
```

**Para aplicar la migracion:**
```bash
docker compose exec backend python manage.py migrate crm
```

---

### V. CU16 - CRM Comunicaciones (frontend completo)

**Fecha:** 2026-05-09

Nuevos archivos:
- `frontend/src/lib/services/crm.ts` - Interfaces + constantes + `historialContactoService` + `campanaCRMService`.
- `frontend/src/app/(dashboard)/(gestion-crm)/crm/contactos/page.tsx` - Pagina completa CU16.

La pagina `/crm/contactos` incluye:
- Header con boton "Nueva comunicacion".
- 4 stat cards: Total / Pendientes / Respondidas / Fallidas (Fallidas en rojo si > 0).
- 4 filtros: busqueda libre + tipo de mensaje + estado de comunicacion + canal.
- Lista de tarjetas con borde lateral de color segun estado (amarillo=pendiente, azul=enviado, indigo=entregado, morado=leido, verde=respondido, rojo=fallido).
- Cada tarjeta muestra: icono del canal, nombre paciente, badge tipo_mensaje, badge estado (con icono), asunto, preview del mensaje, y bloque verde si hay respuesta_paciente.
- Modal CRUD con 4 secciones:
  1. Paciente y campana (selectors)
  2. Canal, tipo y estado (con aviso si estado=RESPONDIDO sin respuesta)
  3. Contenido del mensaje enviado (asunto + mensaje)
  4. Respuesta e interaccion del paciente (respuesta_paciente con resaltado verde + observaciones)
- Validacion espejo del backend: estado=RESPONDIDO requiere respuesta_paciente (error si vacio).
- Modal de confirmacion de eliminacion.

Archivos modificados:
- `Sidebar.tsx` - Fix import duplicado `ClipboardList`; label "Comunicaciones" con icono `MessageSquare`; orden: Comunicaciones primero, Campanas segundo.
- `Header.tsx` - Breadcrumbs `/crm/contactos`, `/crm/campanas`, `/crm`.
- `lib/services/index.ts` - Exporta `historialContactoService`, `campanaCRMService`, constantes y tipos.

API backend: `GET/POST/PATCH/DELETE /crm-contactos/`
Modulo visible solo si `planInfo.permite_crm && flags.mostrar_modulo_crm`.

---

### W. CU17 - Reportes y exportaciones (backend completo)

**Fecha:** 2026-05-09

Sub-modulo creado dentro del paquete CRM: `backend/apps/crm/reportes/`.
Patron: mismo que los sub-modulos de `atencionClinica` (cirugias, preoperatorio, etc.).

**Archivos creados:**
- `apps.py` ? `ReportesConfig` con `name='apps.crm.reportes'`
- `models.py` ? modelo `ReporteGenerado` (tabla: `crm_reportes_generados`)
- `serializers.py` ? `ReporteGeneradoSerializer` + `GenerarReporteRequestSerializer`
- `views.py` ? `ReportesViewSet` con 7 generadores + exportacion CSV
- `admin.py` ? admin readonly (sin add/change, solo auditoria)
- `urls.py` ? router con `reportes`
- `migrations/0001_initial.py`

**Archivos modificados:**
- `config/settings.py` ? `'apps.crm.reportes'` en `TENANT_APPS`
- `config/urls.py` ? `path('', include('apps.crm.reportes.urls'))`

**Endpoints:**
```
GET  /reportes/tipos/        ? catalogo de 7 tipos disponibles
GET  /reportes/              ? historial de reportes generados (paginado)
POST /reportes/generar/      ? generar reporte (JSON o CSV)
GET  /reportes/{id}/         ? metadatos de un reporte especifico
POST /reportes/{id}/regenerar/ ? re-ejecutar con mismos parametros
```

**Tipos de reporte:**
| Tipo | Modelos consultados |
|------|---------------------|
| RESUMEN_PACIENTES | Paciente |
| CITAS | Cita |
| CONSULTAS | Consulta |
| MEDICIONES_VISUALES | MedicionVisual |
| CIRUGIAS | Cirugia |
| POSTOPERATORIO | Postoperatorio |
| CRM_COMUNICACIONES | HistorialContacto |

**Request de ejemplo:**
```json
POST /reportes/generar/
{
  "tipo_reporte": "CIRUGIAS",
  "formato": "CSV",
  "fecha_desde": "2026-01-01",
  "fecha_hasta": "2026-05-09"
}
```

**Para aplicar la migracion:**
```bash
docker compose exec backend python manage.py migrate crm_reportes
```

**Proximos pasos:**
1. Frontend CU17: pagina `/reportes` con selector de tipo, rango de fechas, preview de datos y boton "Exportar CSV".
2. Mobile (Flutter): implementar `WorkspaceScreen` + `TenantInterceptor` de Dio.
   Guia completa en `docs/ai/sessions/2026-05-09-agent-multi-tenant-frontend.md` Seccion 5.
3. Validar limite `max_almacenamiento_mb` en subida de archivos (mediciones).
4. Flujo de recuperacion de contrasena adaptado al tenant.
5. Agregar campos anidados (nombre_completo paciente) en serializers de evaluacion_quirurgica,
   preoperatorio, cirugia y postoperatorio.

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

**Backend:** se reforz? el tenant-aware scoping en citas, consultas, CRM y automatizaciones con FK a `Tenant`, backfill `legacy` y serializers que bloquean tenant/relaciones cruzadas desde el cliente.

Detalle: `docs/ai/sessions/2026-05-05-agent-multi-tenant-fase1b-oleada2.md`

---

## Resumen
**Fecha:** 2026-05-04 (Fase 1b multi-tenant primera ola)

**Backend:** se agregaron FK nullable a `Tenant` en ra?ces cr?ticas (`Usuario`, `Paciente`, `HistoriaClinica`, `Bitacora`, `Notificacion`, `DispositivoFcm`, `Especialista`) con backfill a `legacy`.

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
