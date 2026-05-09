import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../config/theme.dart';
import '../../../../core/ui/widgets/app_async_states.dart';
import '../../domain/cita_resumen.dart';
import '../providers/patient_citas_provider.dart';
import '../utils/launch_clinic_phone.dart';

class PatientNextAppointmentCard extends ConsumerWidget {
  const PatientNextAppointmentCard({super.key});

  String _doctorLabel(String nombre) {
    final t = nombre.trim();
    final lower = t.toLowerCase();
    if (lower.startsWith('dr.') || lower.startsWith('dra.')) return t;
    return 'Dr. $t';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(patientCitasProvider);

    return AnimatedSwitcher(
      duration: AppTheme.motionNormal,
      switchInCurve: Curves.easeOut,
      switchOutCurve: Curves.easeIn,
      child: async.when(
        data: (list) {
          final hero = heroCita(list);
          if (hero == null) {
            return AppFadeSlideIn(
              key: const ValueKey('empty-cita-hero'),
              child: _EmptyCard(onSchedule: () => launchClinicPhone(context)),
            );
          }
          return AppFadeSlideIn(
            key: ValueKey('data-cita-hero-${hero.cita.idCita}'),
            child: _DataCard(
              cita: hero.cita,
              isUpcoming: hero.isUpcoming,
              doctorLabel: _doctorLabel(hero.cita.especialistaNombre),
            ),
          );
        },
        loading: () => const AppShimmerCard(key: ValueKey('loading-cita-hero')),
        error: (_, __) => AppErrorStateCard(
          key: const ValueKey('error-cita-hero'),
          message: 'No pudimos cargar tu turno. Verificá tu conexión e intentá de nuevo.',
          onRetry: () => ref.read(patientCitasProvider.notifier).refresh(),
        ),
      ),
    );
  }
}

class _DataCard extends StatelessWidget {
  const _DataCard({
    required this.cita,
    required this.isUpcoming,
    required this.doctorLabel,
  });

  final CitaResumen cita;
  final bool isUpcoming;
  final String doctorLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final start = cita.fechaHoraInicio.toLocal();
    final mes = DateFormat('MMM', 'es').format(start).toUpperCase();
    final dia = DateFormat('d').format(start);
    final dow = DateFormat('EEE', 'es').format(start);
    final hora = DateFormat('HH:mm').format(start);

    final ubicacion = (cita.observaciones != null &&
            cita.observaciones!.trim().isNotEmpty)
        ? cita.observaciones!.trim()
        : 'Consultorio — ver confirmación';

    return Semantics(
      label: isUpcoming
          ? 'Próxima cita: $doctorLabel, $hora hs, $dia $mes. Motivo: ${cita.motivoDisplay}.'
          : 'Última cita: $doctorLabel, $hora hs, $dia $mes. Motivo: ${cita.motivoDisplay}.',
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: AppTheme.space5),
        padding: EdgeInsets.all(AppTheme.space4),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: const [
            BoxShadow(
              color: Color(0x140F172A),
              blurRadius: 20,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isUpcoming ? 'PRÓXIMA CITA' : 'ÚLTIMA CITA',
              style: theme.textTheme.labelSmall?.copyWith(
                color: AppTheme.textMuted,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
              ),
            ),
          SizedBox(height: AppTheme.space3),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 56,
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFDBEAFE),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    Text(
                      mes,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: AppTheme.primaryDark,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      dia,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        color: AppTheme.secondaryColor,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      dow,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: AppTheme.primaryDark,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.schedule, size: 18, color: AppTheme.primaryColor),
                        const SizedBox(width: 6),
                        Text(
                          '$hora hs',
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Flexible(
                          child: Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: AppTheme.space2,
                              vertical: AppTheme.space1,
                            ),
                            decoration: BoxDecoration(
                              color: isUpcoming
                                  ? const Color(0xFFD1FAE5)
                                  : const Color(0xFFE2E8F0),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              cita.motivoDisplay,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: isUpcoming
                                    ? const Color(0xFF047857)
                                    : const Color(0xFF475569),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: AppTheme.space2),
                    Text(
                      doctorLabel,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    Text(
                      cita.tipoCitaNombre,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: AppTheme.textMuted,
                      ),
                    ),
                    SizedBox(height: AppTheme.space2),
                    Row(
                      children: [
                        Icon(
                          Icons.location_on_outlined,
                          size: 18,
                          color: AppTheme.textMuted,
                        ),
                        SizedBox(width: AppTheme.space1),
                        Expanded(
                          child: Text(
                            ubicacion,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          Align(
            alignment: Alignment.centerRight,
            child: Semantics(
              label: 'Ver detalle de la cita',
              button: true,
              child: TextButton(
                onPressed: () => context.push('/schedule-appointment'),
                child: const Text('Agendar cita >'),
              ),
            ),
          ),
        ],
      ),
    ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({required this.onSchedule});

  final VoidCallback onSchedule;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: EdgeInsets.symmetric(horizontal: AppTheme.space5),
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: const Border(
          top: BorderSide(color: Color(0xFF2563EB), width: 3),
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x140F172A),
            blurRadius: 20,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: const BoxDecoration(
              color: Color(0xFFDBEAFE),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.remove_red_eye_outlined,
              color: Color(0xFF2563EB),
              size: 32,
            ),
          ),
          SizedBox(height: AppTheme.space4),
          Text(
            'No tenés turnos agendados',
            textAlign: TextAlign.center,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
              color: AppTheme.secondaryColor,
            ),
          ),
          SizedBox(height: AppTheme.space2),
          Text(
            'Reservá una consulta con tu oftalmólogo cuando lo necesites.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: AppTheme.textMuted,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 18),
          Semantics(
            label: 'Contactar clínica para agendar una cita',
            button: true,
            child: SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: onSchedule,
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  minimumSize: const Size(double.infinity, 48),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text('Contactar clínica / agendar'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
