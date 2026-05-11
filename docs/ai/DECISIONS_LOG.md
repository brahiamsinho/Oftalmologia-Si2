# DECISIONS LOG

Este archivo documenta todas las decisiones técnicas arquitectónicas importantes tomadas en la evolución del proyecto.

## Formato de Registro

- **Fecha:** YYYY-MM-DD
- **Decisión:** Resumen de la decisión técnica.
- **Motivo:** ¿Por qué se tomó y qué alternativas se consideraron?
- **Impacto:** ¿Qué consecuencias operativas o de código implica?

---

**Fecha:** 2026-05-10  
**Decisión:** Identidad de **superadmin SaaS** separada de `Usuario` de clínica: modelo **`PlatformAdministrator`** en app shared `apps.platform_admin` (tabla `platform_administrator` en schema `public`). JWT de plataforma con claim `token_scope=platform` (`PlatformAccessToken`); autenticación DRF por defecto **`TenantScopedJWTAuthentication`** rechaza tokens plataforma en APIs `/t/<slug>/`. **`TenantManagementViewSet`** usa **`PlatformJWTAuthentication`** + **`IsPlatformAdministrator`**. Sin refresh JWT plataforma en MVP (sesión larga vía `PLATFORM_JWT_ACCESS_MINUTES`); bootstrap con `ensure_platform_admin` + variables `PLATFORM_ADMIN_*` en entrypoint.  
**Motivo:** Los usuarios clínicos viven solo en schemas tenant; `IsAdminUser` sobre `Usuario` no existe en `public`. Evitar mezclar tokens y evitar que un Bearer de plataforma acceda a datos clínicos por error.  
**Impacto:** Nuevas rutas `/api/public/platform/auth/*`; frontend `platformApi.ts` y rutas `/platform/*`; documentación en `docs/ai/PLATFORM_SAAS.md`.

---

**Fecha:** 2026-05-09
**Decisión:** Endpoint `POST .../ia/nlp-to-report/` requiere usuario autenticado (`IsAuthenticated`). `GEMINI_MODEL` configurable por entorno (default `gemini-2.5-flash`). `QBEEngine.execute` normaliza `filters` y `order_by` con las mismas funciones estrictas que el builder QBE.
**Motivo:** Evitar consumo de cuota Gemini y lectura de datos por anónimos; alinear modelo LLM con despliegue; cerrar brecha donde `execute` aceptaba claves de filtro menos restrictivas que `validate_qbe_payload`.
**Impacto:** Clientes deben enviar JWT en tenant scope; pruebas manuales del endpoint IA desde curl necesitan `Authorization: Bearer`.

---

**Fecha:** 2026-05-09
**Decisión:** Módulo `apps.reportes` para CU21/CU22 con motor QBE (`qbe_engine`) que solo traduce JSON validado al ORM; prohibido SQL crudo desde cliente o IA.
**Motivo:** Aislamiento de seguridad y extensión futura vía whitelist de modelos y lookups permitidos, sin acoplar reglas de negocio de otras apps en el esqueleto.
**Impacto:** Nuevo CRUD `ReportTemplate` + `POST .../reportes-qbe/plantillas/execute/` (prefijo `reportes-qbe` para no colisionar con CU17 en `/api/reportes/`); migración y registro en `TENANT_APPS`.

---

**Fecha:** 2026-05-09
**Decision:** En restore de backups schema-local, el tenant objetivo se pasa explícitamente desde `request.tenant` al servicio en lugar de inferirlo desde `backup.tenant`.
**Motivo:** `TenantBackup` y `TenantBackupConfig` viven en `TENANT_APPS` y no tienen FK `tenant`; asumir `backup.tenant` causa error en runtime bajo `django-tenants`.
**Impacto:** `BackupService.restore_backup(...)` acepta `tenant` y valida `schema_name` antes de ejecutar `DROP/CREATE SCHEMA`; se alinea el servicio con aislamiento por schema y se evita dependencia inválida de modelo.

---

