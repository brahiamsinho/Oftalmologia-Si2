# HANDOFF LATEST

## Resumen de la Última Sesión
**Fecha:** 2026-03-31

Documentación y operaciones para **próximos desarrolladores**: `docs/README.md` ampliado (onboarding, Docker Compose v2, secretos), índice `docs/guides/README.md`, guía VM ya enlazada. Estado técnico en `CURRENT_STATE.md` incluye bloque **Infra / despliegue** (`.env`, gitignore, entrypoint backend, Azure/Ubuntu).

**Contexto previo (2026-03-30):** integración **Flutter paciente** con API real (login email, home citas), Next.js alineado, seeder demo, refactor **config vía `.env`** (sin URLs fijas en app), docstrings API unificados a **`/api/`**, `Dockerfile` entrypoint con `sh`, decisión Compose v2 en Ubuntu.

---

## Sesión 2026-03-30 (referencia)

Integración **Flutter paciente** con API real: login por **solo email**, home con citas, correcciones de red/Docker/JWT y seeder demo. Ajustes en **Next.js** para el mismo contrato de login.

## Objetivo Trabajado
- Pantalla de login mobile modular (Figma) y flujo JWT estable.
- Home paciente: próxima cita, lista, tabs, pull-to-refresh, estados vacío/carga/error.
- Eliminar fallos de integración: `DisallowedHost`, URL mal concatenada (`/apiauth/`), timeouts en arranque.
- Datos demo reproducibles (`seed_demo_paciente`).

## Cambios Relevantes (por área)

### Backend
- `apps/users/serializers.py` — `LoginSerializer`: campos `email` + `password`; `check_password`; sin username en login.
- `apps/citas/views.py` — `get_queryset()` por rol (paciente / médico / admin).
- `config/settings.py` — `ALLOWED_HOSTS` + `*` en DEBUG; `SIMPLE_JWT['SIGNING_KEY']` derivada si SECRET_KEY corta.
- `seeders/seed_demo_paciente.py` + registro en `manage.py seed --only demo_paciente`.

### Mobile
- `lib/config/app_config.dart` — `apiBaseUrl` con **barra final**; timeout 30 s.
- `lib/core/network/api_client.dart` — refresh URL sin doble slash.
- `lib/features/auth/*` — repositorio envía `email`; pantallas/widgets login.
- `lib/features/home/*` — dominio `CitaResumen`, `CitasRepository`, providers, `PatientHomeScreen` + widgets.
- `lib/features/home/presentation/screens/home_screen.dart` — bifurca PACIENTE vs staff.
- `lib/main.dart` — `initializeDateFormatting('es')`.
- `android/.../AndroidManifest.xml` — `usesCleartextTraffic` (dev).

### Frontend
- `src/lib/types.ts` — `LoginCredentials.email`.
- `src/context/AuthContext.tsx` + `login/page.tsx` — envío con email; demo `admin@oftalmologia.local`.

### Raíz / docs (evolución hasta 2026-03-31)
- `.env.example` — checklist IP, `HOST_PORT_*`, `FRONTEND_URL`, variables obligatorias.
- `docs/guides/despliegue-ubuntu-nube.md` — Azure/Ubuntu, `docker compose`, migrate/seed Django.
- `backend/Dockerfile` — `ENTRYPOINT` con `/bin/sh` + `./entrypoint.sh` (bind mount).
- Docstrings backend alineados a rutas **`/api/...`** (no `/api/v1/`).

## Pitfalls Resueltos (para no repetir)
1. **Dio `baseUrl` sin `/` final** + path `auth/login/` → concatenación **`apiauth`**. Solución: base `.../api/`.
2. **Host HTTP del móvil** (`192.168.x.x`) no permitido → `DisallowedHost`. Solución: `*` en DEBUG o listar IPs en `DJANGO_ALLOWED_HOSTS`.
3. **String Dart** `'$_saludo(), ...'` imprime Closure → usar **`'${_saludo()}, ...'`**.
4. **JWT warning 31 bytes** → `SIGNING_KEY` derivada o SECRET ≥ 32 caracteres.

## Qué Debe Hacer el Siguiente Agente
1. Leer `docs/README.md` (onboarding), `docs/ai/CURRENT_STATE.md` y este archivo.
2. VM Ubuntu: seguir `docs/guides/despliegue-ubuntu-nube.md` (`docker compose`, no compose Python viejo con Docker 28).
3. Si toca mobile: confirmar `mobile/.env` (`API_BASE_URL`, emulador vs físico / IP pública VM).
4. Continuar features: tab Citas/Perfil mobile, registro API, o módulos web según `NEXT_STEPS.md`.
5. Antes de producción: `DEBUG=False`, hosts/CORS explícitos, HTTPS, secretos fuertes; no subir `.env` al repo.

## Variables de Entorno (recordatorio)
```
DJANGO_DEBUG=True          # desarrollo: ALLOWED_HOSTS incluye *
DJANGO_SECRET_KEY=...    # ideal ≥ 32 caracteres para JWT sin derivación
API_BASE_URL=http://.../api/   # mobile; barra final la añade AppConfig si falta
```
