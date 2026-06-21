# Sesión 2026-06-20 — Mobile chatbot para PACIENTE

## Contexto

- El chatbot móvil ya existía, pero `PACIENTE` quedaba bloqueado por acceso.
- El usuario pidió habilitar el acceso y hacer el asistente descubible desde el dashboard del paciente.

## Implementación

- `mobile/lib/features/ia/domain/ia_access.dart`: `PACIENTE` quedó incluido en los roles permitidos.
- `mobile/lib/features/home/presentation/widgets/patient_quick_access_row.dart`: se agregó un acceso rápido visible a `asistente-virtual`.
- `mobile/lib/features/ia/presentation/screens/virtual_assistant_screen.dart`: copy y sugerencias adaptadas según `tipoUsuario`.

## Resultado

- El paciente ahora puede entrar al asistente desde Inicio y también por la ruta existente `/asistente-virtual`.
- El copy del chat ya no depende solo del lenguaje operativo/staff.
