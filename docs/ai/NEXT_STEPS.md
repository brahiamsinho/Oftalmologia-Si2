# NEXT STEPS

Lista priorizada para Oftalmología Si2 (actualizada tras integración mobile paciente).

## Corto Plazo
- [x] Fase 1a multi-tenant base: app `tenant`, middleware `X-Tenant-Slug`, `request.tenant`, bootstrap `legacy`, tests minimos.
- [x] Fase 1a multi-tenant hardening: errores del middleware con `JsonResponse` + limpieza de `ContextVar` + tests de bypass/aislamiento.
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
- [ ] Mobile: Agendar / detalle de cita (según diseño y permisos API).

## Mediano Plazo
- [x] Modelos y API Pacientes/Citas (backend Sprint 1).
- [ ] Web Admin: tablas y flujos sobre pacientes, citas, disponibilidades.
- [ ] Mobile: vista **médico** / staff (si aplica mismo app o build flavor).
- [ ] Recuperación de contraseña en app (endpoints ya en backend).

## Largo Plazo
- [ ] Web: historias clínicas completas, adjuntos/imágenes.
- [ ] Mobile: notificaciones (FCM) para turnos.
- [ ] Despliegue: Nginx, HTTPS, `DEBUG=False`, hosts y CORS explícitos.

## Pendientes Técnicos
- [x] Guía despliegue VM Ubuntu / Azure + onboarding en `docs/README.md` (`docs/guides/despliegue-ubuntu-nube.md`).
- [ ] Export CSV (o similar) en pantalla Bitácora — botón preparado como placeholder.
- [ ] Doc único de convenciones TS / Dart / Python.
- [ ] Storage compartido para imágenes clínicas (S3 / similar).
- [ ] Tests automatizados en flujos auth + citas (backend + widget mobile crítico).
- [ ] Infra: programar cron real para `manage.py procesar_recordatorios` en entorno Docker/VM y monitorear logs.
