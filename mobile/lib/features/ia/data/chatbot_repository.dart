import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../domain/chatbot_models.dart';

final chatbotRepositoryProvider = Provider<ChatbotRepository>((ref) {
  return ChatbotRepository();
});

class ChatbotRepository {
  ChatbotRepository({Dio? dio}) : _dio = dio ?? ApiClient().dio;

  final Dio _dio;

  static const Duration _chatTimeout = Duration(seconds: 90);

  /// `POST ia/chatbot/` — mensaje + historial corto (máx. 20 en backend).
  Future<ChatbotResponse> postMessage({
    required String message,
    required List<ChatHistoryItem> history,
  }) async {
    final trimmed = message.trim();
    if (trimmed.isEmpty) {
      throw Exception('El mensaje no puede estar vacío.');
    }

    final payloadHistory = history
        .map((h) => h.toJson())
        .toList();

    try {
      final response = await _dio.post<dynamic>(
        'ia/chatbot/',
        data: {
          'message': trimmed,
          'history': payloadHistory,
        },
        options: Options(
          receiveTimeout: _chatTimeout,
          sendTimeout: _chatTimeout,
        ),
      );
      final data = response.data;
      if (data is! Map<String, dynamic>) {
        throw Exception('Respuesta inválida del servidor.');
      }
      final reply = data['reply'] as String? ?? '';
      if (reply.isEmpty) {
        final detail = data['detail'];
        throw Exception(
          detail is String ? detail : 'El asistente no devolvió respuesta.',
        );
      }
      return ChatbotResponse.fromJson(data);
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
    if (code == 503) {
      final body = e.response?.data;
      if (body is Map && body['detail'] is String) {
        return body['detail'] as String;
      }
      return 'El servicio de IA no está disponible.';
    }
    final body = e.response?.data;
    if (body is Map && body['detail'] is String) {
      return body['detail'] as String;
    }
    return 'No se pudo obtener respuesta del asistente.';
  }
}