**Fecha:** 2026-05-09
**Decision:** Sistema de backup/restore implementado como app Django propia (`apps.backup`) en lugar de usar librerias externas como `django-dbbackup` o contenedores como `prodrigestivill/postgres-backup-local`.
**Motivo:** Las herramientas existentes no soportan multi-tenant schema-level con API REST, limites por plan, bitacora de auditoria, confirmacion explicita de restore, ni scheduling programable por tenant.
**Impacto:** Se tiene control total sobre el flujo de backup/restore, validaciones de seguridad, limites por plan, y trazabilidad completa. Requiere mantener el codigo propio pero se integra nativamente con django-tenants y DRF.

---

**Fecha:** 2026-05-09
**Decision:** Modelos `TenantBackup` y `TenantBackupConfig` viven en `TENANT_APPS` (schema por clinica) en lugar de `SHARED_APPS` (schema public).
**Motivo:** Cada tenant debe tener sus propios registros de backup y configuracion aislados. Django-tenants maneja el aislamiento via schemas, no se necesita FK a Tenant.
**Impacto:** Las tablas se crean en cada schema de tenant. El management command `backup_automatico` usa `tenant_context` para iterar schemas. No hay FK a Tenant en los modelos.

---

**Fecha:** 2026-05-09
**Decision:** Restore de backup requiere confirmacion explicita (`{"confirmar": true}`) + motivo (recomendado para auditoria).
**Motivo:** El restore es una operacion destructiva (DROP SCHEMA CASCADE). Se requiere trazabilidad completa y prevencion de ejecucion accidental.
**Impacto:** El frontend debe mostrar modal de confirmacion con checkbox y campo de motivo antes de ejecutar restore. La bitacora registra el motivo.

---

**Fecha:** 2026-05-09
**Decision:** Backups automaticos se ejecutan via Docker Compose servicio `backup-scheduler` que corre `python manage.py backup_automatico` cada hora, en lugar de Celery o cron del host.
**Motivo:** Mantener simplicidad operativa sin introducir Celery todavia. El scheduler es un contenedor mas con las mismas variables de entorno y acceso a PostgreSQL.
**Impacto:** Se puede migrar a Celery en el futuro si el volumen lo justifica. Por ahora, el scheduler ejecuta cada hora y filtra tenants por hora configurada.

---

**Fecha:** 2026-05-09
**Decision:** Se agrego `postgresql-client` al Dockerfile del backend para disponer de `pg_dump` y `psql` en el contenedor runtime.
**Motivo:** El servicio de backup usa `pg_dump` y `psql` nativos de PostgreSQL para backups eficientes a nivel schema.
**Impacto:** La imagen del backend aumenta ligeramente de tamaño (~50MB). Requiere rebuild de la imagen tras el cambio.

---

**Fecha:** 2026-05-08
**Decision:** Se agrega `/commit` como comando OpenCode seguro y no como alias directo de `git commit`.
**Motivo:** Un commit automatico sin revision puede subir secretos, `.env`, claves privadas, archivos generados o cambios ajenos. El comando debe revisar `git status`, diffs, `.gitignore`, patrones sensibles y staged changes antes de commitear.
**Impacto:** Para usarlo se invoca `/commit "mensaje"`. El agente debe abortar si detecta credenciales, `.env` reales, claves, cambios no relacionados o un mensaje que no refleje el diff.

---

**Fecha:** 2026-05-08
**Decision:** Se agregan workflows OpenCode reutilizables mediante comandos, skills locales, un plugin de proteccion `.env` y una regla explicita de uso de todo-list para tareas multi-paso.
**Motivo:** Reducir prompts repetidos, mejorar continuidad entre agentes, proteger secretos, mantener `docs/ai/` vivo y ordenar trabajos complejos con seguimiento visible.
**Impacto:** OpenCode ahora carga comandos desde `.opencode/commands/`, skills desde `.opencode/skills/` y plugins desde `.opencode/plugins/`. Los agentes pueden usar skills y deben usar todo-list en tareas con varias etapas, validacion o actualizacion de memoria.

---

