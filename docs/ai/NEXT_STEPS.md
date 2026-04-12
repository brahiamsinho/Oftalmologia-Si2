# NEXT STEPS

Lista priorizada para Oftalmología Si2 (actualizada tras integración mobile paciente).

## Corto Plazo
- [x] Backend: CustomUser + JWT (ya existía; login refinado a email + `check_password`).
- [x] Mobile: Login real + home paciente con `GET /citas/` + tema/rutas base.
- [x] Frontend: Login con `email` alineado a API.
- [ ] Mobile: Completar pestañas **Citas** y **Perfil** (navegación ya existe).
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
