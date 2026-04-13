# Sesión 2026-04-12 — Mobile paciente: citas, consultas, estudios

## Objetivo
Paciente logueado en Flutter ve citas reales y accede a consultas/estudios sin placeholders; API coherente con roles.

## Cambios

### Backend
- `apps/atencionClinica/consultas/views.py`: `ConsultaViewSet.get_queryset` y `EstudioViewSet.get_queryset` filtran por `tipo_usuario` (PACIENTE vía `Paciente.objects.filter(usuario=...)`, médico por `especialista` / `consulta__especialista`, admin con `paciente_id` opcional).

### Mobile
- `heroCita()` en `patient_citas_provider.dart`: próxima cita o la más reciente del historial para la tarjeta principal.
- `PatientClinicalScreen` + `ClinicalRepository` + providers `patientConsultasProvider` / `patientEstudiosProvider`.
- `PatientQuickAccessRow`: callbacks reales; historial abre pantalla clínica; contacto usa `launch_clinic_phone.dart` + `CLINIC_PHONE` opcional en `.env`.
- `AppConfig.clinicPhone`; `mobile/.env.example` documentado.
- Pestaña Citas: `PatientAppointmentsSection(showVerTodasLink: false)`.
- Pull-to-refresh en inicio invalida providers clínicos.

## Verificación manual sugerida
1. Usuario PACIENTE con `Paciente.usuario` vinculado: `GET citas/`, `GET consultas/lista/`, `GET consultas/estudios/` desde la app.
2. Sin `CLINIC_PHONE`: snackbar al tocar contacto / CTA agendar.
3. Cita solo en historial (ATENDIDA): home muestra “Última cita”, no estado vacío engañoso.
