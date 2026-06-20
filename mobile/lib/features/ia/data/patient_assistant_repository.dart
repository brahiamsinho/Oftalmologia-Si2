import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/patient_assistant_models.dart';

final patientAssistantRepositoryProvider = Provider<PatientAssistantRepository>((ref) {
  return PatientAssistantRepository();
});

class PatientAssistantRepository {
  PatientAssistantRepository({Dio? dio}) : _dio = dio ?? ApiClient().dio;

  final Dio _dio;

  static const Duration _timeout = Duration(seconds: 30);

  Future<PatientAssistantInteraction> postMessage({
    required String message,
    required String conversationId,
  }) async {
    final trimmed = message.trim();
    if (trimmed.isEmpty) {
      throw Exception('El mensaje no puede estar vacío.');
    }

    try {
      final response = await _dio.post<dynamic>(
        'inteligencia-artificial/asistente-virtual/',
        data: {
          'mensaje': trimmed,
          'id_conversacion': conversationId,
        },
        options: Options(
          sendTimeout: _timeout,
          receiveTimeout: _timeout,
        ),
      );

      final data = response.data;
      if (data is! Map<String, dynamic>) {
        throw Exception('Respuesta inválida del servidor.');
      }

      return PatientAssistantInteraction.fromJson(data);
    } on DioException catch (e) {
      throw Exception(_message(e));
    }
  }

  Future<List<PatientAssistantInteraction>> getHistory({required String conversationId}) async {
    try {
      final response = await _dio.get<dynamic>(
        'inteligencia-artificial/interacciones-asistente/',
        queryParameters: {'id_conversacion': conversationId},
      );

      final data = response.data;
      if (data is List) {
        return data
            .whereType<Map>()
            .map((item) => PatientAssistantInteraction.fromJson(
                  item.map((k, v) => MapEntry(k.toString(), v)),
                ))
            .toList();
      }
      if (data is Map<String, dynamic>) {
        final results = data['results'];
        if (results is List) {
          return results
              .whereType<Map>()
              .map((item) => PatientAssistantInteraction.fromJson(
                    item.map((k, v) => MapEntry(k.toString(), v)),
                  ))
              .toList();
        }
      }
      return const [];
    } on DioException catch (e) {
      throw Exception(_message(e));
    }
  }

  static String _message(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return 'La consulta tardó demasiado. Revisá tu conexión.';
      case DioExceptionType.connectionError:
        return 'Sin conexión al servidor.';
      default:
        break;
    }
    final code = e.response?.statusCode;
    if (code == 401) return 'Sesión expirada. Volvé a iniciar sesión.';
    if (code == 403) return 'No tenés permiso para usar el asistente.';
    final body = e.response?.data;
    if (body is Map && body['detail'] is String) return body['detail'] as String;
    if (body is Map && body['mensaje'] is String) return body['mensaje'] as String;
    return 'No se pudo obtener respuesta del asistente.';
  }
}
