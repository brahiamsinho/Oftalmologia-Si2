# DECISIONS LOG

Este archivo documenta todas las decisiones técnicas arquitectónicas importantes tomadas en la evolución del proyecto.

## Formato de Registro
- **Fecha:** YYYY-MM-DD
- **Decisión:** Resumen de la decisión técnica.
- **Motivo:** ¿Por qué se tomó y qué alternativas se consideraron?
- **Impacto:** ¿Qué consecuencias operativas o de código implica?

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
**Decisión:** Para Fase 1 (CU12) se implementa endpoint plano ` /api/evaluaciones-quirurgicas/ `, manteniendo prefijo global `/api/` y sin romper rutas existentes.  
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
