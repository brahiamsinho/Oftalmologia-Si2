import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../config/theme.dart';
import '../../domain/descuento_beneficio.dart';
import '../providers/finanzas_providers.dart';

/// CU20 — Descuentos y beneficios del paciente.
class MisDescuentosScreen extends ConsumerWidget {
  const MisDescuentosScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(misBeneficiosProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(
          'Mis descuentos',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.read(misBeneficiosProvider.notifier).refresh(),
          ),
        ],
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _ErrorView(
          message: e.toString(),
          onRetry: () => ref.read(misBeneficiosProvider.notifier).refresh(),
        ),
        data: (beneficios) => beneficios.isEmpty
            ? const _EmptyView()
            : RefreshIndicator(
                color: AppTheme.primaryColor,
                onRefresh: () => ref.read(misBeneficiosProvider.notifier).refresh(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                      child: Text(
                        '${beneficios.where((b) => !(b.utilizado ?? false)).length} beneficio(s) disponible(s)',
                        style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.textMuted),
                      ),
                    ),
                    Expanded(
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: beneficios.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (ctx, i) => _BeneficioCard(beneficio: beneficios[i]),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}

class _BeneficioCard extends StatelessWidget {
  const _BeneficioCard({required this.beneficio});
  final BeneficioPaciente beneficio;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final promo = beneficio.promocion;
    final usado = beneficio.utilizado ?? false;
    final vigente = promo.vigente ?? true;
    final fmt = DateFormat('dd MMM yyyy', 'es');

    final available = vigente && !usado;
    final accentColor = available ? const Color(0xFFF59E0B) : AppTheme.textMuted;
    final accentBg = available ? const Color(0xFFFFFBEB) : const Color(0xFFF8FAFC);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: available ? const Color(0xFFFDE68A) : const Color(0xFFE5E7EB),
        ),
        boxShadow: const [
          BoxShadow(color: Color(0x0A000000), blurRadius: 8, offset: Offset(0, 2)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(color: accentBg, borderRadius: BorderRadius.circular(14)),
              child: Center(
                child: Text(
                  promo.valorDisplay,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: accentColor,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          promo.nombre,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                      ),
                      _StatusChip(usado: usado, vigente: vigente),
                    ],
                  ),
                  if (promo.descripcion != null && promo.descripcion!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      promo.descripcion!,
                      style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.textMuted),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: [
                      if (promo.fechaFin != null)
                        _InfoChip(
                          icon: Icons.event_outlined,
                          label: 'Vence ${fmt.format(promo.fechaFin!)}',
                        ),
                      if (beneficio.fechaUtilizacion != null)
                        _InfoChip(
                          icon: Icons.check_circle_outline,
                          label: 'Usado ${fmt.format(beneficio.fechaUtilizacion!)}',
                          color: AppTheme.successColor,
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.usado, required this.vigente});
  final bool usado;
  final bool vigente;

  @override
  Widget build(BuildContext context) {
    if (usado) {
      return _Chip(label: 'Usado', color: AppTheme.textMuted, bg: const Color(0xFFF1F5F9));
    }
    if (!vigente) {
      return _Chip(label: 'Vencido', color: AppTheme.errorColor, bg: const Color(0xFFFEE2E2));
    }
    return _Chip(label: 'Disponible', color: const Color(0xFFB45309), bg: const Color(0xFFFEF3C7));
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.color, required this.bg});
  final String label;
  final Color color;
  final Color bg;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
        child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
      );
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label, this.color});
  final IconData icon;
  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color ?? AppTheme.textMuted),
          const SizedBox(width: 3),
          Text(label,
              style: TextStyle(fontSize: 11, color: color ?? AppTheme.textMuted)),
        ],
      );
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Icon(Icons.discount_outlined, color: Color(0xFFF59E0B), size: 40),
              ),
              const SizedBox(height: 20),
              Text('Sin descuentos activos',
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Text(
                'Cuando la clínica te asigne un beneficio o descuento, aparecerá aquí.',
                textAlign: TextAlign.center,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: AppTheme.textMuted, height: 1.4),
              ),
            ],
          ),
        ),
      );
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded, color: AppTheme.errorColor, size: 48),
            const SizedBox(height: 16),
            Text(message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.textMuted)),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Reintentar'),
            ),
          ],
        ),
      );
}
