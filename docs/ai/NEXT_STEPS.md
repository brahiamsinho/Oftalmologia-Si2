# NEXT STEPS

Lista priorizada para Oftalmología Si2 (actualizada tras integración mobile paciente).

## Corto Plazo
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
- [ ] Fase 1b multi-tenant segunda ola: endurecer `NOT NULL` solo cuando auth pública/registro ya entren con tenant explícito o routing tenant-aware.
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
- [ ] Web Admin: tablas y flujos sobre pacientes, citas, disponibilidades.
- [ ] Mobile: vista **médico** / staff (si aplica mismo app o build flavor).
- [ ] Recuperación de contraseña en app (endpoints ya en backend).

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
