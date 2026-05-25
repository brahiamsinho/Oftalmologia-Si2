# Sesión 2026-05-23 — CU19 Seguros y convenios (backend)

## Objetivo

Implementar **CU19** — gestión de aseguradoras, convenios y afiliación de pacientes (solo backend).

## Recordatorio — CU18 pendiente (no olvidar)

| Pendiente CU18 | Descripción |
|----------------|-------------|
| Cron Docker | Servicio que ejecute `procesar_recordatorios` periódicamente |
| UI web | Pantallas reglas / tareas / logs de recordatorios |
| Tests | Fixtures con `tenant_context` / schema válido en pytest |

## Implementado CU19

### App `apps.seguros`

| Modelo | Tabla | Rol |
|--------|-------|-----|
| `Aseguradora` | `seguros_aseguradoras` | Compañía aseguradora |
| `Convenio` | `seguros_convenios` | Acuerdo cobertura % + copago |
| `AfiliacionSeguroPaciente` | `seguros_afiliaciones_paciente` | Paciente ↔ convenio + Nº afiliado |

### API (`/t/<slug>/api/seguros/`)

- `GET/POST/PATCH/DELETE …/aseguradoras/`
- `GET/POST/PATCH/DELETE …/convenios/`
- `GET/POST/PATCH/DELETE …/afiliaciones/`
- `GET …/convenios/verificar-cobertura/?paciente_id=1&fecha=YYYY-MM-DD`

### Servicio

- `verificar_cobertura_paciente()` — cobertura principal vigente

### Seeder

- `seed_seguros` — NSS + MediCorp con convenios demo
- `manage.py seed --tenant clinica-demo --only seguros`

### Tests

- `apps/seguros/tests/test_seguros.py` — cobertura, validación fechas

## Validación manual

```bash
python manage.py migrate_schemas
python manage.py seed --tenant clinica-demo --only seguros
# GET /t/clinica-demo/api/seguros/aseguradoras/
# POST afiliación + GET verificar-cobertura?paciente_id=
```

## Próximo paso sugerido

- UI web administración seguros (CU19 frontend)
- Vincular cobertura al flujo de citas/facturación (CU21 doc) cuando exista
