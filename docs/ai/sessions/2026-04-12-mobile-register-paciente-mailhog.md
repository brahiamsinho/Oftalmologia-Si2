# Sesión 2026-04-12 — Registro móvil solo paciente + Mailhog

## Cambios
- **Flutter** `RegisterScreen`: eliminado selector “Tipo de cuenta”; siempre se envía `tipo_usuario: PACIENTE`; quitados campos de médico/especialista; `telefono` solo se envía si no está vacío; texto Mailhog aclara UI vs SMTP del backend; `DropdownButtonFormField` con `initialValue` + `ValueKey` (deprecación `value`).
- **`AppConfig.mailhogWebUrl`:** soporte opcional `MAILHOG_INFER_FROM_API=true` para derivar la URL de la UI desde el host de `API_BASE_URL` y `MAILHOG_UI_PORT` (default 8025).
- **Backend** `RegisterView`: el payload de registro público fuerza `tipo_usuario = PACIENTE` (coherencia con móvil y cierre del endpoint público a otros roles).

## Mailhog
- **Recepción del correo:** la app móvil no habla con Mailhog por SMTP; lo hace Django (`EMAIL_HOST`/`EMAIL_PORT` en Docker, típico `mailhog:1025`).
- **Ver el mensaje:** la app puede abrir la UI web (`8025`) si configurás `MAILHOG_WEB_URL` o inferencia desde la misma IP que el API.
