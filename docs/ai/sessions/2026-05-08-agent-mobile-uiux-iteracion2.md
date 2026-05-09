# Sesion: Mobile UI/UX iteracion 2 (tokens + next appointment + perfil)

Fecha: 2026-05-08
Agente: orchestrator

## Objetivo
Completar consistencia UX en Home paciente: tokens centralizados, next appointment card con estados shared, perfil con animacion y jerarquia.

## Cambios implementados

### 1) Tokens de motion y spacing
Archivo: `mobile/lib/config/theme.dart`

Se agregaron:
- Motion: `motionFast` (150ms), `motionNormal` (220ms), `motionSlow` (280ms)
- Spacing: `space1` (4) a `space6` (24)

### 2) AppShimmerCard compartido
Archivo: `mobile/lib/core/ui/widgets/app_async_states.dart`

Se agrego `AppShimmerCard` para loading de cards hero con shimmer effect.

### 3) Refactor PatientNextAppointmentCard
Archivo: `mobile/lib/features/home/presentation/widgets/patient_next_appointment_card.dart`

- usa `AppShimmerCard`, `AppErrorStateCard`, `AppEmptyStateCard`
- `AnimatedSwitcher` con duracion `motionNormal`
- eliminadas clases locales `_LoadingCard` y `_ErrorCard`

### 4) Refactor Profile tab
Archivo: `mobile/lib/features/home/presentation/screens/patient_home_screen.dart`

- `_ProfileTab` envuelto en `AppFadeSlideIn`
- `_ProfileCard` nuevo componente con avatar, nombre, email jerarquico
- border/shadow consistentes con resto de cards

## Validacion

```bash
flutter analyze mobile/lib/core/ui/widgets/app_async_states.dart mobile/lib/features/home/presentation/widgets/patient_next_appointment_card.dart mobile/lib/features/home/presentation/screens/patient_home_screen.dart mobile/lib/config/theme.dart
```

Resultado: 3 info warnings (`prefer_const_constructors`), 0 errores.

## Impacto

- Home paciente completo con estados async consistentes
- Tokens centralizados para futuro mantenimiento
- Perfil con entrada animada y visual hierarchy clara
- Menos duplicacion, mas reutilizacion

## Proximo paso (iteracion 3)

- Refactor gradual para usar `AppTheme.space*` y `AppTheme.motion*` en toda la app
- Extender patrones a otras pantallas si aplica
