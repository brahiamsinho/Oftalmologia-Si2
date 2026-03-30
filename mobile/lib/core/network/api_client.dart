import 'package:dio/dio.dart';

import '../../config/app_config.dart';
import '../storage/secure_storage.dart';

/// Cliente HTTP configurado con Dio.
/// Maneja autenticación JWT automáticamente (tokens en [SecureStorageService]).
class ApiClient {
  static ApiClient? _instance;
  late final Dio _dio;

  ApiClient._() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(milliseconds: AppConfig.httpTimeout),
        receiveTimeout: const Duration(milliseconds: AppConfig.httpTimeout),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await SecureStorageService.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            final refreshed = await _refreshToken();
            if (refreshed) {
              final token = await SecureStorageService.getAccessToken();
              if (token != null) {
                error.requestOptions.headers['Authorization'] = 'Bearer $token';
              }
              try {
                final response = await _dio.fetch(error.requestOptions);
                return handler.resolve(response);
              } catch (_) {
                /* cae al handler.next */
              }
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  factory ApiClient() {
    _instance ??= ApiClient._();
    return _instance!;
  }

  Dio get dio => _dio;

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await SecureStorageService.getRefreshToken();
      if (refreshToken == null) return false;

      final response = await Dio().post<Map<String, dynamic>>(
        '${AppConfig.apiBaseUrl}auth/token/refresh/',
        data: {'refresh': refreshToken},
      );

      final access = response.data?['access'] as String?;
      if (access == null) return false;

      await SecureStorageService.saveTokens(
        accessToken: access,
        refreshToken:
            response.data?['refresh'] as String? ?? refreshToken,
      );

      return true;
    } catch (_) {
      await SecureStorageService.clearAll();
      return false;
    }
  }
}
