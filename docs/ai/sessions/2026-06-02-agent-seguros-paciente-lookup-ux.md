# Sesión 2026-06-02 — Seguros: paciente por búsqueda (no por ID)

## Problema reportado

En la pantalla de Seguros, pestaña **Verificar cobertura**, el flujo exigía ingresar `ID paciente` manualmente. Esto genera mala UX y errores de operación.

## Implementación aplicada

- Archivo modificado: `frontend/src/app/(dashboard)/administracionFinanciera/seguros/page.tsx`.
- Se creó componente local `PacienteLookup` con:
  - búsqueda debounce (300ms),
  - consulta `pacientesService.list({ search, ordering: 'apellidos', page: 1 })`,
  - lista desplegable de resultados con contexto (ID/documento/email),
  - selección de paciente y resumen visible.

## Cambios de flujo

### 1) Verificar cobertura
- Se eliminó input numérico directo por ID.
- Se usa `PacienteLookup`.
- Botón `Verificar` queda deshabilitado hasta seleccionar paciente.
- Validación/mensaje de error actualizado a selección explícita.

### 2) Afiliaciones
- Se reemplazó `select` de paciente por `PacienteLookup`.
- Al seleccionar, se mapea `id_paciente` al payload de afiliación.

## Resultado esperado

- Menos errores por digitación de ID.
- Flujo más natural para administrativo.
- Mejor escalabilidad UX al crecer el número de pacientes.

## Validación

- `npm run build` frontend: OK.
- Warnings existentes en otros módulos se mantienen no bloqueantes.
