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

## Setup Rápido

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd Oftalmologia-Si2

# 2. Copiar y configurar variables de entorno
cp .env.example .env
# Edita .env con tus valores reales (especialmente contraseñas y secret key)

# 3. Construir y levantar los contenedores
docker-compose up --build

# 4. Generar y aplicar migraciones (primera vez o al modificar modelos)
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# 5. Poblar base de datos (crea superusuario 'admin', roles, permisos y tipos de cita)
docker-compose exec backend python manage.py seed
```

## Acceso

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api/v1/
- **Django Admin:** http://localhost:8000/admin/

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

## Desarrollo

```bash
# Levantar todos los servicios
docker-compose up

# Levantar solo el backend
docker-compose up backend db

# Ver logs
docker-compose logs -f backend

# Parar servicios
docker-compose down

# Reconstruir después de cambios en requirements/packages
docker-compose up --build
```

## Comandos Esenciales Backend (Django + Docker)

```bash
# Crear nuevas migraciones
docker-compose exec backend python manage.py makemigrations

# Aplicar migraciones
docker-compose exec backend python manage.py migrate

# Ver estado de migraciones
docker-compose exec backend python manage.py showmigrations

# Poblar base de datos inicial (admin, roles, etc.)
docker-compose exec backend python manage.py seed
docker-compose exec backend python manage.py seed --only admin  # Solo admin

# Abrir shell de Django
docker-compose exec backend python manage.py shell

# Correr tests
docker-compose exec backend python manage.py test

# Recolectar archivos estáticos (entorno tipo producción)
docker-compose exec backend python manage.py collectstatic --noinput
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
