# CURRENT STATE

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
| Uso | Email | Password |
|-----|--------|----------|
| Admin (seed) | `admin@oftalmologia.local` | `admin123` |
| Paciente demo | `brandon@gmail.com` | `Felipe321` |

Ejecutar: `docker compose exec backend python manage.py seed --only demo_paciente` (requiere `tipos_cita` ya sembrados).

## Endpoints Clave (recordatorio)
- Login: `POST /api/auth/login/` → `{ email, password }`
- Citas (filtradas por rol): `GET /api/citas/?ordering=fecha_hora_inicio`
- Health: `GET /api/health/`

## Qué Falta (prioridad sugerida)
- Agendar cita desde la app, detalle de cita, recuperación de contraseña en app.
- Frontend web: más módulos sobre API (pacientes, citas, etc.).
- Registro mobile conectado a `POST /auth/register/`.
- Producción: `DEBUG=False`, `ALLOWED_HOSTS` explícitos, HTTPS, clave JWT larga en `.env`.

## Riesgos Conocidos
- `numero_documento` UNIQUE en Paciente — registro auto puede dejar `PENDIENTE-{id}` hasta actualización.
- Móvil en **dispositivo físico**: `API_BASE_URL` = IP LAN del PC (`ipconfig`), misma Wi‑Fi; no usar `10.0.2.2` fuera del emulador Android.
- Tras cambiar `DJANGO_SECRET_KEY` corta por derivación JWT, tokens previos invalidan hasta nuevo login.

---
*(Actualizado: 2026-05-04)*
