import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../config/theme.dart';
import '../../data/facturacion_repository.dart';
import '../../domain/factura_resumen.dart';
import '../providers/finanzas_providers.dart';

/// CU21 — Facturas y cobros del paciente.
class MisFacturasScreen extends ConsumerStatefulWidget {
  const MisFacturasScreen({super.key});

  @override
  ConsumerState<MisFacturasScreen> createState() => _MisFacturasScreenState();
}

class _MisFacturasScreenState extends ConsumerState<MisFacturasScreen> {
  String? _filtroEstado;

  static const _estados = [
    (null, 'Todas'),
    ('PENDIENTE', 'Pendientes'),
    ('PAGADA', 'Pagadas'),
    ('ANULADA', 'Anuladas'),
  ];

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(misFacturasProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(
          'Mis facturas',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.read(misFacturasProvider.notifier).filtrar(_filtroEstado),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filtros por estado
          Container(
            color: Colors.white,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                children: _estados.map((e) {
                  final selected = _filtroEstado == e.$1;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(e.$2),
                      selected: selected,
                      onSelected: (_) {
                        setState(() => _filtroEstado = e.$1);
                        ref.read(misFacturasProvider.notifier).filtrar(e.$1);
                      },
                      selectedColor: AppTheme.primaryColor,
                      labelStyle: TextStyle(
                        color: selected ? Colors.white : AppTheme.textColor,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          Expanded(
            child: state.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => _ErrorView(
                message: e.toString(),
                onRetry: () => ref.read(misFacturasProvider.notifier).filtrar(_filtroEstado),
              ),
              data: (facturas) => facturas.isEmpty
                  ? const _EmptyView()
                  : RefreshIndicator(
                      color: AppTheme.primaryColor,
                      onRefresh: () =>
                          ref.read(misFacturasProvider.notifier).filtrar(_filtroEstado),
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: facturas.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (ctx, i) => _FacturaCard(factura: facturas[i]),
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FacturaCard extends ConsumerWidget {
  const _FacturaCard({required this.factura});
  final FacturaResumen factura;

  Color _estadoColor(EstadoFactura e) {
    switch (e) {
      case EstadoFactura.pendiente:
        return const Color(0xFFD97706);
      case EstadoFactura.pagada:
        return AppTheme.successColor;
      case EstadoFactura.anulada:
        return AppTheme.textMuted;
      case EstadoFactura.vencida:
        return AppTheme.errorColor;
    }
  }

  Color _estadoBg(EstadoFactura e) {
    switch (e) {
      case EstadoFactura.pendiente:
        return const Color(0xFFFEF3C7);
      case EstadoFactura.pagada:
        return const Color(0xFFDCFCE7);
      case EstadoFactura.anulada:
        return const Color(0xFFF1F5F9);
      case EstadoFactura.vencida:
        return const Color(0xFFFEE2E2);
    }
  }

  String _estadoLabel(EstadoFactura e) {
    switch (e) {
      case EstadoFactura.pendiente:
        return 'Pendiente';
      case EstadoFactura.pagada:
        return 'Pagada';
      case EstadoFactura.anulada:
        return 'Anulada';
      case EstadoFactura.vencida:
        return 'Vencida';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final fmt = DateFormat('dd MMM yyyy', 'es');
    final isPendiente = factura.estado == EstadoFactura.pendiente;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isPendiente ? const Color(0xFFFDE68A) : const Color(0xFFE5E7EB),
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
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: _estadoBg(factura.estado),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    isPendiente ? Icons.receipt_long_outlined : Icons.receipt_rounded,
                    color: _estadoColor(factura.estado),
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Factura ${factura.numeroFactura}',
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      Text(
                        fmt.format(factura.fechaEmision),
                        style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _estadoBg(factura.estado),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _estadoLabel(factura.estado),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: _estadoColor(factura.estado),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Divider(height: 1),
            const SizedBox(height: 14),
            if (factura.descripcionServicio != null && factura.descripcionServicio!.isNotEmpty)
              _Row(label: 'Servicio', value: factura.descripcionServicio!),
            _Row(
              label: 'Total',
              value: 'Q${factura.montoTotal.toStringAsFixed(2)}',
              bold: true,
            ),
            if (factura.montoDescuento != null && factura.montoDescuento! > 0)
              _Row(
                label: 'Descuento',
                value: '- Q${factura.montoDescuento!.toStringAsFixed(2)}',
                color: AppTheme.successColor,
              ),
            if (factura.copago != null && factura.copago! > 0)
              _Row(label: 'Copago seguro', value: 'Q${factura.copago!.toStringAsFixed(2)}'),
            if (factura.saldoPendiente != null)
              _Row(
                label: 'Saldo pendiente',
                value: 'Q${factura.saldoPendiente!.toStringAsFixed(2)}',
                bold: true,
                color: factura.tieneSaldo ? _estadoColor(factura.estado) : AppTheme.successColor,
              ),

            // Botones de acción
            if (isPendiente && factura.tieneSaldo) ...[
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _pagarEnLinea(context, ref, factura.idFactura),
                  icon: const Icon(Icons.payment_rounded, size: 18),
                  label: const Text('Pagar en línea'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
            if (factura.estado == EstadoFactura.pagada) ...[
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => _verComprobante(context, ref, factura.idFactura),
                  icon: const Icon(Icons.download_outlined, size: 18),
                  label: const Text('Ver comprobante'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primaryColor,
                    side: const BorderSide(color: AppTheme.primaryColor),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _pagarEnLinea(BuildContext ctx, WidgetRef ref, String id) async {
    try {
      final url = await ref.read(facturacionRepositoryProvider).iniciarPagoEnLinea(id);
      if (url.isNotEmpty && await canLaunchUrl(Uri.parse(url))) {
        await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      } else {
        if (ctx.mounted) {
          ScaffoldMessenger.of(ctx).showSnackBar(
            const SnackBar(content: Text('No se pudo abrir la pasarela de pago.')),
          );
        }
      }
    } catch (e) {
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  Future<void> _verComprobante(BuildContext ctx, WidgetRef ref, String id) async {
    try {
      final texto = await ref.read(facturacionRepositoryProvider).fetchComprobante(id);
      if (!ctx.mounted) return;
      showModalBottomSheet<void>(
        context: ctx,
        isScrollControlled: true,
        backgroundColor: Colors.white,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (_) => DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.6,
          maxChildSize: 0.9,
          builder: (__, scrollCtrl) => Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text('Comprobante',
                    style: Theme.of(ctx)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.w800)),
              ),
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollCtrl,
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    texto,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 13,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    } catch (e) {
      if (ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value, this.bold = false, this.color});
  final String label;
  final String value;
  final bool bold;
  final Color? color;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 2.5),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label,
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: AppTheme.textMuted)),
            Text(
              value,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: bold ? FontWeight.w800 : FontWeight.w600,
                    color: color ?? const Color(0xFF0F172A),
                  ),
            ),
          ],
        ),
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
                  color: const Color(0xFFDBEAFE),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Icon(Icons.receipt_long_outlined,
                    color: AppTheme.primaryColor, size: 40),
              ),
              const SizedBox(height: 20),
              Text('Sin facturas',
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Text(
                'Cuando se emita una factura para tu cuenta, aparecerá aquí.',
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
            const SizedBox(height: 12),
            Text(message,
                textAlign: TextAlign.center,
                style: Theme.of(context)
                    .textTheme
                    .bodySmall
                    ?.copyWith(color: AppTheme.textMuted)),
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