**Fecha:** 2026-05-08
**Decision:** Se amplian los subagentes OpenCode con `mobile`, `ui-ux` y `devops`, manteniendo `infra` por compatibilidad operativa.
**Motivo:** El proyecto real tiene Flutter mobile, necesita revision dedicada de experiencia de usuario y requiere soporte DevOps explicito para Docker Compose, entornos, despliegue, cron y hardening.
**Impacto:** `orchestrator` puede delegar ahora tareas mobile, UI/UX y DevOps. `infra` queda disponible para referencias previas, pero las tareas nuevas de contenedores/despliegue deben preferir `devops`.

---

**Fecha:** 2026-05-08
**Decision:** Se adopta un sistema multi-agente OpenCode local en `.opencode/agents/` con formato hibrido compatible: frontmatter soportado por OpenCode y cuerpo tecnico operativo.
**Motivo:** La documentacion oficial de OpenCode indica que los agentes de proyecto se cargan desde `.opencode/agents/`; el nombre del agente viene del nombre del archivo y los subagentes heredan modelo si se omite `model`.
**Impacto:** Nuevos agentes deben mantener nombres en kebab-case, `description`, `mode`, `permission` y reglas especificas del stack real en el cuerpo. Las skills locales deben vivir en `.opencode/skills/` y el `orchestrator` debe invocarlas cuando correspondan.

---

**Fecha:** 2026-05-05
**Decisión:** La segunda ola de Fase 1b extiende el tenant-aware scoping a citas, consultas, CRM y automatizaciones con `tenant` nullable, backfill a `legacy` y serializers que bloquean FK cruzadas o tenant escrito por cliente.
**Motivo:** El aislamiento mínimo por listados no era suficiente para evitar lecturas/escrituras cruzadas en dominios dependientes.
**Impacto:** Se agregan migraciones nuevas y validaciones en `create/update`; las URLs existentes bajo `/api/` no cambian.

---

**Fecha:** 2026-05-05
**Decisión:** `SegmentacionPaciente` y `ReglaRecordatorio` pasan a unicidad por tenant en lugar de unicidad global.
**Motivo:** Un nombre de segmentación o regla debe poder repetirse entre tenants sin colisión global.
**Impacto:** Se agrega constraint compuesto `(tenant, nombre)` y el backend debe seguir pasando tenant explícito o vía contexto.

---

**Fecha:** 2026-05-05
**Decisión:** El queryset base de tenants ganó `for_current_tenant()` y `for_legacy()` además de `for_tenant()`.
**Motivo:** Evitar duplicar lógica de scoping y dar una salida segura para scripts/admin/seed.
**Impacto:** Los repositorios/servicios futuros pueden usar el helper sin reimplementar la resolución del contexto.

---

**Fecha:** 2026-05-04
**Decisión:** En la primera ola de Fase 1b se tenantizaron raíces críticas con `tenant` nullable + backfill a `legacy`, y el alta server-side asigna tenant desde contexto runtime o fallback legacy; por ahora no se fuerza `NOT NULL`.
**Motivo:** Evitar un corte grande sobre auth pública y creaciones existentes mientras se introduce aislamiento por tenant sin romper login ni endpoints actuales.
**Impacto:** `Usuario`, `Paciente`, `HistoriaClinica`, `Bitacora`, `Notificacion`, `DispositivoFcm` y `Especialista` quedan preparadas para scoping; el endurecimiento a `null=False` queda para una oleada posterior cuando el recorrido de creación esté cubierto de punta a punta.

---

**Fecha:** 2026-05-04
**Decisión:** El middleware multi-tenant ya no devuelve `rest_framework.response.Response`; los errores se emiten con `JsonResponse` de Django y el `ContextVar` del tenant se limpia al inicio/final de cada request.
**Motivo:** Evitar fragilidad de renderizado/runtime por mezclar respuestas DRF dentro de middleware Django y reducir fugas de contexto entre requests.
**Impacto:** Los tests del middleware deben validar `JsonResponse`/`HttpResponse` válidos, bypass de rutas públicas y limpieza de contexto incluso ante excepciones.

---

