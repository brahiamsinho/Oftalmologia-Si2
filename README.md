# 🏥 Oftalmología Si2

Sistema integral SaaS multi-tenant para clínicas oftalmológicas — gestión de pacientes, citas, exámenes, historias clínicas, backups y más.

## Stack Tecnológico

| Capa          | Tecnología              | Puerto Dev |
| ------------- | ----------------------- | ---------- |
| Backend       | Django 5 + DRF + django-tenants | :8000 |
| Frontend      | Next.js 14 (App Router) | :3000      |
| Mobile        | Flutter                 | —          |
| Base de Datos | PostgreSQL 16 (multi-schema) | :5432 |
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
docker compose up --build

# 4. Migraciones: al iniciar, el servicio `backend` ejecuta `python manage.py migrate --noinput` (ver `backend/entrypoint.sh`). Si agregaste modelos en tu copia del repo, generá migraciones en el host y volvé a levantar: `docker compose exec backend python manage.py makemigrations`.

# 5. Poblar base de datos (crea superusuario 'admin', roles, permisos, tipos de cita y tenant demo)
docker compose exec backend python manage.py seed
```

## Acceso

Con los valores por defecto de `.env.example` (puertos 3000 y 8000):

- **Frontend:** `http://localhost:3000` (o `http://TU_IP:HOST_PORT_FRONTEND`)
<<<<<<< HEAD
- **Frontend superadmin SaaS:** `http://localhost:3000/platform/login` — el usuario se crea con el seeder `seed_platform_admin` (en el entrypoint de Docker, schema `public`) o con `python manage.py ensure_platform_admin` si definís `PLATFORM_ADMIN_EMAIL` y `PLATFORM_ADMIN_PASSWORD` en `.env`. **En `DEBUG=True` sin variables**, el seeder usa credenciales solo desarrollo: `platform@oftalmologia.local` / `platform123` (cambialas en producción vía `.env`).
- **Backend API (público):** `http://localhost:8000/api/`
- **Login plataforma (API):** `POST http://localhost:8000/api/public/platform/auth/login/`
=======
- **Backend API (público):** `http://localhost:8000/api/`
>>>>>>> a1b3cfbc7f09b37d0c5426a9fdcc486986b4f915
- **Backend API (tenant):** `http://localhost:8000/t/clinica-demo/api/`
- **Django Admin:** `http://localhost:8000/admin/`

## Arquitectura Multi-Tenant

Este sistema usa **django-tenants** con aislamiento por **schema PostgreSQL**. Cada clínica tiene su propio schema con tablas independientes.

### Cómo funciona

```
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL                               │
├─────────────────────────────────────────────────────────────┤
│  Schema: public (compartido)                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  tenant_tenants (lista de clínicas)                  │  │
│  │  tenant_domains                                       │  │
│  │  subscription_plans (FREE/PLUS/PRO)                   │  │
│  │  tenant_subscriptions                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Schema: clinica_demo (tenant 1)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  pacientes, citas, consultas, cirugias, bitacora...  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Schema: clinica_norte (tenant 2)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  pacientes, citas, consultas, cirugias, bitacora...  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Routing por Subfolder

Las URLs de tenant usan el prefijo `/t/<slug>/`:

```
http://localhost:8000/t/clinica-demo/api/pacientes/
http://localhost:8000/t/clinica-norte/api/citas/
```

El middleware `TenantSubfolderMiddleware` detecta el slug y cambia al schema correcto automáticamente.

## Estructura del Proyecto

```
Oftalmologia-Si2/
├── backend/          # Django + DRF (API REST multi-tenant)
│   ├── apps/
│   │   ├── tenant/         # Gestión de tenants y planes
│   │   ├── backup/         # Sistema de backup/restore
│   │   ├── pacientes/      # Módulo pacientes
│   │   ├── atencionClinica/ # Citas, consultas, cirugías
│   │   ├── bitacora/       # Auditoría y trazabilidad
│   │   └── ...
│   └── config/
│       ├── settings.py     # SHARED_APPS + TENANT_APPS
│       └── urls.py
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
docker compose exec backend python manage.py seed
docker compose exec backend python manage.py seed --only admin  # Solo admin

# Abrir shell de Django
docker compose exec backend python manage.py shell

# Correr tests
docker compose exec backend python manage.py test

# Recolectar archivos estáticos (entorno tipo producción)
docker compose exec backend python manage.py collectstatic --noinput
```

## Comandos Multi-Tenant

```bash
# Listar todos los tenants
docker compose exec backend python manage.py list_tenants

# Crear un nuevo tenant manualmente
docker compose exec backend python manage.py create_tenant \
  --schema_name=clinica_norte \
  --slug=clinica-norte \
  --nombre="Clínica Norte" \
  --email=admin@clinicanorte.com

# Ejecutar comando en un tenant específico
docker compose exec backend python manage.py tenant_command <comando> --schema=clinica_demo

# Ejecutar migraciones solo en un tenant
docker compose exec backend python manage.py migrate --schema=clinica_demo

# Eliminar un tenant (¡CUIDADO! Borra el schema completo)
docker compose exec backend python manage.py delete_tenant --schema=clinica_norte
```

## Sistema de Backup/Restore

Cada tenant puede crear backups manuales y automáticos con límites según su plan.

### Límites por Plan

| Plan | Backups Manuales | Retención | Restore | Automático |
|------|------------------|-----------|---------|------------|
| FREE | 0 | 0 días | ❌ | ❌ |
| PLUS | 5/semana | 30 días | ✅ | ✅ |
| PRO | Ilimitado | 90 días | ✅ | ✅ |

### Comandos de Backup

```bash
# Ejecutar backups automáticos (según configuración de cada tenant)
docker compose exec backend python manage.py backup_automatico

# Forzar backup para todos los tenants
docker compose exec backend python manage.py backup_automatico --force

# Backup solo para un tenant específico
docker compose exec backend python manage.py backup_automatico --tenant-slug clinica-demo

# Ver logs del scheduler de backups
docker compose logs -f backup-scheduler
```

### API de Backup (ejemplos con curl)

```bash
# Crear backup manual
curl -X POST http://localhost:8000/t/clinica-demo/api/backup/ \
  -H "Authorization: Bearer <token>"

# Listar backups
curl http://localhost:8000/t/clinica-demo/api/backup/ \
  -H "Authorization: Bearer <token>"

# Restaurar backup (requiere confirmación explícita)
curl -X POST http://localhost:8000/t/clinica-demo/api/backup/1/restore/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"confirmar": true, "motivo": "Recuperación después de error"}'

# Descargar backup
curl http://localhost:8000/t/clinica-demo/api/backup/1/download/ \
  -H "Authorization: Bearer <token>" \
  -o backup_1.sql.gz

# Ver configuración de backup automático
curl http://localhost:8000/t/clinica-demo/api/backup-config/ \
  -H "Authorization: Bearer <token>"

# Actualizar configuración (hora, frecuencia, retención)
curl -X PATCH http://localhost:8000/t/clinica-demo/api/backup-config/1/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"hora_backup": "04:00:00", "retencion_dias": 14}'
```

Documentación completa: [`docs/api/backup.md`](docs/api/backup.md)

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

docker compose down -v --rmi all
