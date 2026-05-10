# NEXT STEPS

Lista priorizada para Oftalmologia Si2 (actualizada tras migracion a django-tenants).

## Corto Plazo
- [ ] **CU21/CU22 Reportes QBE**: poblar `_QBE_MODEL_REGISTRY` / `_QBE_MODEL_IMPORT_PATH` desde apps de dominio (sin acoplar reglas en `reportes`); ampliar `QBEQueryBuilder` (`Q` anidados, agregaciones por campo); tests del motor y del endpoint `execute`.
- [x] Migracion completa a django-tenants con schema-per-tenant (backend).
- [x] Sistema completo de backup/restore multi-tenant (modelos, API, servicio, scheduler, documentacion, tests).
- [ ] **URGENTE: Frontend Next.js con URLs de tenant** — adaptar axios client para usar `/t/<tenantSlug>/api/...`, crear flujo de seleccion de clinica, consumir `GET /api/public/tenants/<slug>/` (lookup público) y `GET /t/<slug>/api/auth/tenant/` antes del login. *(2026-05-09: lookup en login ya apunta a `/api/public/tenants/<slug>/`.)*
- [ ] **URGENTE: Mobile Flutter con URLs de tenant** — adaptar Dio client para usar `/t/<tenantSlug>/api/...`, crear flujo de seleccion de clinica, consumir endpoints de tenant antes del login.
- [x] OpenCode workflows: crear comandos reutilizables (`/check-project`, `/commit`, `/update-memory`, `/review-security`, `/validate-stack`, `/puds-status`, `/handoff`, `/todo-start`).
- [x] OpenCode workflows: crear comandos reutilizables (`/check-project`, `/commit`, `/update-memory`, `/review-security`, `/validate-stack`, `/puds-status`, `/handoff`, `/todo-start`).
- [x] Artefacto de diseno vivo: crear `docs/ai/DESING.md` para registrar decisiones UI/UX y backlog mobile paciente.
- [x] OpenCode skills locales: agregar `project-memory`, `puds-traceability`, `security-review`, `docker-debug`, `clinical-ux-review` y `todo-workflow`.
- [x] OpenCode plugin inicial: agregar `env-protection` para bloquear acceso a `.env` reales y permitir plantillas.
- [x] Sistema multi-agente OpenCode local: crear `.opencode/agents/` con `orchestrator`, especialistas por dominio, formato hibrido compatible y README operativo.
- [x] Sistema multi-agente OpenCode local: agregar subagentes `mobile`, `ui-ux` y `devops`; actualizar routing del `orchestrator`; registrar `find-skills` instalado.
- [x] Fase 1a multi-tenant base: app `tenant`, middleware `X-Tenant-Slug`, `request.tenant`, bootstrap `legacy`, tests minimos.
- [x] Fase 1a multi-tenant hardening: errores del middleware con `JsonResponse` + limpieza de `ContextVar` + tests de bypass/aislamiento.
- [x] Fase 1b multi-tenant primera ola: FK nullable en raíces críticas + backfill `legacy` + scoping mínimo por tenant + test de aislamiento Paciente.
- [x] Fase 1b multi-tenant segunda ola: scoping fuerte en `citas`, `consultas`, `crm` y `automatizaciones` + validaciones cross-tenant + managers/querysets más consistentes.
- [x] **Fase 2: migracion completa a django-tenants con schema-per-tenant** — SHARED_APPS/TENANT_APPS, TenantSubfolderMiddleware, urls_public, modelos Tenant/Domain/SubscriptionPlan/TenantSettings, entrypoint con migrate_schemas, bootstrap de planes + tenant public + tenant demo, endpoints de organizacion, auth con tenant info en respuesta y JWT claims.
- [x] CU12 Backend: modulo `evaluacion_quirurgica` (CRUD + validaciones + permisos + bitacora + tests minimos).
- [x] CU13 Backend: modulo `preoperatorio` (CRUD + estado/checklist/examenes + validaciones + permisos + bitacora + tests minimos).
- [x] CU14 Backend: modulo `cirugias` (CRUD + reprogramacion + estado/fechas/cirujano/resultado/complicaciones + validaciones + permisos + bitacora + tests minimos).
- [x] CU15 Backend: modulo `postoperatorio` (CRUD + filtros paciente/cirugia/fecha/estado + validaciones + permisos + bitacora + tests minimos).
- [x] CU16 Backend: CRM pacientes (segmentacion + campanas + historial de contacto + CRUD + permisos + bitacora + tests minimos).
- [x] CU17 Backend: recordatorios automaticos (management command + cron).
- [x] Backend: CustomUser + JWT (ya existía; login refinado a email + `check_password`).
- [x] Mobile: Login real + home paciente con `GET /citas/` + tema/rutas base.
- [x] Frontend: Login con `email` alineado a API.
- [x] Mobile: Pestaña **Citas** con listado real Próximas/Historial; **Historial clínico** (consultas + estudios) desde accesos rápidos.
- [ ] Mobile: **Perfil** enriquecido (edición de datos, foto, etc.) si se define alcance.
- [ ] Mobile: **Registro** contra `POST /api/auth/register/`.
- [x] Mobile: **Recuperacion de contraseña** (forgot + reset con token de Mailhog).
- [x] Mobile: **Agendar cita** desde la app (3 pasos: especialista → fecha/hora → confirmar).
- [ ] Mobile: **Detalle de cita** (ver info completa de una cita existente).
- [ ] Mobile UI/UX: ejecutar primer ciclo interno (sin API externa) sobre Home paciente, Citas e Historial usando `docs/ai/DESING.md` como fuente de diseno.
- [x] Mobile UI/UX (iteracion 1): unificar estados loading/empty/error y microanimaciones base en Citas + Historial con componentes reutilizables.
- [x] Mobile UI/UX (iteracion 2): aplicar mismos componentes/animaciones en `PatientNextAppointmentCard` y `Profile` para cerrar consistencia de Home.
- [x] Mobile UI/UX (iteracion 2): agregar tokens de motion/spacing en `config/theme.dart`.
- [x] Mobile UI/UX (iteracion 3): tokenizar Batch A (Home screens) con `AppTheme.space*` y `AppTheme.motion*`.
- [x] Mobile UI/UX (iteracion 3): tokenizar Batch B (Historial + Auth) con `AppTheme.space*` y `AppTheme.motion*`.
- [x] Mobile UI/UX (iteracion 3): tokenizar Batch C (Header + Accesos) con `AppTheme.space*` y `AppTheme.motion*`.
- [x] Mobile UI/UX (UX-05): accesibilidad tactil/contraste/semantics en toda la app paciente.

