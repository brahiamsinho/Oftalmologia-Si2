import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../config/theme.dart';
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

    return async.when(
      data: (list) {
        final hero = heroCita(list);
        if (hero == null) {
          return _EmptyCard(
            onSchedule: () => launchClinicPhone(context),
          );
        }
        return _DataCard(
          cita: hero.cita,
          isUpcoming: hero.isUpcoming,
          doctorLabel: _doctorLabel(hero.cita.especialistaNombre),
        );
      },
      loading: () => const _LoadingCard(),
      error: (_, __) => _ErrorCard(
        onRetry: () => ref.read(patientCitasProvider.notifier).refresh(),
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

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(16),
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
          const SizedBox(height: 12),
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
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
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
                    const SizedBox(height: 8),
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
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.location_on_outlined,
                          size: 18,
                          color: AppTheme.textMuted,
                        ),
                        const SizedBox(width: 4),
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
            child: TextButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Detalle de cita próximamente.')),
                );
              },
              child: const Text('Ver detalle >'),
            ),
          ),
        ],
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
      margin: const EdgeInsets.symmetric(horizontal: 20),
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
          const SizedBox(height: 16),
          Text(
            'No tenés turnos agendados',
            textAlign: TextAlign.center,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
              color: AppTheme.secondaryColor,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Reservá una consulta con tu oftalmólogo cuando lo necesites.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: AppTheme.textMuted,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onSchedule,
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text('Contactar clínica / agendar'),
            ),
          ),
        ],
      ),
    );
  }
}

class _LoadingCard extends StatelessWidget {
  const _LoadingCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      height: 180,
      padding: const EdgeInsets.all(20),
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
          _bone(width: 120, height: 14),
          const SizedBox(height: 20),
          Row(
            children: [
              _bone(width: 56, height: 72, radius: 12),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _bone(width: double.infinity, height: 12),
                    const SizedBox(height: 10),
                    _bone(width: 180, height: 12),
                    const SizedBox(height: 10),
                    _bone(width: 140, height: 12),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _bone({
    required double width,
    required double height,
    double radius = 8,
  }) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: const Color(0xFFE2E8F0),
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(20),
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
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: const BoxDecoration(
              color: Color(0xFFFEE2E2),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.error_outline_rounded,
              color: Color(0xFFDC2626),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'No pudimos cargar tu turno',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w800,
              color: const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Verificá tu conexión e intentá de nuevo.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodySmall?.copyWith(
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 14),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded, size: 20),
            label: const Text('Reintentar'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTheme.primaryColor,
              side: const BorderSide(color: AppTheme.primaryColor),
            ),
          ),
        ],
      ),
    );
  }
}