**Fecha:** 2026-05-04
**Decisión:** En la Fase 1a multi-tenant se resolvera el tenant por header `X-Tenant-Slug`, guardandolo en `request.tenant` y en contexto utilitario, con bypass para `health` y `auth` publicos.
**Motivo:** Introducir la infraestructura base sin romper los módulos actuales ni forzar scoping masivo prematuro.
**Impacto:** Los endpoints protegidos empiezan a exigir tenant; los endpoints publicos siguen operando sin header. El scoping por modelo queda para la Fase 1b.

---

**Fecha:** 2026-05-04  
**Decisión:** En CU17 se implementó procesamiento de recordatorios con `management command` (`procesar_recordatorios`) + ejecución por cron, en lugar de introducir Celery en esta fase.  
**Motivo:** Priorizar una estrategia segura e incremental sin bloquear requests web ni agregar complejidad operativa prematura (broker/workers) hasta que el volumen lo justifique.  
**Impacto:** El backend procesa tareas en lotes (`--limit`) fuera del ciclo HTTP; queda pendiente definir scheduler en infraestructura (Docker/VM) para producción.

---

**Fecha:** 2026-05-04  
**Decisión:** En CU16 CRM se definieron tres recursos planos (`crm-segmentaciones`, `crm-campanas`, `crm-contactos`) bajo `/api/` en lugar de anidar rutas por campaña o paciente.  
**Motivo:** Mantener consistencia con Fases 1-4 (endpoints DRF planos por recurso) y evitar romper convenciones existentes de consumo en web/mobile.  
**Impacto:** Integraciones futuras consumen CRUD estándar por recurso con filtros por query params sin cambios estructurales del router.

---

**Fecha:** 2026-05-04  
**Decisión:** En CU16, las mutaciones de CRM (`create/update/delete`) quedan restringidas a `IsAdministrativoOrAdmin`, dejando lectura en `IsAuthenticated`.  
**Motivo:** El CRM operativo suele ser responsabilidad administrativa; se reutiliza permiso existente para no introducir reglas nuevas ni deuda de seguridad.  
**Impacto:** Usuarios PACIENTE/MEDICO/ESPECIALISTA pueden consultar si tienen token, pero no alterar campañas/segmentaciones/contactos.

---

**Fecha:** 2026-05-04  
**Decisión:** En CU15 el endpoint `GET /api/postoperatorios/` soporta filtro de fecha por query param `?fecha=YYYY-MM-DD` aplicado sobre `fecha_control__date`.  
**Motivo:** Cubrir requerimiento funcional de filtro por fecha sin romper el contrato base de DRF ni crear endpoints paralelos.  
**Impacto:** Web/mobile pueden filtrar controles del dia sin conocer internamente `__date` en ORM.

---

**Fecha:** 2026-05-04  
**Decisión:** En CU15, `profesional_atiende` se asigna automaticamente con `request.user` en `perform_create`.  
**Motivo:** Reusar patron de CU13/CU14 para trazabilidad del profesional actuante y evitar spoofing de usuario desde cliente.  
**Impacto:** Mutaciones conservan autoria consistente y facilitan control de acceso por `tipo_usuario` en `get_queryset`.

---

**Fecha:** 2026-05-01  
**Decisión:** En CU14 se expone `POST /api/cirugias/{id}/reprogramar/` como accion dedicada sobre el recurso en lugar de crear endpoint separado.  
**Motivo:** Reusar patron existente en `citas` y mantener operacion de cambio de agenda como transicion de estado auditable.  
**Impacto:** Cada reprogramacion registra bitacora con accion `REPROGRAMAR` y actualiza `estado_cirugia` a `REPROGRAMADA`.

---

**Fecha:** 2026-05-01  
**Decisión:** Regla de cierre para cirugias: `FINALIZADA` requiere `fecha_real_inicio` y `fecha_real_fin`; ademas se valida orden temporal de fechas reales.  
**Motivo:** Evitar cierres incompletos o inconsistentes en trazabilidad clinica del acto quirurgico.  
**Impacto:** Payloads invalidos retornan 400 y deben corregirse desde cliente antes de persistir.

---

