# HANDOFF LATEST

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

## Resumen
**Fecha:** 2026-05-04 (Fase 6 CU17 recordatorios automaticos)

**Backend:** nuevo modulo `apps.notificaciones.automatizaciones` con reglas, tareas programadas y logs bajo `/api/notificaciones/`.

**Datos/negocio:**
- `ReglaRecordatorio` define tipo de recordatorio, ventana (`horas_antes`) y plantillas.
- `TareaRecordatorioProgramada` agenda ejecuciones por paciente/postoperatorio.
- `LogEjecucionRecordatorio` guarda resultado de cada procesamiento (info/error).

**Ejecucion segura:** si no hay Celery, se habilita `python manage.py procesar_recordatorios --limit N` para cron, procesando lotes pendientes sin bloquear request-response web.

**Permisos/bitacora:** mutaciones de reglas y acciones de tareas (`generar`, `procesar`) restringidas a `IsAdministrativoOrAdmin`; lectura autenticada; bitacora en CUD de reglas y generacion de tareas.

**Integracion:** se agrega `apps.notificaciones.automatizaciones` en `INSTALLED_APPS`; rutas montadas via `apps/notificaciones/urls.py` manteniendo prefijo base `/api/`.

**Testing:** agregado `backend/apps/notificaciones/automatizaciones/tests/test_automatizaciones.py` (crear regla, generar tarea, procesar y log de exito, fallo controlado con log de error). En host local no corre por entorno faltante: `ModuleNotFoundError: No module named 'django'` y `Unknown config option: DJANGO_SETTINGS_MODULE`.

Detalle: `docs/ai/sessions/2026-05-04-agent-cu17-fase6.md`

---

**Fecha:** 2026-05-04 (Fase 5 CU16 CRM pacientes)

**Backend:** nuevo modulo `apps.crm` con CRUD para segmentacion, campanas e historial de contacto bajo `/api/crm-segmentaciones/`, `/api/crm-campanas/` y `/api/crm-contactos/`.

**Datos/negocio:**
- `SegmentacionPaciente` para clasificar pacientes por criterios.
- `CampanaCRM` vinculada a segmentacion con estado y rango de fechas.
- `HistorialContacto` vinculado a paciente/campana con canal y resultado de contacto.

**Permisos/bitacora:** mutaciones restringidas a `IsAdministrativoOrAdmin`; lectura para usuarios autenticados; bitacora create/update/delete en modulo `crm`.

**Integracion:** app agregada en `config/settings.py` y rutas incluidas en `config/urls.py` sin romper el prefijo base `/api/`.

**Testing:** agregado `backend/apps/crm/tests/test_crm.py` (permisos, validacion de fechas y CRUD base + bitacora). En host local no corre por falta de DRF (`ModuleNotFoundError: rest_framework`) y pytest-django no inicializa (`Unknown config option: DJANGO_SETTINGS_MODULE`).

Detalle: `docs/ai/sessions/2026-05-04-agent-cu16-fase5.md`

---

**Fecha:** 2026-05-04 (Fase 4 CU15 postoperatorio)

**Backend:** nuevo modulo `apps.atencionClinica.postoperatorio` con CRUD en `/api/postoperatorios/`.

**Datos/negocio:** seguimiento postoperatorio con `estado_postoperatorio`, `fecha_control`, `proximo_control`, `alertas` y `profesional_atiende`; validaciones de coherencia paciente-historia-cirugia y regla temporal (`proximo_control >= fecha_control`).

**Permisos/bitacora:** mutaciones restringidas a `IsMedicoOrAdmin`; bitacora en create/update/delete con `modulo='postoperatorio'`.

**Integracion:** app agregada en `config/settings.py` y rutas incluidas en `config/urls.py`.

**Testing:** agregado `backend/apps/atencionClinica/postoperatorio/tests/test_postoperatorio.py` (permisos, validaciones, CRUD, filtros, bitacora). En host local no corre por falta de Django/DRF; Docker local no disponible en esta ejecucion.

Detalle: `docs/ai/sessions/2026-05-04-agent-cu15-fase4.md`

---

**Fecha:** 2026-05-01 (Fase 3 CU14 cirugias)

**Backend:** nuevo modulo `apps.atencionClinica.cirugias` con CRUD en `/api/cirugias/` y accion `POST /api/cirugias/{id}/reprogramar/`.

**Datos/negocio:** estado de cirugia, fecha programada/real, cirujano, resultado y complicaciones; validaciones de coherencia paciente-historia-preoperatorio-cita y regla de cierre (`FINALIZADA` requiere fechas reales).

**Permisos/bitacora:** mutaciones y reprogramacion restringidas a `IsMedicoOrAdmin`; bitacora en create/update/delete/reprogramar con `modulo='cirugias'`.

**Integracion:** app agregada en `config/settings.py` y rutas incluidas en `config/urls.py`.

**Testing:** agregado `backend/apps/atencionClinica/cirugias/tests/test_cirugias.py` (permisos, validaciones, CRUD, reprogramacion). En host local no corre por falta de Django/DRF.

Detalle: `docs/ai/sessions/2026-05-01-agent-cu14-fase3.md`

---

**Fecha:** 2026-05-01 (Fase 2 CU13 preoperatorio)

