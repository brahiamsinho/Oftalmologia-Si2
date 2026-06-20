# Sesión 2026-06-02 — Debug mobile facturas + push token FCM

## Incidencias reportadas

1. En mobile paciente, pantalla **Mis Facturas** falla con:
   - `type 'String' is not a subtype of type 'num?' in type cast`.
2. Push aparentemente no llega al dispositivo (aunque notificaciones sí aparecen en listado interno).

## Cambios aplicados

- Archivo: `mobile/lib/features/administracion_financiera/domain/factura_resumen.dart`
  - Se agregó `_asDouble(dynamic)` para parsear montos desde `num | string | null`.
  - Se eliminó cast directo `(as num?)` que causaba crash cuando API devolvía string decimal.
  - Se amplió mapeo de estado:
    - `EMITIDA`, `PAGADA_PARCIAL`, `BORRADOR` -> estado visual `pendiente`.

- Archivo: `mobile/lib/core/notifications/push_notifications.dart`
  - `_getToken()` ahora intenta obtener token FCM hasta 3 veces con backoff corto.
  - Reduce casos donde login sale “sin FCM token” por carrera de inicialización en app startup.

## Evidencia de diagnóstico push

En logs backend durante login:
- `[login] Sin FCM token en el request → push solo en BD (usuario_id=...)`

Conclusión:
- La notificación se registra en BD (visible en `GET /notificaciones/`).
- No hay envío FCM al dispositivo porque el backend no recibe token en login.

## Próximo paso recomendado

- Verificar en dispositivo Android:
  - permisos de notificación de la app (Android 13+),
  - disponibilidad de Google Play Services,
  - valor real del token FCM en startup/login (log debug de mobile).

## Actualización posterior (misma sesión)

- Se corrigió apertura de pasarela en mobile:
  - `facturacion_repository.dart` ahora convierte `checkout_url` relativa a URL absoluta con el host API configurado.
- Se corrigió backend de pasarela para reintentos:
  - `iniciar_pago_en_linea` reutiliza cobro pendiente existente (idempotente) y retorna misma referencia en vez de error.
- Se mejoró feedback en mobile:
  - parsea `detail`/`non_field_errors` de API para mostrar causa real de fallo.
- Se confirmó bloqueo estructural para push:
  - `mobile/android/app/google-services.json` contiene placeholders (`tu-project-id`, `TU_API_KEY_AQUI`), por lo que FCM Android no está configurado contra un proyecto real.
