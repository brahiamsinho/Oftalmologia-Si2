import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../config/theme.dart';
import '../../domain/seguro_cobertura.dart';
import '../providers/finanzas_providers.dart';

/// CU19 — Cobertura de seguro del paciente.
class MisSegurosScreen extends ConsumerWidget {
  const MisSegurosScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(misAfiliacionesProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(
          'Mi cobertura',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.read(misAfiliacionesProvider.notifier).refresh(),
          ),
        ],
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _ErrorView(
          message: e.toString(),
          onRetry: () => ref.read(misAfiliacionesProvider.notifier).refresh(),
        ),
        data: (afiliaciones) => afiliaciones.isEmpty
            ? _EmptyView()
            : RefreshIndicator(
                color: AppTheme.primaryColor,
                onRefresh: () => ref.read(misAfiliacionesProvider.notifier).refresh(),
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: afiliaciones.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (ctx, i) => _AfiliacionCard(afiliacion: afiliaciones[i]),
                ),
              ),
      ),
    );
  }
}

class _AfiliacionCard extends StatelessWidget {
  const _AfiliacionCard({required this.afiliacion});
  final AfiliacionSeguro afiliacion;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final vigente = afiliacion.vigente ?? true;
    final fmt = DateFormat('dd MMM yyyy', 'es');

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: vigente ? const Color(0xFFBBF7D0) : const Color(0xFFE5E7EB),
        ),
        boxShadow: const [
          BoxShadow(color: Color(0x0A000000), blurRadius: 8, offset: Offset(0, 2)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: vigente ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.shield_outlined,
                    color: vigente ? AppTheme.successColor : AppTheme.textMuted,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        afiliacion.seguro.nombre,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      if (afiliacion.seguro.tipoSeguro.isNotEmpty)
                        Text(
                          afiliacion.seguro.tipoSeguro,
                          style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.textMuted),
                        ),
                    ],
                  ),
                ),
                _Badge(
                  label: vigente ? 'Vigente' : 'Vencida',
                  color: vigente ? AppTheme.successColor : AppTheme.textMuted,
                  bg: vigente ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Divider(height: 1),
            const SizedBox(height: 14),
            _InfoRow(label: 'N° de póliza', value: afiliacion.numeroPoliza),
            _InfoRow(label: 'Desde', value: fmt.format(afiliacion.fechaInicio)),
            if (afiliacion.fechaVencimiento != null)
              _InfoRow(label: 'Vencimiento', value: fmt.format(afiliacion.fechaVencimiento!)),
            if (afiliacion.seguro.porcentajeCobertura != null)
              _InfoRow(
                label: 'Cobertura',
                value: '${afiliacion.seguro.porcentajeCobertura!.toStringAsFixed(0)}%',
              ),
            if (afiliacion.seguro.coberturaMaximaAnual != null)
              _InfoRow(
                label: 'Máx. anual',
                value: 'Q${afiliacion.seguro.coberturaMaximaAnual!.toStringAsFixed(2)}',
              ),
            if (afiliacion.coberturaUsadaAnual != null)
              _InfoRow(
                label: 'Usado este año',
                value: 'Q${afiliacion.coberturaUsadaAnual!.toStringAsFixed(2)}',
              ),
            if (afiliacion.saldoCoberturaAnual != null) ...[
              const SizedBox(height: 8),
              _SaldoBar(
                usado: afiliacion.coberturaUsadaAnual ?? 0,
                maximo: afiliacion.seguro.coberturaMaximaAnual ?? 0,
                saldo: afiliacion.saldoCoberturaAnual!,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SaldoBar extends StatelessWidget {
  const _SaldoBar({required this.usado, required this.maximo, required this.saldo});
  final double usado;
  final double maximo;
  final double saldo;

  @override
  Widget build(BuildContext context) {
    final pct = maximo > 0 ? (usado / maximo).clamp(0.0, 1.0) : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Saldo disponible',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppTheme.textMuted)),
            Text('Q${saldo.toStringAsFixed(2)}',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppTheme.successColor,
                    )),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 6,
            backgroundColor: const Color(0xFFE2E8F0),
            valueColor: AlwaysStoppedAnimation<Color>(
              pct > 0.8 ? AppTheme.errorColor : AppTheme.primaryColor,
            ),
          ),
        ),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: AppTheme.textMuted)),
          Text(value,
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(fontWeight: FontWeight.w600, color: const Color(0xFF0F172A))),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.color, required this.bg});
  final String label;
  final Color color;
  final Color bg;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
        child: Text(label,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
      );
}

class _EmptyView extends StatelessWidget {
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
                  color: const Color(0xFFDBEAFE),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Icon(Icons.shield_outlined, color: AppTheme.primaryColor, size: 40),
              ),
              const SizedBox(height: 20),
              Text('Sin cobertura registrada',
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Text(
                'Cuando se registre un seguro o convenio para tu cuenta, lo verás aquí.',
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
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, color: AppTheme.errorColor, size: 48),
              const SizedBox(height: 16),
              Text('No se pudo cargar',
                  style: Theme.of(context)
                      .textTheme
                      .titleSmall
                      ?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text(message,
                  textAlign: TextAlign.center,
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: AppTheme.textMuted)),
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Reintentar'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.primaryColor,
                  side: const BorderSide(color: AppTheme.primaryColor),
                ),
              ),
            ],
          ),
        ),
      );
}
