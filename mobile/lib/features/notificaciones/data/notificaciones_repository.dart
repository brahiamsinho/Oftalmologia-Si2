import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/notificacion.dart';

final notificacionesRepositoryProvider = Provider<NotificacionesRepository>((ref) {
  return NotificacionesRepository();
});

class NotificacionesRepository {
  NotificacionesRepository({Dio? dio}) : _dio = dio ?? ApiClient().dio;

  final Dio _dio;

  /// GET `notificaciones/` — historial del usuario autenticado (máx. 50).
  Future<({List<Notificacion> items, int noLeidas})> fetchMias() async {
    try {
      final response = await _dio.get<dynamic>('notificaciones/');
      final body = response.data as Map<String, dynamic>;
      final results = body['results'] as List<dynamic>? ?? [];
      final noLeidas = body['no_leidas'] as int? ?? 0;
      final items = results
          .map((e) => Notificacion.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      return (items: items, noLeidas: noLeidas);
    } on DioException catch (e) {
      throw Exception(_message(e));
    }
  }

  /// POST `notificaciones/{id}/leer/` — marca una notificación como leída.
  Future<Notificacion> marcarLeida(int id) async {
    try {
      final response = await _dio.post<dynamic>('notificaciones/$id/leer/');
      return Notificacion.fromJson(Map<String, dynamic>.from(response.data as Map));
    } on DioException catch (e) {
      throw Exception(_message(e));
    }
  }

  /// POST `notificaciones/leer-todas/` — marca todas como leídas.
  Future<void> marcarTodasLeidas() async {
    try {
      await _dio.post<dynamic>('notificaciones/leer-todas/');
    } on DioException catch (e) {
      throw Exception(_message(e));
    }
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
    if (code == 401 || code == 403) return 'No autorizado.';
    return 'No pudimos cargar las notificaciones.';
  }
}
