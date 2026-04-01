# Oftalmología Si2 — Documentación

## Para desarrolladores que entran al proyecto

1. **Raíz del repo:** [`README.md`](../README.md) — stack, setup local con Docker, comandos habituales.
2. **Variables de entorno:** copiar [`.env.example`](../.env.example) → `.env` en la raíz; para Flutter, `mobile/.env` desde [`mobile/.env.example`](../mobile/.env.example). **No commitear** `.env` ni `mobile/.env` (están en `.gitignore`).
3. **Contrato API:** prefijo **`/api/`** (no `/api/v1/`). Login: `POST /api/auth/login/` con `{ "email", "password" }`.
4. **Docker:** en local y en CI se usa **`docker compose`** (plugin v2). En Ubuntu servidor, instalar `docker-compose-v2` y evitar el `docker-compose` Python 1.29 con Docker 28+ (error `ContainerConfig`).
5. **Despliegue en VM / nube:** [`docs/guides/despliegue-ubuntu-nube.md`](guides/despliegue-ubuntu-nube.md).
6. **Negocio clínico:** [`logicadenegocio.md`](../logicadenegocio.md) en la raíz (lectura recomendada antes de tocar dominio).
7. **Agentes / SDD:** [`AGENTS.md`](../AGENTS.md).

---

## Estado del proyecto y handoff (agentes / continuidad)

Leer en orden:

1. `docs/ai/CURRENT_STATE.md`
2. `docs/ai/HANDOFF_LATEST.md`
3. `docs/ai/NEXT_STEPS.md`
4. `docs/ai/DECISIONS_LOG.md` (decisiones recientes al inicio del archivo)

También: `docs/ai/MOBILE_ARCHITECTURE.md`, `docs/ai/ARCHITECTURE.md`, `docs/ai/README.md`.

**Mobile:** `API_BASE_URL` en `mobile/.env` — emulador Android `http://10.0.2.2:8000/api`, físico / VM pública según red. Tras cambiar `.env`, reiniciar la app (no solo hot reload).

---

## Estructura de documentación

```
docs/
├── ai/                 # Estado, handoff, visión, arquitectura (agentes)
├── architecture/       # Diagramas y decisiones de arquitectura
├── api/                # Documentación de endpoints
├── guides/             # Guías operativas (despliegue, etc.) — ver guides/README.md
└── README.md           # Este archivo
```

---

## Convenciones del proyecto

### Git

- Commits descriptivos en español o inglés
- Ramas: `main`, `develop`, `feature/*`, `bugfix/*`, `hotfix/*`

### Código

- **Python:** PEP 8, docstrings en español
- **TypeScript:** ESLint + Prettier
- **Dart:** Effective Dart guidelines

### Base de datos

- Tablas en `snake_case`
- Entidades con `created_at`, `updated_at`
- UUIDs como PK para entidades principales
- No editar migraciones ya aplicadas

### Comandos Docker + Django (desde la raíz del monorepo)

```bash
# Tras cambiar modelos (en dev)
docker compose exec backend python manage.py makemigrations

docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed
```

> **`seed`** es idempotente: se puede ejecutar varias veces sin duplicar datos base (roles, admin, tipos de cita, etc.).

Si tu entorno solo tiene el binario clásico: `docker-compose` (con guión) en lugar de `docker compose`.

---

## Guía rápida Flutter (`mobile/`)

```bash
flutter doctor -v
flutter pub get
flutter analyze
flutter run
flutter devices
flutter clean
dart format lib
```
