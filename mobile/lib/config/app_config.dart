import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Configuración de la aplicación.
class AppConfig {
  AppConfig._();

  /// URL base del API **con barra final** (`.../api/`).
  /// Sin ella, Dio concatena mal y termina en rutas tipo `/apiauth/login/`.
  /// Definir `API_BASE_URL` en `mobile/.env` (ver `mobile/.env.example`).
  static String get apiBaseUrl {
    final raw = dotenv.env['API_BASE_URL']?.trim();
    if (raw == null || raw.isEmpty) {
      throw StateError(
        'API_BASE_URL no está definida en mobile/.env. Copiá mobile/.env.example a mobile/.env.',
      );
    }
    final noTrail = raw.replaceAll(RegExp(r'/+$'), '');
    return '$noTrail/';
  }

  /// Nombre de la aplicación.
  static String get appName =>
      dotenv.env['APP_NAME'] ?? 'Oftalmología Si2';

  /// Timeout para request HTTP (milisegundos). Subido para dar margen al arranque de Docker/Postgres.
  static const int httpTimeout = 30000;

  /// Etiqueta de versión de API (informativa; las rutas reales vienen de Dio + base URL).
  static const String apiVersion = 'v1';
}
