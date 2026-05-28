# Sesión: reportes mobile + fix voz web

**Fecha:** 2026-05-28

## Cambios

### Web
- `useSpeechToText`: dictado continuo, acumulación correcta de texto, mensajes de error (permiso micrófono).
- `reportes/page.tsx`: el input siempre usa `query`; al dictar se actualiza en vivo; al detener micrófono se guarda el texto.
- `AIAssistantBar`: aviso si voz no disponible o error.

### Mobile (Flutter)
- Nuevo módulo `lib/features/reportes/` (repository, provider, pantalla, voz, tabla, export).
- Pestaña **Reportes** en shell staff (`home_screen.dart`).
- `AppConfig`: `TENANT_SLUG` + resolución automática `.../api` → `.../t/<slug>/api/`.
- Dependencias: `speech_to_text`, `share_plus`, `path_provider`.
- Permiso `RECORD_AUDIO` en AndroidManifest.

## Config mobile

```env
API_BASE_URL=http://10.0.2.2:8000/api
TENANT_SLUG=clinica-demo
```

Luego: `flutter pub get` y reiniciar la app.

## Prueba

1. Staff login → pestaña Reportes.
2. Escribir o dictar: «pacientes ACTIVO en excel y pdf» → Generar.
3. Tabla + diálogo compartir/guardar archivos (Excel y PDF).
