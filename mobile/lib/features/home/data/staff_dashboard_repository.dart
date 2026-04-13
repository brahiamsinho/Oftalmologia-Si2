import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/drf_page.dart';
import '../domain/cita_resumen.dart';

/// KPIs del panel staff alineados al dashboard web (conteos vía paginación DRF).
class StaffDashboardData {
  const StaffDashboardData({
    this.pacientesCount,
    this.citasTotales,
    this.citasAtendidas,
    this.especialistasCount,
    this.proximasCitas = const [],
    this.loadError,
  });

  /// `null` si el rol no tiene permiso (p. ej. médico sin acceso a `/pacientes/`).
  final int? pacientesCount;
  final int? citasTotales;
  final int? citasAtendidas;
  final int? especialistasCount;
  final List<CitaResumen> proximasCitas;
  final String? loadError;
}

final staffDashboardRepositoryProvider = Provider<StaffDashboardRepository>((ref) {
  return StaffDashboardRepository();
});

final staffDashboardProvider = FutureProvider.autoDispose<StaffDashboardData>((ref) {
  return ref.read(staffDashboardRepositoryProvider).load();
});

class StaffDashboardRepository {
  StaffDashboardRepository({Dio? dio}) : _dio = dio ?? ApiClient().dio;

  final Dio _dio;

  Future<int?> _count(String path, {Map<String, dynamic>? query}) async {
    try {
      final res = await _dio.get<dynamic>(path, queryParameters: {...?query, 'page': 1});
      return drfCountFromResponse(res.data);
    } on DioException catch (e) {
      if (e.response?.statusCode == 403) return null;
      rethrow;
    }
  }

  Future<StaffDashboardData> load() async {
    try {
      final pacientes = await _count('pacientes/');
      final citasTotales = await _count('citas/', query: {'ordering': 'fecha_hora_inicio'});
      final citasAtendidas = await _count('citas/', query: {'estado': 'ATENDIDA'});
      final especialistas = await _count('especialistas/', query: {'activo': 'true'});

      final citasRes = await _dio.get<dynamic>(
        'citas/',
        queryParameters: {'ordering': 'fecha_hora_inicio', 'page': 1},
      );
      final rawList = drfResultsFromResponse(citasRes.data);
      final proximas = rawList
          .map((e) => CitaResumen.fromJson(Map<String, dynamic>.from(e as Map)))
          .take(5)
          .toList();

      return StaffDashboardData(
        pacientesCount: pacientes,
        citasTotales: citasTotales,
        citasAtendidas: citasAtendidas,
        especialistasCount: especialistas,
        proximasCitas: proximas,
      );
    } catch (e) {
      return const StaffDashboardData(
        loadError: 'No se pudo cargar el panel. Revisá la conexión y API_BASE_URL.',
      );
    }
  }
}