**Backend:** nuevo modulo `apps.atencionClinica.preoperatorio` con CRUD en `/api/preoperatorios/`, estado preoperatorio + checklist/examenes, validaciones de coherencia paciente-historia-evaluacion-cita y regla de aprobacion (checklist + apto anestesia).

**Permisos/bitacora:** mutaciones restringidas a `IsMedicoOrAdmin`; bitacora en create/update/delete con `modulo='preoperatorio'`.

**Integracion:** app agregada en `config/settings.py` y rutas incluidas en `config/urls.py`.

**Testing:** agregado `backend/apps/atencionClinica/preoperatorio/tests/test_preoperatorio.py` (permisos, validaciones, CRUD base, bitacora). En host local no corre por dependencia faltante DRF.

Detalle: `docs/ai/sessions/2026-05-01-agent-cu13-fase2.md`

---

**Fecha:** 2026-05-01 (Fase 1 CU12 evaluacion quirurgica)

**Backend:** nuevo modulo `apps.atencionClinica.evaluacion_quirurgica` con CRUD en `/api/evaluaciones-quirurgicas/`, validaciones de coherencia paciente-historia-consulta, permisos por rol y bitacora en mutaciones.

**Integracion:** `INSTALLED_APPS` actualizado en `config/settings.py` y ruta incluida en `config/urls.py`.

**Testing:** agregado `backend/apps/atencionClinica/evaluacion_quirurgica/tests/test_evaluacion_quirurgica.py` (permisos, validaciones, CRUD, bitacora). En host local no corre por dependencias faltantes de DRF; ejecutar en entorno backend Docker/venv del proyecto.

Detalle: `docs/ai/sessions/2026-05-01-agent-cu12-fase1.md`

---

**Fecha:** 2026-04-12 (mobile paciente + API consultas/estudios)

**Mobile (paciente):** tarjeta del home muestra **última cita** si no hay próximas; accesos rápidos enlazan a pestaña **Citas** y a pantalla **Historial clínico** (consultas + estudios); contacto/emergencias con `CLINIC_PHONE` en `mobile/.env` (opcional). Repositorio `ClinicalRepository` → `consultas/lista/`, `consultas/estudios/`.

**Backend:** `ConsultaViewSet` y `EstudioViewSet` filtran por rol (PACIENTE por ficha vinculada al usuario; médico por `especialista`; admin todo + `paciente_id`).

Detalle: `docs/ai/sessions/2026-04-12-mobile-paciente-clinical-api.md`

---

**Fecha:** 2026-04-12 (actualización posterior)

**Docker backend:** `entrypoint.sh` ejecuta **`migrate --noinput`** antes de `collectstatic`, para que una Postgres nueva no quede sin tablas (sesiones, JWT blacklist, usuarios). El **seed** sigue manual.

**Roles / permisos en UI:** el modelo `Permiso` no tiene campo `activo`; el listado del modal filtraba `x.activo` (siempre `undefined` → vacío). Corregido a **`activo !== false`** y tipo opcional.

**Consultas:** nueva pantalla **`/consultas`** (sidebar Atención clínica); tras **Registrar consulta** redirige allí. **Lógica cita–paciente:** al elegir cita se completa paciente; citas filtradas por paciente y sin canceladas; **backend** valida que cita y paciente coincidan y marca la cita **ATENDIDA** al crear la consulta (estados programada/confirmada/reprogramada).

**Pacientes:** modal muestra error genérico si la API devuelve `detail` / `non_field_errors` o 500 sin mapa de campos.

**Axios `fetchAll`:** reescribe `next` con host `0.0.0.0` o `backend` al origen de `NEXT_PUBLIC_API_URL`.

---

Corrección integral del **frontend Next.js** respecto al prefijo API: el `baseURL` de Axios ya incluye `/api`, por lo que las páginas no deben llamar `/api/pacientes/` (eso generaba **`/api/api/...`** y 404). **Registrar consulta** y **medición** ahora usan **`POST /consultas/lista/`** y **`POST /consultas/estudios/`** con payload alineado al modelo Django.

**Backend:** `TIME_ZONE = America/La_Paz`; catálogo de permisos **solo lectura** en API para ADMIN/ADMINISTRATIVO; más eventos de **bitácora** (consultas, estudios, citas update/delete, roles, delete paciente); serializer de bitácora expone **`usuario_email`**.

**UX:** sidebar **drawer en móvil**; bitácora con contadores reales (`count`) y hora Bolivia; dashboard sin dato hardcodeado “24”; pantalla **Permisos** solo lectura; **Roles** carga permisos y roles en bloques independientes (un fallo no vacía el otro).

Detalle: `docs/ai/sessions/2026-04-12-frontend-api-bitacora-permisos.md`

## Qué debe hacer el siguiente agente
1. Leer `docs/ai/CURRENT_STATE.md` y la sesión citada arriba.
2. Verificar `.env`: `NEXT_PUBLIC_API_URL=http://localhost:8000/api` (o equivalente; una sola URL).
3. Tras pull: probar flujo paciente → consulta → bitácora y creación de rol con permisos.
4. Si hace falta **export CSV** en bitácora, implementar endpoint o generación en cliente (botón deshabilitado con título “Próximamente”).

## Variables (recordatorio)
```
NEXT_PUBLIC_API_URL=.../api     # sin segunda barra /api en paths del cliente
```
