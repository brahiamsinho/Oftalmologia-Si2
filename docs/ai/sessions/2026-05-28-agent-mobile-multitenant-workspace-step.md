# Sesión 2026-05-28 - mobile multi-tenant runtime (workspace step)

## Objetivo
Implementar en mobile un flujo de tenant dinámico: primero elegir clínica (slug), luego autenticar.

## Implementación

- Nuevo estado de sesión en routing:
  - `needsTenant`
  - `unauthenticated`
  - `authenticated`
- Nueva ruta/pantalla:
  - `/workspace` -> `TenantWorkspaceScreen`
- En `TenantWorkspaceScreen`:
  - usuario ingresa slug,
  - app consulta `GET /api/public/tenants/<slug>/`,
  - si válido, guarda tenant y redirige a login.
- Persistencia de tenant:
  - `SecureStorageService.saveTenantSlug/getTenantSlug/clearTenantSlug`.
- Config runtime tenant:
  - `AppConfig.setRuntimeTenantSlug(...)`.
- `ApiClient.reset()`:
  - fuerza reconstrucción de `Dio` al cambiar tenant para evitar base URL stale.
- Login:
  - muestra clínica activa (`tenant_slug`) y acción “Cambiar” que limpia tenant+tokens y vuelve a `/workspace`.

## Archivos tocados

- `mobile/lib/core/storage/secure_storage.dart`
- `mobile/lib/config/app_config.dart`
- `mobile/lib/core/network/api_client.dart`
- `mobile/lib/config/auth_listenable.dart`
- `mobile/lib/features/auth/data/auth_repository.dart`
- `mobile/lib/features/auth/presentation/providers/session_notifier.dart`
- `mobile/lib/features/auth/presentation/screens/tenant_workspace_screen.dart` (nuevo)
- `mobile/lib/features/auth/presentation/screens/mobile_login_screen.dart`
- `mobile/lib/config/routes.dart`

## Verificación

- Lints IDE en archivos modificados: sin errores.
- En este entorno no fue posible correr `flutter analyze` (`flutter` no está en PATH).

## Pendiente recomendado

- Mejorar UX del paso workspace mostrando branding de tenant (logo/color) y lista de clínicas recientes.
