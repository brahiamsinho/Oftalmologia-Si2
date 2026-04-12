# 2026-04-12 — Modal pacientes (UX) + 400 al crear historia clínica

## Causa del 400
`HistoriaClinica.id_paciente` es **OneToOne** con `Paciente`: un segundo `POST` para el mismo paciente viola unicidad → 400.

## Cambios
- **Backend:** `HistoriaClinicaSerializer.validate_id_paciente` mensaje explícito en español.
- **Frontend historial:** `fetchAll('/pacientes/')`, `Set` de pacientes con HC ya listados, `<option disabled>` + texto; error de API en banner (sin `alert` genérico); modal con scroll/padding como pacientes.
- **Frontend pacientes:** contenedor del modal con `overflow-y-auto` y márgenes verticales; grids responsive; dirección `sm:col-span-2`; clase anti-autofill webkit en inputs.
