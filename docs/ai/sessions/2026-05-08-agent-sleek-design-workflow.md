# Sesion: Sleek workflow para diseno mobile

Fecha: 2026-05-08
Agente: orchestrator (OpenCode)

## Objetivo
Implementar workflow reutilizable para diseno mobile con Sleek API, alineado a flujo del proyecto (UI/UX paciente) y memoria viva en `docs/ai/`.

## Cambios realizados
1. Se creo comando `.opencode/commands/sleek-design.md`.
2. Se registro comando en `.opencode/README.md`.
3. Se actualizo `docs/ai/PROMPTS_LIBRARY.md` con uso del nuevo comando.
4. Se actualizo `docs/ai/SKILLS_REGISTRY.md` agregando skill de workspace `sleek-design-mobile-apps`.
5. Se actualizo memoria operativa:
   - `docs/ai/CURRENT_STATE.md`
   - `docs/ai/HANDOFF_LATEST.md`
   - `docs/ai/NEXT_STEPS.md`

## Reglas clave del workflow
- Host unico: `https://sleek.design`.
- Auth obligatoria: `Authorization: Bearer $SLEEK_API_KEY`.
- No leer ni exponer `.env` reales.
- Polling run: 2s inicial, 5s despues de 10s, timeout 5 min.
- Entrega obligatoria de screenshots tras `screen_created`/`screen_updated`.
- Si usuario pide implementacion, fetch de HTML por `componentId` y guardado en archivos.

## Riesgos y mitigaciones
- Riesgo: key invalida o scopes insuficientes (`401/403`).
  - Mitigacion: validar key/scopes antes de correr flujo.
- Riesgo: run activo en proyecto (`409 CONFLICT`).
  - Mitigacion: esperar run actual y repollar antes de nuevo mensaje.
- Riesgo: fuga de datos por `imageUrls`.
  - Mitigacion: aceptar solo HTTPS y evitar URLs privadas/sensibles.

## Siguiente paso sugerido
Ejecutar `/sleek-design` para primer lote de pantallas paciente (Home, Citas, Historial), guardar screenshots en carpeta de proyecto y luego pasar a implementacion Flutter guiada por HTML + visual target.
