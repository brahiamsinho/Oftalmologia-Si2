import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../config/theme.dart';
import '../providers/patient_clinical_provider.dart';

/// Consultas y estudios del paciente (API filtrada por rol).
class PatientClinicalScreen extends StatelessWidget {
  const PatientClinicalScreen({super.key, this.initialTab = 0});

  final int initialTab;

  @override
  Widget build(BuildContext context) {
    final idx = initialTab.clamp(0, 1);
    return DefaultTabController(
      length: 2,
      initialIndex: idx,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        appBar: AppBar(
          title: const Text('Historial clínico'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Consultas'),
              Tab(text: 'Estudios'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            _ConsultasTab(),
            _EstudiosTab(),
          ],
        ),
      ),
    );
  }
}

class _ConsultasTab extends ConsumerWidget {
  const _ConsultasTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(patientConsultasProvider);

    return RefreshIndicator(
      color: AppTheme.primaryColor,
      onRefresh: () => ref.read(patientConsultasProvider.notifier).refresh(),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _RetryScroll(
          message: '$e',
          onRetry: () => ref.read(patientConsultasProvider.notifier).refresh(),
        ),
        data: (list) {
          if (list.isEmpty) {
            return _EmptyScroll(
              icon: Icons.medical_information_outlined,
              title: 'Sin consultas registradas',
              subtitle:
                  'Cuando tengas atenciones en la clínica, aparecerán acá.',
            );
          }
          return ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, i) {
              final c = list[i];
              final when = DateFormat(
                "d MMM yyyy · HH:mm",
                'es',
              ).format(c.fecha.toLocal());
              final citaLine = c.citaId != null
                  ? 'Cita asociada #${c.citaId}'
                  : 'Sin cita asociada';
              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x0A0F172A),
                      blurRadius: 8,
                      offset: Offset(0, 3),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      when,
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      c.motivo.isNotEmpty ? c.motivo : 'Consulta',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      citaLine,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppTheme.textMuted,
                          ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _EstudiosTab extends ConsumerWidget {
  const _EstudiosTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(patientEstudiosProvider);

    return RefreshIndicator(
      color: AppTheme.primaryColor,
      onRefresh: () => ref.read(patientEstudiosProvider.notifier).refresh(),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _RetryScroll(
          message: '$e',
          onRetry: () => ref.read(patientEstudiosProvider.notifier).refresh(),
        ),
        data: (list) {
          if (list.isEmpty) {
            return _EmptyScroll(
              icon: Icons.biotech_outlined,
              title: 'Sin estudios cargados',
              subtitle:
                  'Los exámenes oftalmológicos que registre la clínica se listarán acá.',
            );
          }
          return ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, i) {
              final e = list[i];
              final when = DateFormat(
                "d MMM yyyy · HH:mm",
                'es',
              ).format(e.fecha.toLocal());
              final bits = <String>[];
              if (e.ojoDerecho != null && e.ojoDerecho!.trim().isNotEmpty) {
                bits.add('OD: ${e.ojoDerecho!.trim()}');
              }
              if (e.ojoIzquierdo != null && e.ojoIzquierdo!.trim().isNotEmpty) {
                bits.add('OI: ${e.ojoIzquierdo!.trim()}');
              }
              final sub = bits.isEmpty
                  ? (e.observaciones?.trim().isNotEmpty == true
                      ? e.observaciones!.trim()
                      : null)
                  : bits.join(' · ');

              return Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                child: Ink(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x0A0F172A),
                        blurRadius: 8,
                        offset: Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        when,
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(
                              color: const Color(0xFF0D9488),
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        e.tipoLabel,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      if (sub != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          sub,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppTheme.textMuted,
                              ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _EmptyScroll extends StatelessWidget {
  const _EmptyScroll({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.35,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: 52, color: AppTheme.textMuted.withValues(alpha: 0.5)),
                  const SizedBox(height: 16),
                  Text(
                    title,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    subtitle,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: AppTheme.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _RetryScroll extends StatelessWidget {
  const _RetryScroll({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(24),
      children: [
        SizedBox(
          height: MediaQuery.sizeOf(context).height * 0.25,
        ),
        Text(message, textAlign: TextAlign.center),
        const SizedBox(height: 16),
        Center(
          child: FilledButton(
            onPressed: onRetry,
            child: const Text('Reintentar'),
          ),
        ),
      ],
    );
  }
}
