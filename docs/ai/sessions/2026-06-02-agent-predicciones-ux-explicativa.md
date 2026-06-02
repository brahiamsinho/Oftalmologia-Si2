# Sesión 2026-06-02 — UX explicativa en Reportes Predictivos

## Solicitud

Usuario no entiende qué muestra la pantalla de predicciones de plataforma y solicita implementarlo para que quede claro.

## Objetivo aplicado

Mejorar comprensión para perfil no técnico sin perder trazabilidad técnica del modelo.

## Cambios realizados

- Archivo: `frontend/src/app/platform/dashboard/predicciones/page.tsx`
- Se agregó bloque explicativo en pestaña **Predicciones**:
  - qué predice (`riesgo operativo por clínica/tenant`);
  - qué representa la probabilidad (`confianza del modelo`).
- Se añadió helper `recomendacionRiesgo(...)` con mensaje accionable por fila.
- Se agregó columna **Acción sugerida** en tabla de predicciones.
- Se añadió `title` en cabecera de probabilidad para aclaración rápida.

## Resultado UX

- El usuario puede leer la pantalla en clave de negocio:
  - clasificación de riesgo;
  - nivel de confianza;
  - acción recomendada inmediata.

## Validación

- `npm run build` en frontend: OK.
- Warnings existentes de otros módulos se mantienen, sin bloquear build.
