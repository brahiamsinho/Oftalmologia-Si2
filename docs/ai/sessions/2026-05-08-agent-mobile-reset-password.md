# Sesion: Mobile recuperacion de contraseña (Mailhog)

Fecha: 2026-05-08
Agente: orchestrator

## Objetivo
Implementar flujo de recuperacion de contraseña en mobile usando endpoints existentes del backend y Mailhog para desarrollo.

## Contexto backend
El backend ya tenia implementados los endpoints:
- `POST /api/auth/reset-password/` → `{ "email" }` → envia email con token, siempre responde 200
- `POST /api/auth/reset-password/confirm/` → `{ "token", "password_nuevo" }` → resetea password
- Token expira en 2h
- Email contiene enlace web + token (en dev se usa Mailhog)

## Cambios implementados

### 1) AuthRepository (auth_repository.dart)
- `requestPasswordReset(email)`: POST /auth/reset-password/ → retorna mensaje de exito
- `confirmPasswordReset(token, newPassword)`: POST /auth/reset-password/confirm/ → retorna mensaje

### 2) ForgotPasswordScreen (forgot_password_screen.dart)
- Input email con validacion de formato
- Boton "Enviar instrucciones"
- POST /auth/reset-password/
- Estado de exito: muestra confirmacion + boton "Restablecer contraseña" → navega a /reset-password
- Semantics labels para accesibilidad
- Touch targets minimos 48px

### 3) ResetPasswordScreen (reset_password_screen.dart)
- Input token (copiado de Mailhog)
- Input nueva contraseña + confirmacion
- Validaciones: campos completos, contraseñas coinciden, minimo 8 caracteres
- Toggle visibility en ambos campos de contraseña
- POST /auth/reset-password/confirm/
- Estado de exito: muestra confirmacion + boton "Iniciar sesion" → navega a /login
- Hint visual: "En desarrollo, el codigo llega a Mailhog"
- Semantics labels para accesibilidad

### 4) Rutas (routes.dart)
- `/forgot-password` → ForgotPasswordScreen
- `/reset-password` → ResetPasswordScreen
- Ambas incluidas en `isAuthRoute` para redirect logic

### 5) Login (mobile_login_screen.dart)
- Boton `onForgotPassword` ahora navega a `/forgot-password` (antes mostraba SnackBar "disponible pronto")

## Validacion

```bash
flutter analyze mobile/lib/features/auth/presentation/screens/forgot_password_screen.dart mobile/lib/features/auth/presentation/screens/reset_password_screen.dart mobile/lib/features/auth/data/auth_repository.dart mobile/lib/config/routes.dart mobile/lib/features/auth/presentation/screens/mobile_login_screen.dart
```

Resultado: 30 info warnings (`prefer_const_constructors`), **0 errores**.

## Flujo de uso en desarrollo

1. Usuario va a login → "¿Olvidaste tu contraseña?"
2. Ingresa email → "Enviar instrucciones"
3. Backend envia email a Mailhog
4. Usuario abre Mailhog (http://localhost:8025) → copia el token del email
5. Usuario va a "Restablecer contraseña" → pega token + nueva contraseña
6. Backend valida token → resetea password → exito
7. Usuario va a login con nueva contraseña

## Proximo paso

- Agendar cita desde la app (funcionalidad pendiente)
- Detalle de cita (placeholder actual)
