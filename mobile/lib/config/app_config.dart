import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Configuración de la aplicación.
class AppConfig {
  AppConfig._();

  /// URL base del API **con barra final** (`.../api/`).
  /// Sin ella, Dio concatena mal y termina en rutas tipo `/apiauth/login/`.
  static String get apiBaseUrl {
    final raw = dotenv.env['API_BASE_URL']?.trim();
    final base = (raw == null || raw.isEmpty)
        ? 'http://10.0.2.2:8000/api'
        : raw;
    final noTrail = base.replaceAll(RegExp(r'/+$'), '');
    return '$noTrail/';
  }

  /// Nombre de la aplicación.
  static String get appName =>
      dotenv.env['APP_NAME'] ?? 'Oftalmología Si2';

  /// Timeout para request HTTP (milisegundos). Subido para dar margen al arranque de Docker/Postgres.
  static const int httpTimeout = 30000;

  /// Versión de la API.
  static const String apiVersion = 'v1';
}
