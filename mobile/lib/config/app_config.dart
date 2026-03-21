import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Configuración de la aplicación.
class AppConfig {
  AppConfig._();

  /// URL base del API backend.
  static String get apiBaseUrl =>
      dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:8000/api/v1';

  /// Nombre de la aplicación.
  static String get appName =>
      dotenv.env['APP_NAME'] ?? 'Oftalmología Si2';

  /// Timeout para request HTTP (milisegundos).
  static const int httpTimeout = 15000;

  /// Versión de la API.
  static const String apiVersion = 'v1';
}
