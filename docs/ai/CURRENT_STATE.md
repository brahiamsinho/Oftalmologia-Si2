# CURRENT STATE

## Estado Actual del Proyecto
**Sprint 1 backend completo** + **Mobile paciente integrado** (login + home con citas reales). Frontend Next.js con auth por correo alineado al mismo contrato de API.

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
- **`ALLOWED_HOSTS`**: con `DJANGO_DEBUG=True` se añade `*` para desarrollo (móvil por IP LAN sin listar cada host).
- **`SIMPLE_JWT['SIGNING_KEY']`**: si `DJANGO_SECRET_KEY` tiene menos de 32 bytes en UTF-8, se deriva SHA-256 hex (evita `InsecureKeyLengthWarning`).
- **Seeders**: `seed`, `seed --only demo_paciente` — paciente demo + 2 médicos + 2 citas (ver `seed_demo_paciente.py`).

### Mobile (Flutter)
- Login modular: `login_header`, `login_form`, `login_actions`; tema alineado a diseño clínica.
- **`API_BASE_URL`** en `mobile/.env` (**obligatoria**): debe apuntar a la base del API (`.../api`); `AppConfig.apiBaseUrl` **normaliza barra final** (`.../api/`); si falta la variable, la app falla al usar la API (sin fallback hardcodeado).
- Rutas relativas sin `/` inicial: `auth/login/`, `citas/`, etc.
- Android: `usesCleartextTraffic` para HTTP en dev.
- Timeout HTTP 30 s (margen arranque Docker/Postgres).
- **`intl` + `initializeDateFormatting('es')`** en `main.dart`.
- Home **paciente** (`PatientHomeScreen`): cabecera, próxima cita, accesos rápidos, lista Próximas/Historial, estados carga/vacío/error; `GET citas/` vía `CitasRepository` + Riverpod.
- `HomeScreen` enruta a paciente si `tipoUsuario == 'PACIENTE'`; resto mantiene panel staff placeholder.

### Frontend (Next.js)
- Login usa **`email` + `password`** en `POST /api/auth/login/` (tipo `LoginCredentials` actualizado).
- Demo admin en UI: `admin@oftalmologia.local` / `admin123`.
- **`NEXT_PUBLIC_API_URL`** obligatoria (sin fallback hardcodeado en runtime); `next.config.js` deriva rewrites e `images.remotePatterns` de esa URL.
- **Cliente Axios:** rutas relativas al `baseURL` (p. ej. `pacientes/`, `citas/`) — **no** anteponer otra vez `/api/` (evita `/api/api/...`).
- **Atención clínica:** `POST /consultas/lista/` para consultas; `POST /consultas/estudios/` para estudios/mediciones (multipart).
- **Layout dashboard:** sidebar tipo drawer en `<768px` con overlay; desktop mantiene ancho colapsable; columna de contenido con **`min-h-0 overflow-hidden`** y `<main>` con **`min-h-0`** para que el flex no recorte la zona scrollable bajo `h-screen overflow-hidden`.
- **Permisos (pantalla):** catálogo **solo lectura**; asignación en **Roles**.
- **Bitácora (pantalla):** métricas con `count` de API; hora mostrada en **`America/La_Paz`** (Bolivia).
- **Dashboard:** KPIs desde API (incl. citas `ATENDIDA`); sin contador hardcodeado de “visitas”.
- **Consultas:** ruta **`/consultas`** lista `GET /consultas/lista/`; tras registrar consulta se redirige allí. **Registrar consulta:** al elegir cita se rellena el paciente; el desplegable de citas filtra por paciente y excluye canceladas; **backend:** al crear consulta con cita, pasa a estado **ATENDIDA** si estaba programada/confirmada/reprogramada; validación de coherencia paciente–cita.
- **Roles:** listado de permisos en el modal sin filtrar por `activo` inexistente en API (`activo !== false` / tipo opcional).
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
*(Actualizado: 2026-04-12)*
