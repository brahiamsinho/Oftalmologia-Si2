import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/seguro_cobertura.dart';

final segurosRepositoryProvider = Provider<SegurosRepository>((_) => SegurosRepository());

/// CU19 — Seguros y convenios: cobertura del paciente autenticado.
class SegurosRepository {
  SegurosRepository({Dio? dio}) : _dio = dio ?? ApiClient().dio;

  final Dio _dio;

  /// GET `seguros/afiliaciones/` — afiliaciones activas del paciente.
  Future<List<AfiliacionSeguro>> fetchMisAfiliaciones() async {
    try {
      final response = await _dio.get<dynamic>('seguros/afiliaciones/');
      final raw = response.data;
      final list = raw is Map ? (raw['results'] as List? ?? [raw]) : raw as List;
      return list
          .map((e) => AfiliacionSeguro.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  static String _msg(DioException e) {
    final code = e.response?.statusCode;
    if (code == 401 || code == 403) return 'No autorizado para ver seguros.';
    if (e.type == DioExceptionType.connectionError) return 'Sin conexión al servidor.';
    return 'No se pudo cargar la cobertura de seguro.';
  }
}
