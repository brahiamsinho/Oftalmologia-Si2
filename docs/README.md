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
