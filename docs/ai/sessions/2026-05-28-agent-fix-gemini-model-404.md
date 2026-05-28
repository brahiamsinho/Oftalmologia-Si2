# Sesión: fix Gemini 404 en reportes inteligentes

**Fecha:** 2026-05-28

## Problema

`POST /t/clinica-demo/api/ia/nlp-to-report/` → 503. Logs:

```
404 models/gemini-1.5-flash is not found for API version v1beta
```

UI mostraba mensaje de cuota aunque el error real era modelo retirado.

## Cambios

- `nlp_translator.py`: default `gemini-2.5-flash`, alias 1.5/2.0 → 2.5, fallbacks en cadena, mensajes 404 antes que 429.
- `settings.py`, `.env`, `.env.example`: `GEMINI_MODEL=gemini-2.5-flash`
- Recreate backend container para cargar env.

## Validación

`docker compose exec backend python -c "... GeminiQBETranslator ..."` → OK.

## Usuario

Recargar `/reportes` y repetir consulta. Si 429: esperar o revisar cuota en AI Studio.
