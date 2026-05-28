import 'package:flutter/material.dart';

import '../../../../config/theme.dart';
import '../../domain/smart_report_models.dart';

class ReportResultsSection extends StatelessWidget {
  const ReportResultsSection({
    super.key,
    required this.result,
    required this.busy,
    required this.onRemoveFilter,
    required this.onExportExcel,
    required this.onExportPdf,
    required this.onExportBoth,
  });

  final NlpToReportResult result;
  final bool busy;
  final void Function(String key) onRemoveFilter;
  final VoidCallback onExportExcel;
  final VoidCallback onExportPdf;
  final VoidCallback onExportBoth;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final filters = result.qbe.filters;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Resultados',
              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            const Spacer(),
            Text(
              '${result.meta.totalRecords} registro(s)',
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Chip(
              label: Text('Modelo: ${result.qbe.model}'),
              backgroundColor: Colors.indigo.shade50,
            ),
            ...filters.entries.map(
              (e) => InputChip(
                label: Text('${e.key}: ${e.value}'),
                onDeleted: busy ? null : () => onRemoveFilter(e.key),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          children: [
            OutlinedButton.icon(
              onPressed: busy ? null : onExportExcel,
              icon: const Icon(Icons.table_chart_outlined, size: 18),
              label: const Text('Excel'),
            ),
            OutlinedButton.icon(
              onPressed: busy ? null : onExportPdf,
              icon: const Icon(Icons.picture_as_pdf_outlined, size: 18),
              label: const Text('PDF'),
            ),
            FilledButton.tonalIcon(
              onPressed: busy ? null : onExportBoth,
              icon: const Icon(Icons.download_outlined, size: 18),
              label: const Text('Ambos'),
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.12),
                foregroundColor: AppTheme.primaryColor,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (result.rows.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(child: Text('No hay datos para mostrar.')),
          )
        else
          _ReportDataTable(columns: result.columns, rows: result.rows),
      ],
    );
  }
}

class _ReportDataTable extends StatelessWidget {
  const _ReportDataTable({required this.columns, required this.rows});

  final List<String> columns;
  final List<Map<String, dynamic>> rows;

  @override
  Widget build(BuildContext context) {
    final cols = columns.isNotEmpty
        ? columns
        : (rows.isNotEmpty ? rows.first.keys.toList() : <String>[]);

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(Colors.grey.shade100),
          columns: cols
              .map(
                (c) => DataColumn(
                  label: Text(
                    c.replaceAll('_', ' ').toUpperCase(),
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                  ),
                ),
              )
              .toList(),
          rows: rows
              .map(
                (row) => DataRow(
                  cells: cols
                      .map(
                        (c) => DataCell(
                          Text(
                            '${row[c] ?? ''}',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                      )
                      .toList(),
                ),
              )
              .toList(),
        ),
      ),
    );
  }
}
