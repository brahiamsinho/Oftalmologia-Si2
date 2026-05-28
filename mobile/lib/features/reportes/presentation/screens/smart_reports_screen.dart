import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../config/theme.dart';
import '../providers/smart_report_provider.dart';
import '../services/speech_input_service.dart';
import '../widgets/report_query_bar.dart';
import '../widgets/report_results_section.dart';

/// Reportes inteligentes (NL → QBE + exportación Excel/PDF).
class SmartReportsScreen extends ConsumerStatefulWidget {
  const SmartReportsScreen({super.key});

  @override
  ConsumerState<SmartReportsScreen> createState() => _SmartReportsScreenState();
}

class _SmartReportsScreenState extends ConsumerState<SmartReportsScreen> {
  final _queryController = TextEditingController();
  final _speech = SpeechInputService();
  bool _isListening = false;
  String? _speechError;

  @override
  void initState() {
    super.initState();
    _queryController.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _queryController.dispose();
    _speech.dispose();
    super.dispose();
  }

  Future<void> _toggleListen() async {
    if (_isListening) {
      await _speech.stopListening();
      setState(() => _isListening = false);
      return;
    }
    setState(() {
      _speechError = null;
      _isListening = true;
    });
    await _speech.startListening(
      onText: (text) {
        if (!mounted) return;
        setState(() => _queryController.text = text);
      },
      onError: (msg) {
        if (!mounted) return;
        setState(() {
          _speechError = msg;
          _isListening = false;
        });
      },
    );
  }

  void _submit() {
    final text = _queryController.text.trim();
    if (text.isEmpty) return;
    ref.read(smartReportProvider.notifier).submitQuery(text);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(smartReportProvider);
    final busy = state.isLoading || state.isUpdating || state.isExporting;
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: Text(
          'Reportes inteligentes',
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          final q = _queryController.text.trim();
          if (q.isNotEmpty) {
            await ref.read(smartReportProvider.notifier).submitQuery(q);
          }
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            Text(
              'Consultas en lenguaje natural · Filtros · Exportación',
              style: theme.textTheme.labelMedium?.copyWith(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Describí qué datos necesitás. Si querés archivos, indicá el formato '
              '(por ejemplo: «en excel y pdf»).',
              style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey.shade700),
            ),
            const SizedBox(height: 20),
            ReportQueryBar(
              controller: _queryController,
              isListening: _isListening,
              loading: busy,
              onToggleListen: _toggleListen,
              onSubmit: _submit,
            ),
            if (_speechError != null) ...[
              const SizedBox(height: 8),
              Text(
                _speechError!,
                style: theme.textTheme.bodySmall?.copyWith(color: Colors.red.shade700),
              ),
            ],
            if (state.isLoading) ...[
              const SizedBox(height: 32),
              const Center(child: CircularProgressIndicator()),
              const SizedBox(height: 12),
              Center(
                child: Text(
                  'Generando consulta y ejecutando reporte…',
                  style: theme.textTheme.bodySmall,
                ),
              ),
            ],
            if (state.error != null && !state.isLoading) ...[
              const SizedBox(height: 16),
              _ErrorBanner(message: state.error!),
            ],
            if (state.exportNotice != null) ...[
              const SizedBox(height: 12),
              Material(
                color: AppTheme.primaryColor.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    state.exportNotice!,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
              ),
            ],
            if (state.result != null && !state.isLoading) ...[
              const SizedBox(height: 20),
              ReportResultsSection(
                result: state.result!,
                busy: busy,
                onRemoveFilter: (key) =>
                    ref.read(smartReportProvider.notifier).removeFilter(key),
                onExportExcel: () => ref
                    .read(smartReportProvider.notifier)
                    .exportFormats(['excel']),
                onExportPdf: () =>
                    ref.read(smartReportProvider.notifier).exportFormats(['pdf']),
                onExportBoth: () => ref
                    .read(smartReportProvider.notifier)
                    .exportFormats(['excel', 'pdf']),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'No se pudo completar la solicitud',
            style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFB91C1C)),
          ),
          const SizedBox(height: 4),
          Text(message, style: const TextStyle(color: Color(0xFF991B1B), fontSize: 13)),
        ],
      ),
    );
  }
}