**Fecha:** 2026-05-01  
**Decisión:** En CU13 (Preoperatorio), el estado `APROBADO` exige coherencia minima operativa: `checklist_completado=true` y `apto_anestesia=true`.  
**Motivo:** Evitar aprobar preoperatorios incompletos y mantener una regla de seguridad clinica basica desde backend.  
**Impacto:** Clientes web/mobile deben completar checklist y aptitud anestesica antes de marcar aprobado.

---

**Fecha:** 2026-05-01  
**Decisión:** El modelo `Preoperatorio` se vincula con `Paciente`, `HistoriaClinica`, `EvaluacionQuirurgica` (opcional) y `Cita` (opcional) con validaciones cruzadas de pertenencia al paciente.  
**Motivo:** Mantener trazabilidad clinica entre etapas CU12-CU13 y prevenir inconsistencias de datos.  
**Impacto:** Payloads con relaciones cruzadas invalidas devuelven 400 con error por campo.

---

**Fecha:** 2026-05-01  
**Decisión:** Para Fase 1 (CU12) se implementa endpoint plano `/api/evaluaciones-quirurgicas/`, manteniendo prefijo global `/api/` y sin romper rutas existentes.  
**Motivo:** Requerimiento funcional de fase con aprobacion humana incremental.  
**Impacto:** CU13..CU15 deben mantener consistencia de naming de endpoints planos solicitados en el plan por fases.

---

**Fecha:** 2026-05-01  
**Decisión:** En CU12, escritura restringida a `IsMedicoOrAdmin`; lectura por `get_queryset` segun `tipo_usuario` (PACIENTE solo su ficha, MEDICO/ESPECIALISTA sus evaluaciones, staff global).  
**Motivo:** Reusar politicas de seguridad existentes en consultas/citas y evitar exposicion transversal de datos clinicos.  
**Impacto:** Nuevos modulos clinicos deben conservar el mismo patron de control por rol + filtro por propiedad del registro.

---

**Fecha:** 2026-04-12  
**Decisión:** **Next.js:** rutas en Axios **sin** prefijo `/api/` duplicado; `NEXT_PUBLIC_API_URL` ya termina en `/api`. Consultas REST en **`/consultas/lista/`** y estudios en **`/consultas/estudios/`** (router Django).  
**Motivo:** Los 404 a `/api/api/pacientes/` y formularios rotos; alinear con `config/urls.py`.  
**Impacto:** Nuevas páginas deben seguir el patrón `api.get('recurso/')` no `api.get('/api/recurso/')`.

---

**Fecha:** 2026-04-12  
**Decisión:** **`PermisoViewSet`** como **solo lectura** (`List`/`Retrieve`); permisos granulares se mantienen por **seed/migraciones**; listado permitido a **ADMIN** y **ADMINISTRATIVO** (`IsAdministrativoOrAdmin`).  
**Motivo:** Catálogo estable tipo Django permissions; la UI de “Permisos” es referencia, la asignación ocurre en **Roles**.  
**Impacto:** No hay POST/PATCH/DELETE en `/api/permisos/` desde la API.

---

**Fecha:** 2026-04-12  
**Decisión:** **`TIME_ZONE = America/La_Paz`** en Django; bitácora enriquecida en **consultas**, **estudios**, **citas** (update/delete), **roles** y **pacientes** (delete), con **IP** y **user_agent** donde faltaba.  
**Motivo:** Auditoría clínica y hora local Bolivia en logs y presentación.  
**Impacto:** Nuevos ViewSets deberían llamar `registrar_bitacora` en mutaciones sensibles.

---

**Fecha:** 2026-03-30  
**Decisión:** Login API solo con **`email`** + **`password`**; verificación con **`Usuario.check_password`**, no `authenticate()`.  
**Motivo:** Comportamiento predecible con CustomUser; el móvil y web envían un único identificador (correo).  
**Impacto:** Contrato `POST /api/auth/login/` cambió respecto al campo `login`; clientes deben usar `email`.

---

