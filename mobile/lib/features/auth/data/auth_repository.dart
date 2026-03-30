import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../domain/auth_user.dart';

class AuthRepository {
  AuthRepository({Dio? dio}) : _dio = dio ?? ApiClient().dio;

  final Dio _dio;

  /// POST `/auth/login/` — body: `email` + `password` (solo correo).
  Future<AuthUser> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        'auth/login/',
        data: {
          'email': email.trim(),
          'password': password,
        },
      );
      final data = response.data;
      if (data == null) {
        throw Exception('Respuesta vacía del servidor.');
      }
      final access = data['access'] as String?;
      final refresh = data['refresh'] as String?;
      final usuario = data['usuario'];
      if (access == null || refresh == null || usuario is! Map) {
        throw Exception('Formato de respuesta de login inesperado.');
      }
      await SecureStorageService.saveTokens(
        accessToken: access,
        refreshToken: refresh,
      );
      return AuthUser.fromJson(Map<String, dynamic>.from(usuario));
    } on DioException catch (e) {
      throw Exception(_messageFromDio(e));
    }
  }

  /// POST `/auth/logout/` con refresh en body; limpia almacenamiento local.
  Future<void> logout() async {
    final refresh = await SecureStorageService.getRefreshToken();
    if (refresh != null) {
      try {
        await _dio.post<void>('auth/logout/', data: {'refresh': refresh});
      } catch (_) {
        // Ignorar: el token puede estar expirado; igual limpiamos local.
      }
    }
    await SecureStorageService.clearTokens();
  }

  static String _messageFromDio(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return 'Tiempo de espera agotado. Comprobá que el backend esté corriendo (docker-compose), '
            'que API_BASE_URL en mobile/.env sea correcta para tu dispositivo/emulador, y el firewall de Windows.';
      case DioExceptionType.connectionError:
        return 'Sin conexión al servidor. Revisá API_BASE_URL en mobile/.env '
            '(emulador Android: http://10.0.2.2:8000/api; iOS simulator: http://127.0.0.1:8000/api; '
            'teléfono físico: http://IP_DE_TU_PC:8000/api). Verificá que Docker/backend esté en el puerto 8000.';
      default:
        break;
    }
    final data = e.response?.data;
    if (data is Map) {
      final map = Map<String, dynamic>.from(data);
      final detail = map['detail'];
      if (detail is String) return detail;
      if (detail is List && detail.isNotEmpty) {
        return detail.first.toString();
      }
      for (final v in map.values) {
        if (v is List && v.isNotEmpty) {
          final first = v.first;
          if (first is String) return first;
          return first.toString();
        }
        if (v is String) return v;
        if (v is Map) {
          final nested = _firstStringFromNested(Map<String, dynamic>.from(v));
          if (nested != null) return nested;
        }
      }
    }
    if (e.response?.statusCode == 401 || e.response?.statusCode == 400) {
      return 'Credenciales incorrectas o cuenta no disponible.';
    }
    return 'No se pudo iniciar sesión. Intentá de nuevo.';
  }

  static String? _firstStringFromNested(Map<String, dynamic> m) {
    for (final v in m.values) {
      if (v is List && v.isNotEmpty) return v.first.toString();
      if (v is String) return v;
    }
    return null;
  }
}
