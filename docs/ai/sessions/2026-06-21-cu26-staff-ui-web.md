# Session 2026-06-21 — CU26 staff UI web

## Goal
Implementar la UI staff de CU26 dentro del modal de historial clínico web para crear borradores, autorizar documentos y descargar PDFs.

## Instructions
- Mantener el cambio dentro del modal existente de historial clínico.
- Reutilizar los endpoints tenant-aware de CU26 ya existentes.
- Conservar el estilo visual del dashboard y agregar estados mínimos de UX.

## Discoveries
- El backend ya expone el listado staff por historia, creación de borrador, autorización y descarga PDF, así que el frontend solo necesitaba un panel dedicado.
- La página de historial quedó más limpia al mover la lógica de CU26 a un componente reutilizable.
- `next build` sigue mostrando warnings preexistentes en otras páginas, pero no bloquean la compilación.

## Accomplished
- ✅ Agregado `DocumentosClinicosStaffPanel` con lista, formulario de borrador, autorización y descarga PDF.
- ✅ Actualizado `frontend/src/lib/services/historial.ts` con helpers de listado, creación y autorización.
- ✅ Integrado el panel dentro del modal de detalle del historial sin crear una ruta nueva.
- ✅ Actualizada la memoria viva en `docs/ai/` con el nuevo alcance de CU26.

## Next Steps
- Validar el flujo manual en el navegador con un caso real de historia clínica.
- Revisar si hace falta paginación o filtrado si una historia acumula muchos documentos.

## Relevant Files
- frontend/src/app/(dashboard)/(gestion-pacientes)/historial/page.tsx — integra el panel dentro del modal.
- frontend/src/app/(dashboard)/(gestion-pacientes)/historial/DocumentosClinicosStaffPanel.tsx — UI staff de CU26.
- frontend/src/lib/services/historial.ts — helpers de API para documentos clínicos.