**Fecha:** 2026-03-30  
**Decisión:** `AppConfig.apiBaseUrl` en Flutter **siempre con barra final** (`.../api/`); rutas Dio relativas sin `/` inicial (`auth/login/`).  
**Motivo:** Evitar concatenación incorrecta (`/apiauth/login/`).  
**Impacto:** Cualquier `API_BASE_URL` en `.env` se normaliza; refresh token usa la misma base sin doble slash.

---

**Fecha:** 2026-03-30  
**Decisión:** Con **`DEBUG=True`**, `ALLOWED_HOSTS` incluye **`*`** además del CSV de `.env`.  
**Motivo:** Peticiones desde móvil por IP LAN (`192.168.x.x`) sin listar cada IP.  
**Impacto:** Solo desarrollo; con `DEBUG=False` no se añade `*`.

---

**Fecha:** 2026-03-30  
**Decisión:** `SIMPLE_JWT['SIGNING_KEY']` = `SECRET_KEY` si longitud UTF-8 ≥ 32, si no **SHA-256 hex** del secret.  
**Motivo:** Cumplir longitud mínima HMAC para HS256 (PyJWT).  
**Impacto:** Si se activa la derivación, tokens JWT anteriores dejan de ser válidos hasta nuevo login.

---

**Fecha:** 2026-03-31  
**Decisión:** Configuración de **URLs y hosts solo por variables de entorno** (raíz `.env` + `mobile/.env`); sin fallbacks hardcodeados de API en Next/Flutter; `FRONTEND_URL` y `DJANGO_ALLOWED_HOSTS` obligatorios vía `decouple` en Django.  
**Motivo:** Un solo lugar para cambiar IP/dominio al desplegar en VM o nube.  
**Impacto:** Hace falta `.env` completo al arrancar; `backend/conftest.py` suplanta valores mínimos para pytest.

---

**Fecha:** 2026-03-31  
**Decisión:** `ENTRYPOINT` del **backend** en Docker: **`["/bin/sh", "./entrypoint.sh"]`** en lugar de ejecutar `./entrypoint.sh` directo.  
**Motivo:** El volumen `./backend:/app` sobrescribe el árbol del contenedor; en el host el script puede no tener `+x` → `permission denied`.  
**Impacto:** El entrypoint no depende del bit ejecutable en el repo clonado en la VM.

---

**Fecha:** 2026-03-31  
**Decisión:** En **Ubuntu con Docker Engine 28+**, usar plugin **Docker Compose v2** (`docker compose`) en lugar del paquete **`docker-compose`** 1.29.x (Python).  
**Motivo:** Bug conocido `KeyError: 'ContainerConfig'` al recrear contenedores con compose v1 y API moderna.  
**Impacto:** Instalar `docker-compose-v2` en servidor; documentado en `docs/guides/despliegue-ubuntu-nube.md`.

---

**Fecha:** 2026-03-31  
**Decisión:** **No versionar** `.env` ni `mobile/.env` en Git (entradas en `.gitignore`).  
**Motivo:** Evitar filtrar secretos e IPs en el historial público.  
**Impacto:** Cada entorno mantiene copia local desde `*.env.example`.

---

**Fecha:** 2026-03-30  
**Decisión:** `CitaViewSet` filtra queryset por **rol** (paciente → su `Paciente`; médico → su `Especialista`; admin/administrativo → todo).  
**Motivo:** No exponer citas de otros pacientes desde la app móvil.  
**Impacto:** Clientes no PACIENTE deben tener perfil vinculado o verán listas vacías.

---

### Ejemplo / Registro Inicial

**Fecha:** 2026-03-21
**Decisión:** Purga intensiva (Lienzo en Blanco) para Frontend Web, App Mobile y Backend en el Scaffold inicial.
**Motivo:** Evitar arrastrar configuraciones boilerplate basuras o vistas dummy de ejemplo que limiten o confundan el stack real a construir paso a paso. Se optó por un control hiper-granular por el Arquitecto Humano en el ecosistema multiplataforma (Web + Mobile).
**Impacto:** El Backend tiene comentadas sus `LOCAL_APPS`. El Frontend Web es un cascarón Next.js limpio. La app Mobile Flutter fue inicializada pero espera sus directivas de ui/theming. Todo se construirá bajo demanda estricta.
