## Goal
Exponer en web y mobile los documentos clínicos autorizados de CU26 para descarga y compartido.

## Instructions
- Reutilizar los puntos de historial clínico existentes.
- Mantener acceso tenant-aware y sin duplicar lógica de backend.

## Discoveries
- El mejor punto web era el modal de detalle del historial clínico.
- En mobile ya existía una pantalla clínica con tabs, así que un tercer tab `Documentos` encajó naturalmente.
- El backend CU26 ya devolvía documentos autorizados y PDFs, así que la UI solo necesitaba consumirlos.

## Accomplished
- ✅ Web: la sección `Recetas` del modal de historial ahora lista documentos y permite descargar el PDF.
- ✅ Mobile: se agregó el tab `Documentos` para listar y compartir documentos autorizados.
- ✅ Se añadió el servicio `downloadDocumento` en frontend y la carga/listado en mobile.

## Next Steps
- Validar manualmente en el dispositivo móvil el flujo de compartir PDF.
- Si hace falta, agregar estado visual de error al botón de descarga del web modal.

## Relevant Files
- frontend/src/app/(dashboard)/(gestion-pacientes)/historial/page.tsx — listado/descarga web.
- frontend/src/lib/services/historial.ts — contrato de documentos y descarga.
- mobile/lib/features/home/presentation/screens/patient_clinical_screen.dart — tab `Documentos`.
- mobile/lib/features/home/data/clinical_repository.dart — endpoints de documentos y descarga.
