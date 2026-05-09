import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/cita_resumen.dart';

final citasRepositoryProvider = Provider<CitasRepository>((ref) {
  return CitasRepository();
});

class CitasRepository {
  CitasRepository({Dio? dio}) : _dio = dio ?? ApiClient().dio;

  final Dio _dio;

  /// GET `citas/?ordering=fecha_hora_inicio` — el backend filtra por rol (paciente → solo sus citas).
  Future<List<CitaResumen>> listMine() async {
    try {
      final response = await _dio.get<dynamic>(
        'citas/',
        queryParameters: {'ordering': 'fecha_hora_inicio'},
      );
      final data = response.data;
      final raw = _extractResults(data);
      return raw
          .map((e) => CitaResumen.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } on DioException catch (e) {
      throw Exception(_message(e));
    }
  }

  static List<dynamic> _extractResults(dynamic data) {
    if (data is List<dynamic>) return data;
    if (data is Map<String, dynamic> && data['results'] is List<dynamic>) {
      return data['results'] as List<dynamic>;
    }
    return [];
  }

  static String _message(DioException e) {
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
      return 'No autorizado para ver citas.';
    }
    return 'No pudimos cargar las citas.';
  }

  /// POST `citas/` — agenda una nueva cita para el paciente autenticado.
  /// El backend asigna automáticamente el paciente según el usuario logueado.
  Future<Map<String, dynamic>> scheduleAppointment({
    required int idEspecialista,
    required int idTipoCita,
    required String fechaHoraInicio,
    required String fechaHoraFin,
    String? motivo,
    String? observaciones,
  }) async {
    try {
      final data = <String, dynamic>{
        'id_especialista': idEspecialista,
        'id_tipo_cita': idTipoCita,
        'fecha_hora_inicio': fechaHoraInicio,
        'fecha_hora_fin': fechaHoraFin,
      };
      if (motivo != null && motivo.isNotEmpty) data['motivo'] = motivo;
      if (observaciones != null && observaciones.isNotEmpty) {
        data['observaciones'] = observaciones;
      }
      final response = await _dio.post<Map<String, dynamic>>('citas/', data: data);
      final resBody = response.data;
      if (resBody == null) {
        throw Exception('Respuesta vacía del servidor.');
      }
      return resBody;
    } on DioException catch (e) {
      throw Exception(_message(e));
    }
  }

  /// GET `especialistas-disponibles/` — lista de especialistas activos para pacientes.
  Future<List<Map<String, dynamic>>> getAvailableSpecialists() async {
    try {
      final response = await _dio.get<dynamic>('especialistas-disponibles/');
      final data = response.data;
      final raw = _extractResults(data);
      return raw
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
    } on DioException catch (e) {
      throw Exception(_message(e));
    }
  }

  /// GET `tipos-cita/` — tipos de cita disponibles.
  Future<List<Map<String, dynamic>>> getAppointmentTypes() async {
    try {
      final response = await _dio.get<dynamic>('tipos-cita/');
      final data = response.data;
      final raw = _extractResults(data);
      return raw
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
    } on DioException catch (e) {
      throw Exception(_message(e));
    }
  }
}
