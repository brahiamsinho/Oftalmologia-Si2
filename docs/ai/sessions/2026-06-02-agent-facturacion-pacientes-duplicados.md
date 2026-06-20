# Sesión 2026-06-02 — Facturación pacientes “duplicados” vs usuarios paciente

## Contexto

El usuario reporta que en **Nueva Factura** aparecen muchos pacientes “duplicados” y que además no corresponden a usuarios tipo PACIENTE del módulo Usuarios.

## Cambios aplicados

1. **Seeder `reporting_6months` rediseñado**:
   - Ahora crea/actualiza **12 fichas clínicas únicas por tenant** (no nuevas por mes).
   - Usa documento estable por slot: `CODE-RPT-###`.
   - Mantiene citas históricas de 6 meses sobre esas mismas fichas.

2. **Limpieza de datos demo antiguos**:
   - Elimina legacy `RPT6M-*`.
   - Elimina fichas de analítica marcadas por `observaciones_generales` con tag de reportes.
   - Conserva paciente demo con cuenta móvil (`DEMO-BRANDON-001`).

3. **UX de selector en facturación**:
   - Regla final aplicada: **solo pacientes con cuenta app vinculada**.
   - Si existe un único paciente con cuenta (demo), queda auto-seleccionado.
   - Se evita mezclar en emisión fichas clínicas sin login.

## Decisión práctica

Se deja explícito en UI que:
- **Paciente (ficha clínica)** y
- **Usuario tipo PACIENTE (cuenta de app)**

son entidades relacionadas pero no equivalentes.

## Comando recomendado para aplicar limpieza en tenant demo

```bash
docker compose exec backend python manage.py seed --tenant clinica-demo --only reporting_6months
```

## Resultado esperado

- Ya no se verá el patrón de nombres repetidos por mes.
- Podrá facturar solo a pacientes con cuenta app (default) o cambiar el filtro según necesidad operativa.
