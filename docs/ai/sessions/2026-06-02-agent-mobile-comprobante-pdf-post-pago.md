## Session: Mobile comprobante PDF post-pago

### Objetivo

Mostrar comprobante en formato PDF en mobile tras pagar, en lugar de solo texto plano.

### Implementación

1. `mobile/lib/features/administracion_financiera/data/facturacion_repository.dart`
- Nuevo método `fetchComprobantePdf(idFactura)`:
  - `GET facturacion/facturas/<id>/comprobante/`
  - `ResponseType.bytes`
  - header `Accept: application/pdf`

2. `mobile/lib/features/administracion_financiera/presentation/screens/mis_facturas_screen.dart`
- `_verComprobante(...)`:
  - descarga bytes PDF autenticados,
  - guarda archivo temporal (`path_provider`),
  - abre el `.pdf` con `url_launcher` (app externa),
  - fallback a comprobante texto si no hay visor PDF.
- `_pagarEnLinea(...)`:
  - en flujo mock (`confirmar-pago-mock`), luego de confirmar pago abre automáticamente el comprobante.

### Validación

- `flutter analyze` sobre archivos modificados -> sin issues.

### Resultado UX

- Usuario paciente puede ver comprobante PDF inmediatamente tras pago demo y también desde botón "Ver comprobante" en facturas pagadas.