## Mediano Plazo
- [x] Modelos y API Pacientes/Citas (backend Sprint 1).
- [ ] Web Admin: tablas y flujos sobre pacientes, citas, disponibilidades (con URLs de tenant).
- [ ] Mobile: vista **médico** / staff (si aplica mismo app o build flavor).
- [ ] Frontend: pantalla de seleccion de clinica + branding dinamico por tenant.
- [ ] Mobile: pantalla de seleccion de clinica + branding dinamico por tenant.
- [ ] Validar flujo completo end-to-end con Docker: crear tenant nuevo → seed → login → operaciones.

## Largo Plazo
- [ ] Web: historias clínicas completas, adjuntos/imágenes.
- [x] Mobile: notificaciones (FCM) para turnos.
- [ ] Despliegue: Nginx, HTTPS, `DEBUG=False`, hosts y CORS explícitos.

## Pendientes Técnicos
- [x] Definir e instalar skills locales en `.opencode/skills/` para flujos repetibles de memoria, PUDS, seguridad, Docker, UX clinica y todo-list.
- [ ] Evaluar plugins adicionales solo si aportan valor real: recordatorio de memoria, checklist PUDS, validacion de limites de arquitectura o runner de validaciones.
- [x] Guía despliegue VM Ubuntu / Azure + onboarding en `docs/README.md` (`docs/guides/despliegue-ubuntu-nube.md`).
- [ ] Export CSV (o similar) en pantalla Bitácora — botón preparado como placeholder.
- [ ] Doc único de convenciones TS / Dart / Python.
- [ ] Storage compartido para imágenes clínicas (S3 / similar).
- [ ] Tests automatizados en flujos auth + citas (backend + widget mobile crítico).
- [ ] Infra: programar cron real para `manage.py procesar_recordatorios` en entorno Docker/VM y monitorear logs.
- [ ] Mobile iOS push: agregar `GoogleService-Info.plist` en `mobile/ios/Runner/` y validar permisos/canales en dispositivo real.
- [ ] Multi-tenant: crear tests de aislamiento cross-schema para verificar que datos de un tenant no son accesibles desde otro.
- [ ] Multi-tenant: documentar procedimiento para crear nuevo tenant en produccion (comando o endpoint + seeders).
- [ ] Multi-tenant: validar que seeders se ejecutan correctamente en schema del tenant y no en `public`.
- [ ] Backup: rebuild Docker backend para incluir `postgresql-client` (pg_dump/psql).
- [ ] Backup: ejecutar migraciones en Docker tras rebuild.
- [x] Backup: validar smoke E2E en tenant demo (`backup-config`, `change-plan`, `create backup`, `restore`, `backup_automatico --force`).
- [x] Backup: agregar pruebas automatizadas para casos de regresion corregidos (`timedelta` en validadores y restore sin FK tenant).
- [x] Backup: estabilizar suite `apps.backup` para entorno `django-tenants` y dejar `python manage.py test apps.backup` en verde.
- [x] Backup: cubrir scheduler con tests de `tenant_context` (`backup_automatico`: tenant activo y tenant_slug inexistente).
- [ ] Backup: actualizar seeders para crear `TenantBackupConfig` por defecto en cada tenant nuevo.
- [ ] Backup: implementar panel frontend para gestion de backups (lista, crear, restaurar, descargar, configurar automatico).
- [ ] Backup: validar limites por plan en seed (agregar campos backup a SubscriptionPlan o usar settings).
- [ ] Backup: agregar notificacion push/email tras backup automatico exitoso o fallido.
