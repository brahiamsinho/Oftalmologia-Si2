# NEXT STEPS

Lista priorizada para Oftalmologia Si2 (actualizada tras migracion a django-tenants).

**Contexto SaaS:** ver **`docs/ai/PLATFORM_SAAS.md`** antes de cambiar auth, tenants o rutas públicas.

## Corto Plazo

- [x] **EA UML 2.5 Secuencia CU18/CU21/CU22:** crear paquete `/Model/2.6 Diagramas de Secuencia` y diagramas SD-CU18, SD-CU21, SD-CU22 basados en codigo real backend/frontend.
- [x] **OpenCode MCP draw.io:** agregar servidor `drawio` en `opencode.jsonc` con `npx -y @drawio/mcp` y mantener `enterprise-architect`.
- [x] **OpenCode multi-agente (orchestrator + especialistas):** normalizar `.opencode/agents/` con routing formal, `permission.task`, subagentes `reviewer/security/docs-memory/puds/ai-inference/ai-researcher/diagrams-modeling` y skill `uml-c4-puds-diagrams`.
- [x] **Mobile asistente virtual (CU23 chatbot):** `/asistente-virtual` + `POST ia/chatbot/`; staff only; tenant Dio/JWT.
- [x] **Mobile reportes IA (CU23 QBE):** tab Reportes en staff (`features/reportes/`, voz + export).
- [x] Integrar pasarela Stripe para upgrades de plan (checkout + confirmación + webhook opcional).
- [x] Agregar seed histórico mínimo de 6 meses para mejorar reportes y pruebas IA/QBE.
- [x] Exigir y crear administrador inicial al crear clínica desde SaaS (`/platform/dashboard` + `TenantCreateSerializer`).
- [x] Corregir `next/image` en landing (`images.unsplash.com`) para eliminar `GET / 500` en frontend local.
- [x] Evitar tracebacks tempranos del `backup-scheduler` cuando el bootstrap de tablas aún no termina.
- [x] Limpiar `/.env` para desarrollo local y retirar datos/secrets de produccion incrustados.
- [x] Fijar rutas canonicas del monorepo en `.cursor/agents/orchestrator.md` (backend/frontend/mobile/docs) para delegacion estable.
- [ ] Revisar uso real de cada subagente en `.cursor/agents/` durante 1 sprint y ajustar prompts de rol segun fricciones observadas.
- [ ] Definir si `infra` se mantiene por compatibilidad o se consolida en `devops` para reducir solapamiento.
- [x] **Migrar OpenCode a Cursor (subagentes por rules):** crear `.cursor/rules/agent-*.mdc` + indice `.cursor/rules/README.md` y puntero `.cursor/agents/README.md`.
- [x] **Ajustar a doc oficial Cursor:** subagentes reales en `.cursor/agents/*.md` + rules ligeras (`00-core-policy`, `10-routing-hints`) y limpieza de duplicacion `agent-*.mdc`.
- [ ] Afinar textos operativos de cada subagente en `.cursor/agents/*.md` segun evolucion real de backend/frontend/mobile y nuevos workflows.
- [ ] Evaluar si conviene agregar rules equivalentes para workflows tipo comando (`check-project`, `update-memory`, `puds-status`) como shortcuts de equipo en Cursor.
- [x] **Superadmin web:** `/platform/dashboard` — crear clínica (modal), activar, suspender, cambiar plan (modales + confirmación downgrade); **shell** sidebar + header como el dashboard clínica (`dashboard/layout.tsx`, `PlatformSidebar`, `PlatformHeader`). Detalle en `docs/ai/PLATFORM_SAAS.md` §7.
- [x] **Platform admin planes:** CRUD de planes desde `/platform/dashboard` conectado a `/api/public/platform/plans/` con auth de plataforma.
- [x] **CU21/CU22 web (parcial 2026-05-23):** predefinidos (CU21), personalizados/guardar (CU22), export Excel, `run/`. Ver `PACKAGE_CU_MAP.md`. **Pendiente:** E2E, tests, whitelist QBE.
- [ ] **CU21 motor QBE:** poblar `_QBE_MODEL_REGISTRY`; tests `execute`.
- [x] Migracion completa a django-tenants con schema-per-tenant (backend).
- [x] Sistema completo de backup/restore multi-tenant (modelos, API, servicio, scheduler, documentacion, tests).
- [ ] **URGENTE: Frontend Next.js con URLs de tenant** — **Hecho (2026-05-10):** `lib/api.ts` reescribe `baseURL` a `resolveTenantBaseUrl(slug)` cuando hay `tenant_slug`; refresh usa el mismo prefijo. **Pendiente UX:** pantalla dedicada de selección de clínica / branding si se quiere además del paso 1 del login actual; consumo explícito de `GET /t/<slug>/api/auth/tenant/` donde falte.
- [ ] **URGENTE: Mobile Flutter con URLs de tenant** — adaptar Dio client para usar `/t/<tenantSlug>/api/...`, crear flujo de seleccion de clinica, consumir endpoints de tenant antes del login.
- [x] Mobile Android Firebase: alinear `google-services.json` con `applicationId` actual para desbloquear `:app:processDebugGoogleServices`.
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
- [x] **CU17 Backend:** recordatorios (`automatizaciones`). **Pendiente:** cron compose, UI, tests tenant.
- [x] **CU18 Backend + web:** `apps.administracionFinanciera.seguros`, `/seguros`. Paneles en paciente (modal).
- [x] Seguros UX: reemplazar verificación por ID manual con selector/autocomplete de paciente en Verificar cobertura y Afiliaciones.
- [x] Seguros backend: hotfix `date vs datetime` en serializers (create convenio/afiliación sin 500).
- [x] Seguros frontend: errores API legibles (`detail` / `non_field_errors`) en vez de mensaje genérico de Axios.
- [x] **CU19 Backend:** `apps.administracionFinanciera.descuentos`. **Pendiente:** UI `/descuentos`, notificación asignación, tests.
- [x] **CU20 Backend (cerrado):** facturación, pasarela mock, PDF, notificaciones, API paciente/cita.
- [ ] **CU20:** UI `/facturacion`, pasarela real producción, mobile pagos.
- [x] Predicciones plataforma: agregar explicación funcional ("qué predice" + "qué significa probabilidad") y acción sugerida por riesgo.
- [x] **CU24 Backend:** clasificación de urgencia del chatbot en endpoint separado `POST /t/<slug>/api/ia/urgency-classification/`, reglas determinísticas, persistencia tenant-aware y bitácora sin mensaje clínico completo.
- [x] **CU24 Backend code review:** tests usan ruta tenant canonical, aislamiento básico por schema, spoofing tolera formato DRF, matcher evita `cal` dentro de `calor`, admin readonly y mapa PUDS corregido.
- [x] **CU24 Backend:** ejecutar `manage.py check`, `pytest apps/ia/tests` y contraste de migración en Docker/venv con Django instalado.
- [ ] **CU24 Backend:** aplicar migración en schemas tenant con `migrate_schemas --tenant` cuando se valide el entorno.
- [ ] **CU25:** implementar derivación humana real a partir de `ChatbotUrgencyClassification.estado_derivacion=PENDIENTE` para casos críticos; no está hecho todavía.
- [ ] Predicciones plataforma: agregar tooltips por feature clave (`pct_canceladas`, `tasa_asistencia`, `total_ingresos`) para interpretación guiada.
- [ ] **Referencia:** mapa paquetes → `docs/ai/PACKAGE_CU_MAP.md`.
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
- [x] Mobile: pantalla de seleccion de clinica (slug) + enrutamiento multi-tenant runtime.
- [ ] Mobile: enriquecer pantalla de selección de clínica con branding completo (logo/color) y “clínicas recientes”.
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
- [x] Multi-tenant: crear tests de aislamiento cross-schema para verificar que datos de un tenant no son accesibles desde otro.
- [ ] Multi-tenant: extender pruebas anti-cruce al plano HTTP tenant (`/t/<slug>/api/...`) en entorno de test, ajustando configuración de URL/middleware para evitar `404` en pytest.
- [ ] Seguros/Descuentos: ejecutar smoke E2E en Docker (`POST/GET` convenios, afiliaciones, promociones y beneficios) para confirmar fix `date vs datetime` en entorno de contenedores.
- [ ] Seguros: agregar tests automatizados de regresión para serialización `DateField` en convenios/afiliaciones.
- [ ] IA asistente virtual: validar en QA conversacional 10 prompts clínico-operativos (agenda, seguros, reportes, urgencias) para confirmar tono/seguridad y evitar respuestas ambiguas.
- [ ] PWA: validar instalación en Chrome/Edge (desktop) y flujo manual en iOS (Agregar a inicio).
- [ ] PWA producción: servir frontend con HTTPS para criterios completos de instalabilidad.
- [ ] Multi-tenant: documentar procedimiento para crear nuevo tenant en produccion (comando o endpoint + seeders).
- [x] Multi-tenant: escenario demo con múltiples clínicas (2 FREE, 2 PLUS, 1 PRO) y dataset histórico por tenant.
- [ ] Multi-tenant: exponer selector de clínica en frontend web igual que mobile (slug -> login) para operar la flota demo sin cambiar URLs manualmente.
- [ ] Multi-tenant: validar que seeders se ejecutan correctamente en schema del tenant y no en `public`.
- [ ] Facturación: cambiar selector de paciente a autocomplete virtualizado (componente reutilizable) para escalar cuando haya >500 fichas.
- [ ] Mobile push: forzar registro de token FCM (post-login y al abrir app) con trazas de diagnóstico en dispositivo real para evitar `Sin FCM token`.
- [ ] Mobile push: reemplazar `mobile/android/app/google-services.json` placeholder por archivo real del mismo proyecto Firebase que usa `backend/firebase-credentials.json`.
- [x] Facturación mobile demo: agregar flujo "Simular pago" dentro de app para evitar pantalla técnica DRF y confirmar cobro mock desde factura.
- [x] Pasarela CU20 producción (fase 1): iniciar pago en línea con Stripe Checkout real para facturación clínica, manteniendo fallback mock.
- [ ] Pasarela CU20 producción (fase 2): webhook/confirmación automática post-checkout para reflejo inmediato en mobile sin refresco manual.
- [x] Facturación: definir regla de negocio final para emisión (`solo pacientes con cuenta app` vs `todas las fichas clínicas`) y documentarla en UX.
- [x] Reportes: corregir ejecución de predefinidos agregando endpoint `POST /reportes-qbe/plantillas/<id>/run/` y alinear contrato `{qbe, report}`.
- [x] UX copy: quitar referencias visibles `CUxx` de la UI en módulos operativos.
- [ ] Backup: rebuild Docker backend para incluir `postgresql-client` (pg_dump/psql).
- [ ] Backup: ejecutar migraciones en Docker tras rebuild.
- [x] Backup: validar smoke E2E en tenant demo (`backup-config`, `change-plan`, `create backup`, `restore`, `backup_automatico --force`).
- [x] Backup: agregar pruebas automatizadas para casos de regresion corregidos (`timedelta` en validadores y restore sin FK tenant).
- [x] Backup: estabilizar suite `apps.backup` para entorno `django-tenants` y dejar `python manage.py test apps.backup` en verde.
- [x] Backup: cubrir scheduler con tests de `tenant_context` (`backup_automatico`: tenant activo y tenant_slug inexistente).
- [x] Backup: corregir scheduler ante `hora_backup` en formato string (normalización `time|HH:MM|HH:MM:SS`, fallback seguro y tests de regresión).
- [x] SaaS: centralizar credenciales demo en `docs/ai/DEMO_CREDENTIALS.md` y dejar `platform_admin` como creación seed-only (sin dependencia de `.env`).
- [ ] Backup: actualizar seeders para crear `TenantBackupConfig` por defecto en cada tenant nuevo.
- [ ] Backup: implementar panel frontend para gestion de backups (lista, crear, restaurar, descargar, configurar automatico).
- [ ] Backup: validar limites por plan en seed (agregar campos backup a SubscriptionPlan o usar settings).
- [ ] Backup: agregar notificacion push/email tras backup automatico exitoso o fallido.
