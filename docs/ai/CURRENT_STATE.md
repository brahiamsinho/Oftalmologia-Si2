# CURRENT STATE

## Estado Actual del Proyecto
**Sprint 1 backend completo** + **Mobile paciente integrado** (login + home con citas reales). Frontend Next.js con auth por correo alineado al mismo contrato de API.

## Qué Ya Está Hecho

### Backend (Django / DRF)
- Arquitectura modular, Docker, PostgreSQL, Mailhog.
- CustomUser (`apps.users.Usuario`), JWT + blacklist, prefijo API **`/api/`** (no `/api/v1/`).
- Apps Sprint 1: usuarios, pacientes, especialistas, historias clínicas modulares, citas, bitácora, etc.
- **`POST /api/auth/login/`**: body **`{ "email", "password" }`** — solo correo; validación con `check_password` (no `authenticate()`).
- **`CitaViewSet.get_queryset()`**: PACIENTE solo ve sus citas; MEDICO/ESPECIALISTA las suyas; ADMIN/ADMINISTRATIVO todas.
- **`ALLOWED_HOSTS`**: con `DJANGO_DEBUG=True` se añade `*` para desarrollo (móvil por IP LAN sin listar cada host).
- **`SIMPLE_JWT['SIGNING_KEY']`**: si `DJANGO_SECRET_KEY` tiene menos de 32 bytes en UTF-8, se deriva SHA-256 hex (evita `InsecureKeyLengthWarning`).
- **Seeders**: `seed`, `seed --only demo_paciente` — paciente demo + 2 médicos + 2 citas (ver `seed_demo_paciente.py`).

### Mobile (Flutter)
- Login modular: `login_header`, `login_form`, `login_actions`; tema alineado a diseño clínica.
- **`API_BASE_URL`** en `mobile/.env`: debe terminar conceptualmente en `/api`; `AppConfig.apiBaseUrl` **normaliza con barra final** (`.../api/`) para que Dio no genere URLs tipo `/apiauth/...`.
- Rutas relativas sin `/` inicial: `auth/login/`, `citas/`, etc.
- Android: `usesCleartextTraffic` para HTTP en dev.
- Timeout HTTP 30 s (margen arranque Docker/Postgres).
- **`intl` + `initializeDateFormatting('es')`** en `main.dart`.
- Home **paciente** (`PatientHomeScreen`): cabecera, próxima cita, accesos rápidos, lista Próximas/Historial, estados carga/vacío/error; `GET citas/` vía `CitasRepository` + Riverpod.
- `HomeScreen` enruta a paciente si `tipoUsuario == 'PACIENTE'`; resto mantiene panel staff placeholder.

### Frontend (Next.js)
- Login usa **`email` + `password`** en `POST /api/auth/login/` (tipo `LoginCredentials` actualizado).
- Demo admin en UI: `admin@oftalmologia.local` / `admin123`.

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
- Pantallas mobile Citas / Perfil (placeholders).
- Agendar cita, detalle cita, recuperación contraseña en app.
- Frontend web: más módulos sobre API (pacientes, citas, etc.).
- Registro mobile conectado a `POST /auth/register/`.
- Producción: `DEBUG=False`, `ALLOWED_HOSTS` explícitos, HTTPS, clave JWT larga en `.env`.

## Riesgos Conocidos
- `numero_documento` UNIQUE en Paciente — registro auto puede dejar `PENDIENTE-{id}` hasta actualización.
- Móvil en **dispositivo físico**: `API_BASE_URL` = IP LAN del PC (`ipconfig`), misma Wi‑Fi; no usar `10.0.2.2` fuera del emulador Android.
- Tras cambiar `DJANGO_SECRET_KEY` corta por derivación JWT, tokens previos invalidan hasta nuevo login.

---
*(Actualizado: 2026-03-30)*
