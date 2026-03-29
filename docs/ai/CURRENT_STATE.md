# CURRENT STATE

## Estado Actual del Proyecto
Etapa **SPRINT 1 BACKEND COMPLETO**. Toda la lógica del Backend ha sido implementada: modelos, serializers, views, URLs y admin de todas las tablas del Sprint 1.

## Qué Ya Está Hecho
- Arquitectura Modular instalada: `/backend`, `/frontend`, `/mobile`.
- Infraestructura Docker y PostgreSQL conectada de forma estable.
- **Doble ciclo de migraciones evitado**: El `entrypoint.sh` solo espera a Postgres y levanta el sistema, dejando `makemigrations`, `migrate` y `seed` bajo el control del desarrollador.
- **Seeders Implementados**: Módulo `/backend/seeders/` con `seed_admin.py`, `seed_roles.py`, `seed_permisos.py` y `seed_tipos_cita.py`. Idempotentes vía `python manage.py seed`.
- **Mailhog** agregado al `docker-compose.yml` para captura de emails en desarrollo (`:8025`).
- **CustomUser (`apps.users.Usuario`)** con 5 tipos: ADMIN, ADMINISTRATIVO, MEDICO, ESPECIALISTA, PACIENTE.
- **`AUTH_USER_MODEL = 'users.Usuario'`** activado en settings.
- **JWT Blacklist** habilitado (logout real con token invalidado).

## Apps Implementadas (Sprint 1 Completo)
| App | Modelos |
|-----|---------|
| `apps.core` | utils, permissions, health-check |
| `apps.users` | Usuario, Rol, Permiso, UsuarioRol, RolPermiso, TokenRecuperacion |
| `apps.bitacora` | Bitacora (app separada) |
| `apps.pacientes` | Paciente |
| `apps.especialistas` | Especialista |
| `apps.historial_clinico` | HistoriaClinica |
| `apps.antecedentes` | AntecedenteClinico |
| `apps.diagnosticos` | DiagnosticoClinico |
| `apps.tratamientos` | TratamientoClinico |
| `apps.evoluciones` | EvolucionClinica |
| `apps.recetas` | Receta, RecetaDetalle |
| `apps.citas` | TipoCita, DisponibilidadEspecialista, Cita |

## Endpoints Implementados (Prefijo base: `/api/`)

**Autenticación y Usuarios**
- `POST /auth/register/` — Registro (auto-crea Paciente/Especialista)
- `POST /auth/login/` — Login (username o email)
- `POST /auth/logout/` — Logout con blacklist de token
- `GET/PATCH /auth/me/` — Perfil propio
- `POST /auth/change-password/` — Cambiar contraseña
- `POST /auth/reset-password/` — Solicitar reset (envía email a Mailhog)
- `POST /auth/reset-password/confirm/` — Confirmar reset
- `CRUD /users/`
- `CRUD /roles/`
- `CRUD /permisos/`
- `GET /bitacora/` — Historial de auditoría delegada

**Personal Médico y Pacientes**
- `CRUD /pacientes/`
- `CRUD /especialistas/`
- `GET /especialistas/{id}/disponibilidades/`

**Historias Clínicas (Modular - Rutas Anidadas)**
- `CRUD /historias-clinicas/`
- `CRUD /historias-clinicas/{id_historia_clinica}/antecedentes/`
- `CRUD /historias-clinicas/{id_historia_clinica}/diagnosticos/`
- `CRUD /historias-clinicas/{id_historia_clinica}/tratamientos/`
- `CRUD /historias-clinicas/{id_historia_clinica}/evoluciones/`
- `CRUD /historias-clinicas/{id_historia_clinica}/recetas/`
- `CRUD /historias-clinicas/{id_historia_clinica}/recetas/{id_receta}/detalles/`

**Agendamiento y Citas**
- `CRUD /tipos-cita/`
- `CRUD /disponibilidades/`
- `CRUD /citas/`
- Acciones: `/citas/{id}/confirmar/`, `/citas/{id}/cancelar/`, `/citas/{id}/reprogramar/`

**Sistema**
- `GET /health/` — Health check

## Qué Falta (Pendientes Inmediatos)
- Frontend: consumir la API
- Mobile: integrar Flutter con la API

## Riesgos Conocidos
- El campo `numero_documento` de Paciente es UNIQUE — en registro automático se genera `PENDIENTE-{user_id}` si no se provee. El paciente debe actualizarlo.

---
*(Actualizado: 2026-03-28)*
**Agente actualizador:** Antigravity
