# Sesión 2026-05-28 - seeders más realistas (demo + reportes)

## Objetivo
Mejorar calidad de datos seed para demos funcionales y análisis/reportes con payloads más cercanos a operación clínica real.

## Cambios aplicados

### 1) `seed_demo_paciente.py`
- Se añadieron 3 médicos (antes 2) con subespecialidades:
  - Oftalmología general
  - Retina y vítreo
  - Glaucoma
- Paciente demo enriquecido con:
  - tipo documento, sexo, dirección,
  - contacto de emergencia,
  - observaciones generales.
- Citas demo:
  - subieron a 3 citas futuras (antes 2),
  - motivos clínicos más realistas,
  - observaciones de agenda más concretas.

### 2) `seed_reporting_6months.py`
- Dataset ampliado:
  - 8 pacientes por mes x 6 meses = 48 pacientes,
  - 3 citas por paciente (histórico más denso).
- Datos más realistas:
  - nombres/apellidos reales (lista determinística),
  - sexo, fecha de nacimiento, dirección, teléfono y notas.
- Variabilidad funcional:
  - motivos de consulta y observaciones clínicas en rotación,
  - distribución de estados de cita más parecida a operación real.
- Fix crítico de idempotencia:
  - `numero_historia` deja de usar secuencial global frágil,
  - se usa formato determinístico `HC-RPT6M-<token_doc>` para evitar colisiones.

## Verificación

Comandos ejecutados:

```bash
docker compose exec backend python manage.py seed --tenant clinica-demo --only demo_paciente
docker compose exec backend python manage.py seed --tenant clinica-demo --only reporting_6months
```

Resultados:
- `demo_paciente`: OK.
- `reporting_6months`: OK (`174 creados, 18 existentes`).

## Nota técnica
Durante validación apareció `IntegrityError` por colisión de `numero_historia` en el seeder histórico; se resolvió en esta misma sesión con el esquema determinístico descrito arriba.
