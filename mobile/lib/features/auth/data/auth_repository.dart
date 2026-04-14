import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../domain/auth_user.dart';

/// Resultado de [AuthRepository.register] (JWT ya guardado).
class RegistrationResult {
  const RegistrationResult({
    required this.user,
    required this.emailConfirmationSent,
  });

  final AuthUser user;
  final bool emailConfirmationSent;
}

class AuthRepository {
  AuthRepository({Dio? dio}) : _dio = dio ?? ApiClient().dio;

  final Dio _dio;

  /// POST `/auth/login/` — body: `email` + `password` (solo correo).
  /// Opcional: [fcmPayload] con `fcm_token` y `plataforma` (registro push en el mismo request).
  Future<AuthUser> login({
    required String email,
    required String password,
    Map<String, String>? fcmPayload,
  }) async {
    try {
      final data = <String, dynamic>{
        'email': email.trim(),
        'password': password,
      };
      if (fcmPayload != null) {
        data.addAll(fcmPayload);
      }
      final response = await _dio.post<Map<String, dynamic>>(
        'auth/login/',
        data: data,
      );
      final resBody = response.data;
      if (resBody == null) {
        throw Exception('Respuesta vacía del servidor.');
      }
      final access = resBody['access'] as String?;
      final refresh = resBody['refresh'] as String?;
      final usuario = resBody['usuario'];
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

  /// POST `/auth/register/` — registro público; guarda JWT igual que [login].
  /// El backend envía correo de confirmación vía SMTP (p. ej. Mailhog en Docker).
  Future<RegistrationResult> register(Map<String, dynamic> body) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        'auth/register/',
        data: body,
      );
      final data = response.data;
      if (data == null) {
        throw Exception('Respuesta vacía del servidor.');
      }
      final access = data['access'] as String?;
      final refresh = data['refresh'] as String?;
      final usuario = data['usuario'];
      if (access == null || refresh == null || usuario is! Map) {
        throw Exception('Formato de respuesta de registro inesperado.');
      }
      await SecureStorageService.saveTokens(
        accessToken: access,
        refreshToken: refresh,
      );
      final rawFlag = data['email_confirmacion_enviada'];
      final emailOk = rawFlag is bool ? rawFlag : true;
      return RegistrationResult(
        user: AuthUser.fromJson(Map<String, dynamic>.from(usuario)),
        emailConfirmationSent: emailOk,
      );
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
        return 'Tiempo de espera agotado. Comprobá que el backend esté corriendo, que API_BASE_URL '
            'en mobile/.env apunte al host y puerto correctos, y que el firewall permita el puerto del API.';
      case DioExceptionType.connectionError:
        return 'Sin conexión al servidor. Revisá API_BASE_URL en mobile/.env (debe coincidir con la URL '
            'pública o de red de tu backend, con sufijo /api). Verificá Docker y el puerto expuesto.';
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
