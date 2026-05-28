import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../domain/smart_report_models.dart';

typedef ExportFormat = String; // excel | pdf | csv

class ReportesRepository {
  ReportesRepository({Dio? dio}) : _dio = dio ?? ApiClient().dio;

  final Dio _dio;

  static const _nlpTimeout = Duration(seconds: 120);
  static const _exportTimeout = Duration(seconds: 90);

  /// POST `ia/nlp-to-report/`
  Future<NlpToReportResult> nlpToReport(String query) async {
    final response = await _dio.post<Map<String, dynamic>>(
      'ia/nlp-to-report/',
      data: {'query': query.trim()},
      options: Options(
        receiveTimeout: _nlpTimeout,
        sendTimeout: _nlpTimeout,
      ),
    );
    final data = response.data;
    if (data == null) {
      throw Exception('Respuesta vacía del servidor.');
    }
    final detail = data['detail'];
    if (detail != null && data['report'] == null) {
      throw Exception(detail is String ? detail : detail.toString());
    }

    final qbeJson = data['qbe'];
    if (qbeJson is! Map) {
      throw Exception('La IA no devolvió una consulta válida.');
    }
    final qbe = QbePayload.fromJson(Map<String, dynamic>.from(qbeJson));

    final report = data['report'];
    if (report is! Map) {
      throw Exception('No se pudo ejecutar el reporte.');
    }
    final reportMap = Map<String, dynamic>.from(report);
    final meta = ReportMeta.fromJson(reportMap);
    final rows = _rowsFromReport(reportMap);

    final formats = (data['export_formats'] as List?)
            ?.map((e) => e.toString())
            .where((f) => f == 'excel' || f == 'pdf' || f == 'csv')
            .toList() ??
        const <String>[];

    return NlpToReportResult(
      qbe: qbe,
      columns: meta.columns,
      rows: rows,
      meta: meta,
      exportFormats: formats,
    );
  }

  /// POST `reportes-qbe/plantillas/execute/`
  Future<NlpToReportResult> executeQbe(QbePayload qbe) async {
    final response = await _dio.post<Map<String, dynamic>>(
      'reportes-qbe/plantillas/execute/',
      data: qbe.toJson(),
      options: Options(receiveTimeout: _exportTimeout),
    );
    final data = response.data;
    if (data == null) throw Exception('Respuesta vacía del servidor.');
    final meta = ReportMeta.fromJson(data);
    return NlpToReportResult(
      qbe: qbe,
      columns: meta.columns,
      rows: _rowsFromReport(data),
      meta: meta,
      exportFormats: const [],
    );
  }

  Future<({List<int> bytes, String filename})> exportQbe(
    QbePayload qbe,
    ExportFormat format,
  ) async {
    final path = switch (format) {
      'pdf' => 'reportes-qbe/plantillas/export-pdf/',
      'csv' => 'reportes-qbe/plantillas/export-csv/',
      _ => 'reportes-qbe/plantillas/export-excel/',
    };
    final response = await _dio.post<List<int>>(
      path,
      data: qbe.toJson(),
      options: Options(
        responseType: ResponseType.bytes,
        receiveTimeout: _exportTimeout,
        headers: {'Accept': '*/*'},
      ),
    );
    final bytes = response.data;
    if (bytes == null || bytes.isEmpty) {
      throw Exception('El archivo exportado está vacío.');
    }
    final filename = _filenameFromHeaders(
      response.headers.value('content-disposition'),
      format,
      qbe.model,
    );
    return (bytes: bytes, filename: filename);
  }

  List<Map<String, dynamic>> _rowsFromReport(Map<String, dynamic> report) {
    final raw = report['data'];
    if (raw is! List) return const [];
    return raw
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  String _filenameFromHeaders(
    String? disposition,
    String format,
    String model,
  ) {
    if (disposition != null) {
      final match = RegExp(r'filename="?([^";\n]+)').firstMatch(disposition);
      if (match != null) return match.group(1)!.trim();
    }
    final ext = switch (format) {
      'pdf' => 'pdf',
      'csv' => 'csv',
      _ => 'xlsx',
    };
    final slug = model.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-');
    return 'reporte-${slug.isEmpty ? 'datos' : slug}.$ext';
  }

  static String messageFromDio(DioException e) {
    final data = e.response?.data;
    if (data is Map) {
      final detail = data['detail'];
      if (detail is String) return detail;
      if (detail is List && detail.isNotEmpty) return detail.first.toString();
    }
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return 'Tiempo de espera agotado. Revisá la conexión y GEMINI_API_KEY en el backend.';
    }
    if (e.type == DioExceptionType.connectionError) {
      return 'Sin conexión al servidor. Revisá API_BASE_URL y TENANT_SLUG en mobile/.env.';
    }
    return 'No se pudo completar la solicitud.';
  }
}
