# Sesion 2026-05-28 — PWA frontend (Serwist)

## Objetivo

Habilitar Progressive Web App en el frontend Next.js para permitir instalación en escritorio/móvil y soporte offline básico.

## Implementación

- Paquetes: `@serwist/next`, `serwist`.
- `frontend/next.config.js`: wrapper `withSerwistInit` (SW deshabilitado en `development`).
- `frontend/src/app/sw.ts`: service worker con:
  - precache de assets estáticos,
  - `NetworkOnly` para rutas `/api/` (no cachear datos clínicos),
  - fallback offline en `/~offline`.
- `frontend/src/app/manifest.ts`: manifest dinámico (`manifest.webmanifest`).
- `frontend/src/app/~offline/page.tsx`: pantalla offline.
- `frontend/public/icons/icon.svg`: icono de app.
- `frontend/src/components/pwa/PwaInstallPrompt.tsx`: banner "Instalar app".
- `frontend/src/app/layout.tsx`: metadata PWA + `themeColor` + prompt global.

## Validación

- `next build` compila Serwist: `(serwist) Bundling the service worker script with the URL '/sw.js'`.
- Build global del frontend aún puede fallar por lints previos no relacionados (reportes/asistente).

## Uso

1. Levantar frontend en producción (`npm run build && npm run start`) o contenedor con build prod.
2. Abrir `http://localhost:3000` en Chrome/Edge.
3. Instalar desde banner o menú del navegador ("Instalar aplicación").

## Notas

- En `npm run dev` el SW está deshabilitado a propósito.
- Para iOS/Safari la instalación es manual: Compartir → "Agregar a inicio".
- Recomendado servir con HTTPS en producción para criterios completos de instalación.
