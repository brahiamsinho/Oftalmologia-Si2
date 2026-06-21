import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/documento_clinico_autorizado.dart';
import '../domain/consulta_resumen.dart';
import '../domain/estudio_resumen.dart';

final clinicalRepositoryProvider = Provider<ClinicalRepository>((ref) {
  return ClinicalRepository();
});

class ClinicalRepository {
  ClinicalRepository({Dio? dio}) : _dio = dio ?? ApiClient().dio;

  final Dio _dio;

  Future<List<ConsultaResumen>> listConsultasMine() async {
    try {
      final response = await _dio.get<dynamic>('consultas/lista/');
      final raw = _extractResults(response.data);
      return raw
          .map(
            (e) => ConsultaResumen.fromJson(Map<String, dynamic>.from(e as Map)),
          )
          .toList();
    } on DioException catch (e) {
      throw Exception(_message(e, 'consultas'));
    }
  }

  Future<List<EstudioResumen>> listEstudiosMine() async {
    try {
      final estResponse = await _dio.get<dynamic>('consultas/estudios/');
      final mvResponse = await _dio.get<dynamic>('medicion-visual/registros/');
      final estRaw = _extractResults(estResponse.data);
      final mvRaw = _extractResults(mvResponse.data);
      final fromEst = estRaw
          .map(
            (e) => EstudioResumen.fromJson(Map<String, dynamic>.from(e as Map)),
          )
          .toList();
      final fromMv = mvRaw.map((e) {
        final m = Map<String, dynamic>.from(e as Map);
        return EstudioResumen.fromJson({
          ...m,
          'tipo_estudio': 'agudeza_visual',
        });
      }).toList();
      final all = [...fromMv, ...fromEst];
      all.sort((a, b) => b.fecha.compareTo(a.fecha));
      return all;
    } on DioException catch (e) {
      throw Exception(_message(e, 'estudios'));
    }
  }

  Future<List<DocumentoClinicoAutorizado>> listDocumentosMine() async {
    try {
      final response = await _dio.get<dynamic>('mis-documentos-clinicos/');
      final raw = _extractResults(response.data);
      return raw
          .map((e) => DocumentoClinicoAutorizado.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw Exception(_message(e, 'documentos'));
    }
  }

  Future<List<int>> downloadDocumentoMine(int documentoId) async {
    try {
      final response = await _dio.get<List<int>>(
        'mis-documentos-clinicos/$documentoId/download/',
        options: Options(responseType: ResponseType.bytes),
      );
      return response.data ?? const <int>[];
    } on DioException catch (e) {
      throw Exception(_message(e, 'documento'));
    }
  }

  static List<dynamic> _extractResults(dynamic data) {
    if (data is List<dynamic>) return data;
    if (data is Map<String, dynamic> && data['results'] is List<dynamic>) {
      return data['results'] as List<dynamic>;
    }
    return [];
  }

  static String _message(DioException e, String recurso) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return 'Tiempo de espera agotado. Revisá tu conexión.';
      case DioExceptionType.connectionError:
        return 'Sin conexión al servidor.';
      default:
        break;
    }
    final code = e.response?.statusCode;
    if (code == 401 || code == 403) {
      return 'No autorizado para ver $recurso.';
    }
    return 'No pudimos cargar los $recurso.';
  }
}
