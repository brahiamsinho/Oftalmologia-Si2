import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/report_file_share.dart';
import '../../data/reportes_repository.dart';
import '../../domain/smart_report_models.dart';

final reportesRepositoryProvider = Provider<ReportesRepository>(
  (ref) => ReportesRepository(),
);

class SmartReportState {
  const SmartReportState({
    this.result,
    this.isLoading = false,
    this.isUpdating = false,
    this.isExporting = false,
    this.error,
    this.exportNotice,
  });

  final NlpToReportResult? result;
  final bool isLoading;
  final bool isUpdating;
  final bool isExporting;
  final String? error;
  final String? exportNotice;

  SmartReportState copyWith({
    NlpToReportResult? result,
    bool? isLoading,
    bool? isUpdating,
    bool? isExporting,
    String? error,
    String? exportNotice,
    bool clearError = false,
    bool clearNotice = false,
  }) {
    return SmartReportState(
      result: result ?? this.result,
      isLoading: isLoading ?? this.isLoading,
      isUpdating: isUpdating ?? this.isUpdating,
      isExporting: isExporting ?? this.isExporting,
      error: clearError ? null : (error ?? this.error),
      exportNotice: clearNotice ? null : (exportNotice ?? this.exportNotice),
    );
  }
}

class SmartReportNotifier extends StateNotifier<SmartReportState> {
  SmartReportNotifier(this._repo) : super(const SmartReportState());

  final ReportesRepository _repo;

  Future<void> submitQuery(String query) async {
    final text = query.trim();
    if (text.isEmpty) return;

    state = state.copyWith(
      isLoading: true,
      clearError: true,
      clearNotice: true,
      result: null,
    );
    try {
      final result = await _repo.nlpToReport(text);
      state = state.copyWith(isLoading: false, result: result);
      if (result.exportFormats.isNotEmpty) {
        await _runExports(result.exportFormats, result.qbe);
      }
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ReportesRepository.messageFromDio(e),
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  Future<void> removeFilter(String key) async {
    final current = state.result;
    if (current == null) return;
    if (!current.qbe.filters.containsKey(key)) return;

    final nextFilters = Map<String, dynamic>.from(current.qbe.filters)
      ..remove(key);
    final nextQbe = current.qbe.copyWith(filters: nextFilters);

    state = state.copyWith(isUpdating: true, clearError: true);
    try {
      final updated = await _repo.executeQbe(nextQbe);
      state = state.copyWith(isUpdating: false, result: updated);
    } on DioException catch (e) {
      state = state.copyWith(
        isUpdating: false,
        error: ReportesRepository.messageFromDio(e),
      );
    } catch (e) {
      state = state.copyWith(
        isUpdating: false,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }

  Future<void> exportFormats(List<String> formats) async {
    final qbe = state.result?.qbe;
    if (qbe == null || formats.isEmpty) return;
    await _runExports(formats, qbe);
  }

  Future<void> _runExports(List<String> formats, QbePayload qbe) async {
    state = state.copyWith(
      isExporting: true,
      exportNotice: 'Exportando ${formats.join(' y ').toUpperCase()}…',
      clearError: true,
    );
    try {
      for (var i = 0; i < formats.length; i++) {
        final format = formats[i];
        final file = await _repo.exportQbe(qbe, format);
        await saveAndShareReportFile(
          bytes: file.bytes,
          filename: file.filename,
        );
        if (i < formats.length - 1) {
          await Future<void>.delayed(const Duration(milliseconds: 400));
        }
      }
      state = state.copyWith(
        isExporting: false,
        exportNotice: 'Archivos listos: ${formats.join(', ').toUpperCase()}.',
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isExporting: false,
        clearNotice: true,
        error: ReportesRepository.messageFromDio(e),
      );
    } catch (e) {
      state = state.copyWith(
        isExporting: false,
        clearNotice: true,
        error: e.toString().replaceFirst('Exception: ', ''),
      );
    }
  }
}

final smartReportProvider =
    StateNotifierProvider<SmartReportNotifier, SmartReportState>((ref) {
  return SmartReportNotifier(ref.watch(reportesRepositoryProvider));
});
