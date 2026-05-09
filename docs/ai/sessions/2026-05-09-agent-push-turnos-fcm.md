# Sesion 2026-05-09 — Push turnos (FCM)

## Objetivo
Verificar si las notificaciones push para turnos ya estaban implementadas y cerrar cualquier faltante real.

## Hallazgos
- La infraestructura push ya existia:
  - Mobile: `firebase_core`, `firebase_messaging`, `flutter_local_notifications`, init en `main.dart`, listeners foreground/background, sync token al backend.
  - Backend: registro de dispositivos FCM (`/api/notificaciones/dispositivos/`), servicio `enviar_push_a_usuario(...)`, inicializacion Firebase Admin con `FIREBASE_CREDENTIALS_PATH`.
- Faltante funcional detectado:
  - En `procesar_tarea_recordatorio(...)` (automatizaciones CU17) solo se guardaba notificacion en BD y no se invocaba envio push FCM.

## Cambios aplicados
- Archivo modificado: `backend/apps/notificaciones/automatizaciones/serializers.py`
- Cambio:
  - Reemplazo de `Notificacion.objects.create(...)` por `enviar_push_a_usuario(...)`.
  - Se agrega payload push:
    - `tipo=recordatorio_control`
    - `postoperatorio_id`
    - `tarea_id`

## Resultado
- Recordatorios automaticos ahora:
  1) quedan en historial interno de notificaciones, y
  2) tambien se envian como push real si Firebase + tokens FCM estan disponibles.
- Fallback seguro: si Firebase no esta configurado, no rompe flujo y queda notificacion persistida.

## Pendientes operativos
- iOS push aun requiere archivo `mobile/ios/Runner/GoogleService-Info.plist` para soporte completo en iPhone.
