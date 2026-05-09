# Sesion: Mobile agendar cita desde la app

Fecha: 2026-05-08
Agente: orchestrator

## Objetivo
Implementar flujo completo para que un paciente pueda agendar una cita desde la app mobile.

## Contexto backend
El backend ya tenia:
- `POST /api/citas/` — crea cita (requiere autenticacion)
- `GET /api/tipos-cita/` — tipos de cita
- `GET /api/especialistas/` — solo admin/administrativo

Faltaba un endpoint publico para que pacientes vean especialistas activos.

## Cambios implementados

### 1) Backend: EspecialistaPublicoViewSet
- Nuevo viewset en `especialistas/views.py`: `EspecialistaPublicoViewSet`
- `GET /api/especialistas-disponibles/` — lista especialistas activos, solo lectura
- Permisos: `IsAuthenticated` (cualquier usuario logueado)
- Registrado en `urls.py` como `especialistas-disponibles`

### 2) CitasRepository (citas_repository.dart)
- `scheduleAppointment()`: POST /citas/ con especialista, tipo, fecha/hora
- `getAvailableSpecialists()`: GET /especialistas-disponibles/
- `getAppointmentTypes()`: GET /tipos-cita/

### 3) ScheduleAppointmentScreen (schedule_appointment_screen.dart)
**Paso 1: Elegir especialista y tipo**
- Dropdown de especialistas (nombre + especialidad)
- Dropdown de tipos de cita (Consulta, Estudio, Cirugia, etc.)

**Paso 2: Elegir fecha y hora**
- DatePicker (solo fechas futuras, hasta 90 dias)
- TimePicker (hora libre)
- Campo opcional de motivo

**Paso 3: Confirmar**
- Resumen completo de la cita
- Boton confirmar → POST /api/citas/
- Dialog de exito → navega a /home

### 4) Rutas (routes.dart)
- `/schedule-appointment` → ScheduleAppointmentScreen

### 5) Home (patient_next_appointment_card.dart)
- Boton "Agendar cita >" ahora navega a `/schedule-appointment`
- Antes decia "Ver detalle >" con SnackBar "proximamente"

## Validacion

```bash
flutter analyze mobile/lib/features/home/presentation/screens/schedule_appointment_screen.dart mobile/lib/features/home/data/citas_repository.dart mobile/lib/config/routes.dart mobile/lib/features/home/presentation/widgets/patient_next_appointment_card.dart
```

Resultado: 42 info warnings (`prefer_const_constructors`), **0 errores**.

## Flujo de uso

1. Usuario va al home → ve tarjeta "No tenes turnos agendados" o "Proxima cita"
2. Toca "Agendar cita >"
3. Paso 1: Elige especialista y tipo de cita → "Continuar"
4. Paso 2: Elige fecha y hora → "Continuar"
5. Paso 3: Revisa resumen → "Confirmar cita"
6. Backend crea cita → dialog de exito → vuelve al home

## Proximo paso

- Detalle de cita (ver info completa de una cita existente)
- Cancelar cita desde la app
- Reprogramar cita desde la app
