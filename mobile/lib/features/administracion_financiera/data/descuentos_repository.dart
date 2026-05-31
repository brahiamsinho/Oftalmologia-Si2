import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/descuento_beneficio.dart';

final descuentosRepositoryProvider = Provider<DescuentosRepository>((_) => DescuentosRepository());

/// CU20 — Descuentos y campañas: beneficios activos del paciente autenticado.
class DescuentosRepository {
  DescuentosRepository({Dio? dio}) : _dio = dio ?? ApiClient().dio;

  final Dio _dio;

  /// GET `descuentos/beneficios/` — beneficios asignados al paciente.
  Future<List<BeneficioPaciente>> fetchMisBeneficios() async {
    try {
      final response = await _dio.get<dynamic>('descuentos/beneficios/');
      final raw = response.data;
      final list = raw is Map ? (raw['results'] as List? ?? []) : raw as List;
      return list
          .map((e) => BeneficioPaciente.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  /// GET `descuentos/promociones/?vigente=true` — promociones disponibles.
  Future<List<PromocionDescuento>> fetchPromocionesVigentes() async {
    try {
      final response = await _dio.get<dynamic>(
        'descuentos/promociones/',
        queryParameters: {'vigente': 'true'},
      );
      final raw = response.data;
      final list = raw is Map ? (raw['results'] as List? ?? []) : raw as List;
      return list
          .map((e) => PromocionDescuento.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  static String _msg(DioException e) {
    final code = e.response?.statusCode;
    if (code == 401 || code == 403) return 'No autorizado para ver descuentos.';
    if (e.type == DioExceptionType.connectionError) return 'Sin conexión al servidor.';
    return 'No se pudieron cargar los descuentos.';
  }
}
