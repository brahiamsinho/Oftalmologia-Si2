# TECH STACK

## Stack Tecnológico Oficial

### Backend
- **Framework:** Django 5+
- **API:** Django REST Framework (DRF)
- **Base de Datos:** PostgreSQL
- **Multi-tenant:** `django-tenants` (schema-per-tenant); migraciones con `migrate_schemas --shared` / `--tenant`.
- **Autenticación:** JWT vía `djangorestframework-simplejwt`;claims `token_scope` para separar **tokens de clínica** (`tenant`) y **tokens de plataforma** (`platform`) — ver `docs/ai/PLATFORM_SAAS.md`.

### Frontend Web
- **Framework:** Next.js (App Router)
- **Librería UI/UX:** React, con foco en sistemas de diseño responsivos y accesibles.

### Mobile
- **Tecnología:** Flutter
- **Lenguaje:** Dart
- **Cliente HTTP y Tokens:** Dio y `flutter_secure_storage`
- **Gestión de Estado:** Riverpod/Provider/BLoC (Según convención futura a fijar).

### Infraestructura y Despliegue
- **Contenedores:** Docker + Docker Compose.
- **Entornos:** Todo el código debe estar adaptado para funcionar bajo variables de entorno dinámicas permitiendo fluidez entre tres ambientes: **Local / Docker Nativo / Servidores Nube (VM/Cloud/VPS)**.
- **DB Driver:** `psycopg2-binary` para conexión desde los workers Python al storage de Postgres.

### Convenciones Técnicas Importantes
- Coexistencia: Tanto el puerto 3000 (Web) como la app local o emulador móvil conviven llamando al puerto 8000/API usando routing/proxy local o localhost especial (`10.0.2.2` en Android Emulator).
- Diseño Seguro y UX Fluida: Las vistas web y mobile deben implementar siempre manejo de cargas (spinners) y captura de errores genéricos antes de enviarlos sin tratar al usuario.
