import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../config/theme.dart';
import '../../../../core/ui/widgets/app_async_states.dart';
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
      child: AnimatedSwitcher(
        duration: AppTheme.motionNormal,
        switchInCurve: Curves.easeOut,
        switchOutCurve: Curves.easeIn,
        child: async.when(
          loading: () => ListView(
            key: const ValueKey('loading-consultas'),
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.fromLTRB(AppTheme.space4, AppTheme.space4, AppTheme.space4, 32),
            children: const [
              AppSkeletonTile(),
              SizedBox(height: 10),
              AppSkeletonTile(),
              SizedBox(height: 10),
              AppSkeletonTile(),
            ],
          ),
          error: (_, __) => ListView(
            key: const ValueKey('error-consultas'),
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.all(AppTheme.space4),
            children: [
              AppErrorStateCard(
                message:
                    'No pudimos cargar tus consultas. Verificá tu conexión e intentá de nuevo.',
                onRetry: () =>
                    ref.read(patientConsultasProvider.notifier).refresh(),
              ),
            ],
          ),
          data: (list) {
            if (list.isEmpty) {
              return ListView(
                key: const ValueKey('empty-consultas'),
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.all(AppTheme.space4),
                children: const [
                  AppEmptyStateCard(
                    icon: Icons.medical_information_outlined,
                    title: 'Sin consultas registradas',
                    subtitle:
                        'Cuando tengas atenciones en la clínica, aparecerán acá.',
                  ),
                ],
              );
            }
            return AppFadeSlideIn(
              key: ValueKey('data-consultas-${list.length}'),
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.fromLTRB(AppTheme.space4, AppTheme.space4, AppTheme.space4, 32),
                itemCount: list.length,
                separatorBuilder: (_, __) => SizedBox(height: AppTheme.space2),
                itemBuilder: (context, i) {
                  final c = list[i];
                  final when = DateFormat(
                    "d MMM yyyy · HH:mm",
                    'es',
                  ).format(c.fecha.toLocal());
                  final citaLine = c.citaId != null
                      ? 'Cita asociada #${c.citaId}'
                      : 'Sin cita asociada';
                  return Semantics(
                    label: 'Consulta del ${when}. ${c.motivo.isNotEmpty ? c.motivo : 'Consulta'}. $citaLine.',
                    child: Container(
                      padding: EdgeInsets.all(AppTheme.space3),
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
                            style:
                                Theme.of(context).textTheme.labelMedium?.copyWith(
                                      color: AppTheme.primaryColor,
                                      fontWeight: FontWeight.w700,
                                    ),
                          ),
                          SizedBox(height: AppTheme.space1),
                          Text(
                            c.motivo.isNotEmpty ? c.motivo : 'Consulta',
                            style:
                                Theme.of(context).textTheme.titleSmall?.copyWith(
                                      fontWeight: FontWeight.w700,
                                    ),
                          ),
                          SizedBox(height: AppTheme.space1),
                          Text(
                            citaLine,
                            style:
                                Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: AppTheme.textMuted,
                                    ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            );
          },
        ),
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
      child: AnimatedSwitcher(
        duration: AppTheme.motionNormal,
        switchInCurve: Curves.easeOut,
        switchOutCurve: Curves.easeIn,
        child: async.when(
          loading: () => ListView(
            key: const ValueKey('loading-estudios'),
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.fromLTRB(AppTheme.space4, AppTheme.space4, AppTheme.space4, 32),
            children: const [
              AppSkeletonTile(),
              SizedBox(height: 10),
              AppSkeletonTile(),
              SizedBox(height: 10),
              AppSkeletonTile(),
            ],
          ),
          error: (_, __) => ListView(
            key: const ValueKey('error-estudios'),
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.all(AppTheme.space4),
            children: [
              AppErrorStateCard(
                message:
                    'No pudimos cargar tus estudios. Verificá tu conexión e intentá de nuevo.',
                onRetry: () =>
                    ref.read(patientEstudiosProvider.notifier).refresh(),
              ),
            ],
          ),
          data: (list) {
            if (list.isEmpty) {
              return ListView(
                key: const ValueKey('empty-estudios'),
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.all(AppTheme.space4),
                children: const [
                  AppEmptyStateCard(
                    icon: Icons.biotech_outlined,
                    title: 'Sin estudios cargados',
                    subtitle:
                        'Los exámenes oftalmológicos que registre la clínica se listarán acá.',
                  ),
                ],
              );
            }
            return AppFadeSlideIn(
              key: ValueKey('data-estudios-${list.length}'),
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.fromLTRB(AppTheme.space4, AppTheme.space4, AppTheme.space4, 32),
                itemCount: list.length,
                separatorBuilder: (_, __) => SizedBox(height: AppTheme.space2),
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
                  if (e.ojoIzquierdo != null &&
                      e.ojoIzquierdo!.trim().isNotEmpty) {
                    bits.add('OI: ${e.ojoIzquierdo!.trim()}');
                  }
                  final sub = bits.isEmpty
                      ? (e.observaciones?.trim().isNotEmpty == true
                          ? e.observaciones!.trim()
                          : null)
                      : bits.join(' · ');

                  return Semantics(
                    label: 'Estudio ${e.tipoLabel} del ${when}.${sub != null ? ' Detalle: $sub.' : ''}',
                    child: Material(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      child: Ink(
                        padding: EdgeInsets.all(AppTheme.space3),
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
                              style: Theme.of(context)
                                  .textTheme
                                  .labelMedium
                                  ?.copyWith(
                                    color: const Color(0xFF0D9488),
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                            SizedBox(height: AppTheme.space1),
                            Text(
                              e.tipoLabel,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                            if (sub != null) ...[
                              SizedBox(height: AppTheme.space1),
                              Text(
                                sub,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                      color: AppTheme.textMuted,
                                    ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }
}
