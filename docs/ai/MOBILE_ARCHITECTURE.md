# MOBILE ARCHITECTURE

## Objetivo de la App Mobile
Brindar una interfaz ultra-portátil, nativa y de notificaciones instantáneas para dos perfiles clave:
1. **Pacientes:** Donde pre-asignen citas oftalmológicas, vean sus recordatorios, e interactúen con sus últimos resultados o derivaciones médicas sin depender de un navegador de escritorio.
2. **Médicos:** Visualización rápida de agenda del día, notas veloces por voz/teclado y datos críticos ante un paciente sin ir a la terminal administrativa.

## Rol de Flutter en el Sistema
Flutter sirve el rol de **Capa Presentacional Móvil Agonóstica**. No calculará impuestos clínicos, ni tomará decisiones lógicas de negocio profundas. Solicitará JSONs al Backend (Django API), los dibujará eficientemente en pantalla (Widgets), y enviará capturas o textos de input devuelta, validando primeramente reglas de UI/UX superficiales (nulos, strings correctas).

## Estructura Recomendada (Clean Architecture o Feature-Driven)
Por la complejidad del nivel médico, se dividirá por Featues/Capa de dominio, aislando el componente visual. 

```text
mobile/lib/
 ├─ core/              (Networking genérico, utilidades, theamas, manejo de tokens seguro)
 ├─ features/
 │   ├─ auth/          (Login UI, repositorios auth, estados auth).
 │   ├─ appointments/  (Vistas de calendario, modelos datos DTO Citas).
 │   └─ records/       (Historias clínicas oftalmológicas móvil).
 └─ app_router.dart    (Manejador de rutas limpias)
```

## Relación entre Mobile y Backend
- Todas las peticiones HTTP se empaquetan idealmente con **Dio**, inyectando localmente el token de `flutter_secure_storage` en cada Interceptor de headers `Authorization: Bearer <token>`.
- Redirección Inteligente: Si Backend arroja HTTP 401 Unauthorized y el intento de Refresh falla, la app fuerza el deslogueo en la pantalla al instante.

## Convenciones y Principios Inquebrantables
1. **Seguridad y Memoria RAM:** Variables médicas estáticas deben limpiarse al desloguearse. Los Tokens JWT JAMÁS deben ir a SharedPreferences plano, solo a Bóveda Segura del SO (Keychain/Keystore).
2. **Offline-First Ligero:** Implementar manejo noble sin red (Caché local mínima visual y alertas tipo `No internet connection` estiladas oftalmológicamente) usando un bloc o riverpod de conectividad global.
3. **UI/UX Empático:** Textos legibles y grandes (el target puede tener pacientes oftalmológicos).

## Lineamientos de Escalabilidad para Pantallas y Features
- Centralizar colores y tipografías en un solo esquema (`theme.dart`).
- Diseñar **Widgets Globales Reutilizables** (ej. `OphthalmicButton`, `CardDataPatient`) para estandarizar módulos y no fragmentar material de UI en 30 widgets distintos.
- No dejar Hardcodeado `localhost`/`10.0.2.2`; utilizar paquetes de .env en Flutter.
