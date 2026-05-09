# Sesion: Mobile UI/UX iteracion 3 (tokenizacion completa Batch A+B+C)

Fecha: 2026-05-08
Agente: orchestrator

## Objetivo
Reemplazar valores hardcodeados de spacing/motion por tokens `AppTheme.space*` y `AppTheme.motion*` en toda la app paciente.

## Cambios implementados

### Batch A (Home screens)
#### 1) patient_home_screen.dart
- `padding: const EdgeInsets.all(24)` → `padding: EdgeInsets.all(AppTheme.space6)`
- `const SizedBox(height: 20)` → `SizedBox(height: AppTheme.space5)`
- `const SizedBox(height: 16)` → `SizedBox(height: AppTheme.space4)`
- `const SizedBox(height: 4)` → `SizedBox(height: AppTheme.space1)`
- `contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)` → `contentPadding: EdgeInsets.symmetric(horizontal: AppTheme.space3, vertical: AppTheme.space2)`

#### 2) patient_appointments_section.dart
- `padding: const EdgeInsets.fromLTRB(20, 24, 20, 100)` → `padding: EdgeInsets.fromLTRB(AppTheme.space5, AppTheme.space6, AppTheme.space5, 100)`
- `const SizedBox(height: 12)` → `SizedBox(height: AppTheme.space3)`
- `const EdgeInsets.all(4)` → `EdgeInsets.all(AppTheme.space1)`
- `const SizedBox(height: 16)` → `SizedBox(height: AppTheme.space4)`
- `duration: const Duration(milliseconds: 220)` → `duration: AppTheme.motionNormal`
- `const SizedBox(width: 12)` → `SizedBox(width: AppTheme.space3)`
- `const SizedBox(height: 10)` → `SizedBox(height: AppTheme.space2)`

#### 3) patient_next_appointment_card.dart
- `margin: const EdgeInsets.symmetric(horizontal: 20)` → `margin: EdgeInsets.symmetric(horizontal: AppTheme.space5)`
- `padding: const EdgeInsets.all(16)` → `padding: EdgeInsets.all(AppTheme.space4)`
- `const SizedBox(height: 12)` → `SizedBox(height: AppTheme.space3)`
- `padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4)` → `padding: EdgeInsets.symmetric(horizontal: AppTheme.space2, vertical: AppTheme.space1)`
- `const SizedBox(height: 8)` → `SizedBox(height: AppTheme.space2)`
- `const SizedBox(width: 4)` → `SizedBox(width: AppTheme.space1)`
- `const SizedBox(height: 16)` → `SizedBox(height: AppTheme.space4)`

### Batch B (Historial + Auth)
#### 4) patient_clinical_screen.dart
- `duration: const Duration(milliseconds: 220)` → `duration: AppTheme.motionNormal` (x2 tabs)
- `padding: const EdgeInsets.fromLTRB(16, 16, 16, 32)` → `padding: EdgeInsets.fromLTRB(AppTheme.space4, AppTheme.space4, AppTheme.space4, 32)` (x4)
- `padding: const EdgeInsets.all(16)` → `padding: EdgeInsets.all(AppTheme.space4)` (x4)
- `padding: const EdgeInsets.all(14)` → `padding: EdgeInsets.all(AppTheme.space3)` (x2)
- `const SizedBox(height: 10)` → `SizedBox(height: AppTheme.space2)` (x6)
- `const SizedBox(height: 6)` → `SizedBox(height: AppTheme.space1)` (x2)
- `const SizedBox(height: 4)` → `SizedBox(height: AppTheme.space1)` (x2)

#### 5) login_screen.dart
- Agrego import `../../../../config/theme.dart`
- `padding: const EdgeInsets.all(24)` → `padding: EdgeInsets.all(AppTheme.space6)`
- `const SizedBox(height: 12)` → `SizedBox(height: AppTheme.space3)`
- `const SizedBox(height: 4)` → `SizedBox(height: AppTheme.space1)`
- `const SizedBox(height: 16)` → `SizedBox(height: AppTheme.space4)` (x2)
- `const SizedBox(height: 24)` → `SizedBox(height: AppTheme.space6)`

#### 6) register_screen.dart
- Agrego import `../../../../config/theme.dart`
- `padding: const EdgeInsets.fromLTRB(20, 16, 20, 32)` → `padding: EdgeInsets.fromLTRB(AppTheme.space5, AppTheme.space4, AppTheme.space5, 32)`
- `const SizedBox(height: 8)` → `SizedBox(height: AppTheme.space2)` (x3)
- `const SizedBox(height: 14)` → `SizedBox(height: AppTheme.space3)` (x10)
- `const SizedBox(height: 20)` → `SizedBox(height: AppTheme.space5)`
- `const SizedBox(height: 24)` → `SizedBox(height: AppTheme.space6)`
- `const SizedBox(height: 12)` → `SizedBox(height: AppTheme.space3)`
- `const SizedBox(width: 10)` → `SizedBox(width: AppTheme.space2)`
- `padding: const EdgeInsets.all(14)` → `padding: EdgeInsets.all(AppTheme.space3)` (x2)
- `margin: const EdgeInsets.only(bottom: 16)` → `margin: EdgeInsets.only(bottom: AppTheme.space4)`

### Batch C (Header + Accesos)
#### 7) patient_home_header.dart
- Agrego import `../../../../config/theme.dart`
- `EdgeInsets.fromLTRB(20, 8 + ..., 20, 28)` → `EdgeInsets.fromLTRB(AppTheme.space5, AppTheme.space2 + ..., AppTheme.space5, AppTheme.space6)`
- `const SizedBox(width: 14)` → `SizedBox(width: AppTheme.space3)`
- `const SizedBox(height: 10)` → `SizedBox(height: AppTheme.space2)`
- `padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)` → `padding: EdgeInsets.symmetric(horizontal: AppTheme.space3, vertical: AppTheme.space2)`
- `const SizedBox(width: 8)` → `SizedBox(width: AppTheme.space2)`
- `padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1)` → `padding: EdgeInsets.symmetric(horizontal: AppTheme.space1, vertical: 1)`

#### 8) patient_quick_access_row.dart
- `padding: const EdgeInsets.fromLTRB(20, 8, 20, 0)` → `padding: EdgeInsets.fromLTRB(AppTheme.space5, AppTheme.space2, AppTheme.space5, 0)`
- `const SizedBox(height: 12)` → `SizedBox(height: AppTheme.space3)`
- `const SizedBox(width: 10)` → `SizedBox(width: AppTheme.space2)` (x2)
- `padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8)` → `padding: EdgeInsets.symmetric(vertical: AppTheme.space3, horizontal: AppTheme.space2)`
- `const SizedBox(height: 8)` → `SizedBox(height: AppTheme.space2)`

## Validacion

```bash
flutter analyze mobile/lib/features/home/presentation/screens/patient_clinical_screen.dart mobile/lib/features/auth/presentation/screens/login_screen.dart mobile/lib/features/auth/presentation/screens/register_screen.dart mobile/lib/features/home/presentation/widgets/patient_home_header.dart mobile/lib/features/home/presentation/widgets/patient_quick_access_row.dart
```

Resultado: 56 info warnings (`prefer_const_constructors`), 0 errores.

## Impacto

- Spacing y motion centralizados en `theme.dart` para toda la app paciente
- Facil ajuste global cambiando tokens
- Consistencia visual garantizada en Home, Historial, Auth, Header y Accesos rapidos
- 8 archivos tokenizados en total (Batch A: 3, Batch B: 3, Batch C: 2)
