# 🏥 Oftalmología Si2

Sistema integral para clínica oftalmológica — gestión de pacientes, citas, exámenes, historias clínicas y más.

## Stack Tecnológico

| Capa          | Tecnología              | Puerto Dev |
| ------------- | ----------------------- | ---------- |
| Backend       | Django 5 + DRF          | :8000      |
| Frontend      | Next.js 14 (App Router) | :3000      |
| Mobile        | Flutter                 | —          |
| Base de Datos | PostgreSQL 16           | :5432      |
| Contenedores  | Docker + Docker Compose | —          |

## Requisitos Previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Git
- (Opcional) Python 3.12+, Node.js 20+, Flutter SDK — solo si quieres desarrollo sin Docker

**VM Ubuntu en la nube (Azure, etc.):** guía paso a paso en [`docs/guides/despliegue-ubuntu-nube.md`](docs/guides/despliegue-ubuntu-nube.md) (Docker Compose v2, sin Laravel).

## Setup Rápido

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd Oftalmologia-Si2

# 2. Copiar y configurar variables de entorno
cp .env.example .env
# Edita .env con tus valores reales (especialmente contraseñas y secret key)

# Variables obligatorias en .env (plantilla en .env.example):
#   DJANGO_ALLOWED_HOSTS, FRONTEND_URL, NEXT_PUBLIC_API_URL
# Con DJANGO_DEBUG=False también hace falta CORS_ALLOWED_ORIGINS.
# Puertos del host (VM / nube): HOST_PORT_BACKEND, HOST_PORT_FRONTEND, etc.

# 3. Construir y levantar los contenedores
docker-compose up --build

# 4. Migraciones: al iniciar, el servicio `backend` ejecuta `python manage.py migrate --noinput` (ver `backend/entrypoint.sh`). Si agregaste modelos en tu copia del repo, generá migraciones en el host y volvé a levantar: `docker compose exec backend python manage.py makemigrations`.

# 5. Poblar base de datos (crea superusuario 'admin', roles, permisos y tipos de cita)
docker-compose exec backend python manage.py seed
```

## Acceso

Con los valores por defecto de `.env.example` (puertos 3000 y 8000):

- **Frontend:** `http://localhost:3000` (o `http://TU_IP:HOST_PORT_FRONTEND`)
- **Backend API:** `http://localhost:8000/api/` (o el host/puerto que definiste)
- **Django Admin:** `http://localhost:8000/admin/`

## Estructura del Proyecto

```
Oftalmologia-Si2/
├── backend/          # Django + DRF (API REST)
├── frontend/         # Next.js (Panel web administrativo)
├── mobile/           # Flutter (App móvil)
├── infra/            # Dockerfiles y scripts
├── docs/             # Documentación
├── docker-compose.yml
├── .env.example
└── README.md
```

**Más documentación:** índice y onboarding para nuevos devs en [`docs/README.md`](docs/README.md) (incluye enlaces a `docs/ai/*` y guías de despliegue).

## Desarrollo

```bash
# Levantar todos los servicios
docker compose up

# Levantar solo el backend
docker compose up backend db

# Ver logs
docker compose logs -f backend

# Parar servicios
docker compose down

# Reconstruir después de cambios en requirements/packages
docker compose up -d --build
```

## Comandos Esenciales Backend (Django + Docker)

```bash
# Crear nuevas migraciones
docker compose exec backend python manage.py makemigrations

# Aplicar migraciones de forma segura (usa advisory lock de PostgreSQL → nunca dos procesos en paralelo)
# El entrypoint del contenedor también lo usa, así que es seguro correrlo en cualquier momento.
docker compose exec backend python manage.py migrate

# ⚠️  NO uses `python manage.py migrate` directamente después de `docker compose up -d`.
#     El entrypoint YA aplica las migraciones con migrate_safe al arrancar.
#     Si lo corres manual mientras el entrypoint todavía trabaja obtendrás un error de pg_catalog.
#     Usa siempre migrate_safe si necesitas correr migraciones a mano.

# Ver estado de migraciones
docker compose exec backend python manage.py showmigrations

# Poblar base de datos inicial (admin, roles, etc.)
docker-compose exec backend python manage.py seed
docker compose exec backend python manage.py seed --only admin  # Solo admin

# Abrir shell de Django
docker compose exec backend python manage.py shell

# Correr tests
docker compose exec backend python manage.py test

# Recolectar archivos estáticos (entorno tipo producción)
docker compose exec backend python manage.py collectstatic --noinput
```

## Comandos Esenciales Mobile (Flutter)

```bash
# Ir al módulo mobile
cd mobile

# Verificar instalación y entorno Flutter/Android
flutter doctor -v

# Descargar dependencias
flutter pub get

# Ejecutar análisis estático
flutter analyze

# Formatear código Dart
dart format lib

# Ver dispositivos disponibles
flutter devices

# Ejecutar app en modo debug
flutter run

# Limpiar build y cache local del proyecto
flutter clean
```

### Build (compilación)

```bash
# Android APK (debug/release)
flutter build apk --debug
flutter build apk --release

# Android App Bundle (Play Store)
flutter build appbundle --release

# Web
flutter build web

# Windows Desktop (si está habilitado)
flutter build windows

# iOS (solo en macOS)
flutter build ios --release
```

### Comando recomendado para actualizar dependencias

```bash
# Ver paquetes desactualizados
flutter pub outdated
```

## Licencia

Proyecto académico — Uso educativo.
