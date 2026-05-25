# Sesión 2026-05-23 — CU21 facturación clínica (backend)

## Objetivo

Implementar CU21 del documento PUDS (facturación/cobros clínicos), integrando CU19 seguros y CU20 descuentos, sin frontend.

## App `apps.facturacion`

| Modelo | Tabla | Rol |
|--------|-------|-----|
| CatalogoServicioClinico | facturacion_catalogo_servicios | Tarifario (consulta, estudio, cirugía, control) |
| FacturaClinica | facturacion_facturas | Comprobante con montos calculados |
| CobroClinico | facturacion_cobros | Pagos aplicados a factura |

## Flujo de cálculo (pasos 5–8 del CU21)

1. `monto_base` ← precio del servicio (o servicio derivado de `id_cita`).
2. Cobertura ← `verificar_cobertura_paciente` (CU19).
3. `monto_subtotal_paciente` = base − cobertura aseguradora + copago.
4. Descuento ← mejor promoción aplicable o `promocion_id` (CU20).
5. `monto_total` / `saldo_pendiente`.

## API

| Método | Ruta |
|--------|------|
| CRUD | `/api/facturacion/servicios/` |
| GET/POST | `/api/facturacion/facturas/` (list/detail; create/update bloqueados) |
| POST | `/api/facturacion/facturas/preview/` |
| POST | `/api/facturacion/facturas/emitir/` |
| POST | `/api/facturacion/facturas/{id}/registrar-cobro/` |
| POST | `/api/facturacion/facturas/{id}/anular/` |
| GET | `/api/facturacion/cobros/` |

## Seed

`python manage.py seed --tenant clinica-demo --only facturacion`

Tarifas: CONS-GEN, EST-RET, CIR-CAT, CTRL-POST.

## Probar (curl / Postman, con JWT tenant)

```json
POST /api/facturacion/facturas/preview/
{
  "paciente_id": 1,
  "id_servicio": 1
}
```

```json
POST /api/facturacion/facturas/emitir/
{
  "paciente_id": 1,
  "id_cita": 5
}
```

## Notas

- `metodo_pago=EN_LINEA` + `referencia_pasarela` preparado; sin integración Stripe clínica aún.
- Tras `migrate_schemas`, si falla seed en un tenant: `migrate_schemas facturacion zero --schema=clinica_demo` y volver a migrar.

## Cierre backend CU20 (2026-05-23)

- Pasarela mock + `confirmar-pasarela` + `PASARELA_MOCK_SECRET`
- PDF `comprobante`, notificaciones push, `mis-pendientes`, `citas/.../resumen-facturacion/`
- Tests `test_cu20_facturacion.py` (3 casos, tenant)

## Pendiente

- UI web `/facturacion`, pasarela real producción, mobile.
