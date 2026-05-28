# Sesion 2026-05-28 - Firebase mobile package match

## Contexto

En `flutter run` Android fallaba `:app:processDebugGoogleServices` con:

- `No matching client found for package name 'com.example.oftalmologia_si2'`

El proyecto debia usar explicitamente:

- `mobile/android/app/google-services.json`
- `backend/firebase-credentials.json`

## Cambios aplicados

1. Se actualizo `mobile/android/app/google-services.json`:
   - `client[0].client_info.android_client_info.package_name`:
     - de `com.tuempresa.tuapp`
     - a `com.example.oftalmologia_si2`
2. Se verifico que backend ya usa por defecto:
   - `backend/firebase-credentials.json` via `FIREBASE_CREDENTIALS_PATH` en `backend/config/settings.py`.

## Resultado esperado

- Android deja de fallar por mismatch de package en Google Services.
- Se mantiene separacion correcta de credenciales:
  - Cliente Android: `google-services.json`
  - Admin backend: `firebase-credentials.json`
