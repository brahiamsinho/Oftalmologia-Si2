# Sesión 2026-05-30 — CU18–CU22: Implementación Mobile (Flutter)

## Resumen

Se implementaron las pantallas y lógica de negocio mobile para CU18-CU21 en Flutter,
siguiendo la arquitectura feature-driven con Riverpod existente en el proyecto.

## Archivos creados

### Feature `administracion_financiera/` (nueva)

```
mobile/lib/features/administracion_financiera/
  domain/
    seguro_cobertura.dart     → AfiliacionSeguro, SeguroClinica (CU19)
    descuento_beneficio.dart  → BeneficioPaciente, PromocionDescuento (CU20)
    factura_resumen.dart      → FacturaResumen, EstadoFactura (CU21)
  data/
    seguros_repository.dart   → GET /seguros/afiliaciones/
    descuentos_repository.dart → GET /descuentos/beneficios/, /descuentos/promociones/
    facturacion_repository.dart → GET /facturacion/facturas/, comprobante, iniciar-pago-en-linea
  presentation/
    providers/finanzas_providers.dart → AsyncNotifierProviders: misAfiliaciones, misBeneficios, misFacturas
    screens/
      mis_seguros_screen.dart   → CU19 paciente: cobertura + barra de saldo
      mis_descuentos_screen.dart → CU20 paciente: beneficios con chips de estado
      mis_facturas_screen.dart  → CU21 paciente: filtros, pago en línea, comprobante
```

### Feature `notificaciones/` (extendida)

```
mobile/lib/features/notificaciones/presentation/screens/
  recordatorios_admin_screen.dart → CU18 staff: tabs Reglas (toggle activa) + Tareas (procesar lote)
```

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `patient_quick_access_row.dart` | Nueva sección "Mis finanzas" con 3 tiles: Facturas, Seguro, Descuentos |
| `home_screen.dart` | Sección "Administración" en `_StaffProfileTab` → Recordatorios y Facturación |

## Patrón seguido (consistente con proyecto)

- **Repositorios**: `({Dio? dio}) : _dio = dio ?? ApiClient().dio` + Provider
- **Estado**: `AsyncNotifierProvider` para listas, `ConsumerStatefulWidget` para pantallas con operaciones
- **Navegación**: `Navigator.push(MaterialPageRoute)` — no GoRouter (igual que notificaciones y clínico)
- **Theming**: `AppTheme.*` tokens (colores, espaciado, tipografía)
- **Error/vacío**: Widgets inline inline con `OutlinedButton` de reintentar

## Estado CU18–CU22 en mobile al cerrar sesión

| CU | Feature | Mobile |
|----|---------|--------|
| CU18 Recordatorios | Notificaciones push (FCM) | ✅ Ya existía |
| CU18 Recordatorios | Admin de reglas y tareas | ✅ Nuevo: `RecordatoriosAdminScreen` |
| CU19 Seguros | Cobertura del paciente | ✅ Nuevo: `MisSegurosScreen` |
| CU20 Descuentos | Beneficios del paciente | ✅ Nuevo: `MisDescuentosScreen` |
| CU21 Facturación | Facturas + pago en línea | ✅ Nuevo: `MisFacturasScreen` |
| CU22 Reportes | SmartReports staff | ✅ Ya existía (parcial) |

## Acceso en UI

**Paciente** → PatientHomeScreen → sección "Mis finanzas" → tiles Facturas / Seguro / Descuentos

**Staff/Admin** → HomeScreen → tab Perfil → sección "Administración" → Recordatorios / Facturación
