import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/network/drf_page.dart';

/// Listado de pacientes para staff (solo roles con permiso; otros reciben 403).
final staffPacientesListProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ApiClient().dio;
  try {
    final res = await dio.get<dynamic>(
      'pacientes/',
      queryParameters: {'page': 1, 'page_size': 50},
    );
    final raw = drfResultsFromResponse(res.data);
    return raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  } on DioException catch (e) {
    if (e.response?.statusCode == 403) {
      throw StaffPacientesForbidden();
    }
    rethrow;
  }
});

class StaffPacientesForbidden implements Exception {}
