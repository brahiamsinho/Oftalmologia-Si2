# Oftalmología Si2 — Documentación

## Estructura de Documentación

```
docs/
├── architecture/       # Diagramas y decisiones de arquitectura
├── api/               # Documentación de endpoints
├── guides/            # Guías de desarrollo
└── README.md          # Este archivo
```

## Convenciones del Proyecto

### Git

- Commits descriptivos en español o inglés
- Ramas: `main`, `develop`, `feature/*`, `bugfix/*`, `hotfix/*`

### Código

- **Python:** PEP 8, docstrings en español
- **TypeScript:** ESLint + Prettier
- **Dart:** Effective Dart guidelines

### Base de Datos

- Tablas en `snake_case`
- Todas las entidades con `created_at`, `updated_at`
- UUIDs como PK para entidades principales
- Nunca editar migraciones ya aplicadas

### Comandos de Base de Datos y Backend

El proyecto usa contenedores Docker. Para realizar cambios en la estructura de la base de datos o poblarla con datos iniciales (seeders):

```bash
# 1. Generar migraciones (después de cambiar models.py)
docker-compose exec backend python manage.py makemigrations

# 2. Aplicar migraciones a la BD
docker-compose exec backend python manage.py migrate

# 3. Poblar datos iniciales obligatorios (Roles, Permisos, Tipos Cita y Superusuario Admin)
docker-compose exec backend python manage.py seed
```

> **Nota:** El comando `seed` es seguro e idempotente, lo que significa que se puede ejecutar varias veces sin crear duplicados.

## Guía Rápida de Comandos Flutter (Mobile)

Ejecutar desde la carpeta `mobile/`.

```bash
# Diagnóstico del entorno
flutter doctor -v

# Instalar dependencias
flutter pub get

# Verificar calidad de código
flutter analyze

# Ejecutar en debug
flutter run

# Compilar Android APK release
flutter build apk --release

# Compilar Android App Bundle (Play Store)
flutter build appbundle --release
```

Comandos útiles adicionales:

```bash
flutter devices
flutter clean
flutter pub outdated
dart format lib
```
