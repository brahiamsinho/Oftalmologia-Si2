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
      dotenv.env['APP_NAME']?.trim().isNotEmpty == true
          ? dotenv.env['APP_NAME']!.trim()
          : 'Oftalmología Si2';

  /// Subtítulo bajo el título de login (configurable por entorno).
  static String get loginSubtitle {
    final s = dotenv.env['LOGIN_SUBTITLE']?.trim();
    if (s != null && s.isNotEmpty) return s;
    return 'Accedé con tu correo y contraseña de forma segura.';
  }

  /// URL opcional para "Términos" (p. ej. sitio de la clínica). Si falta, la app muestra aviso.
  static String? get legalTermsUrl {
    final s = dotenv.env['LEGAL_TERMS_URL']?.trim();
    return (s != null && s.isNotEmpty) ? s : null;
  }

  /// URL opcional para "Privacidad".
  static String? get legalPrivacyUrl {
    final s = dotenv.env['LEGAL_PRIVACY_URL']?.trim();
    return (s != null && s.isNotEmpty) ? s : null;
  }

  /// Interfaz web de Mailhog (dev). Emulador Android típico: `http://10.0.2.2:8025`.
  /// En físico: IP de tu PC + puerto UI (8025 por defecto en Docker del repo).
  ///
  /// 1) Definí `MAILHOG_WEB_URL` explícitamente, o
  /// 2) `MAILHOG_INFER_FROM_API=true` para armar `http(s)://<mismo host que API>:MAILHOG_UI_PORT/`
  ///    (útil si ya tenés `API_BASE_URL` con la IP de tu PC y no querés duplicarla).
  static String? get mailhogWebUrl {
    final explicit = dotenv.env['MAILHOG_WEB_URL']?.trim();
    if (explicit != null && explicit.isNotEmpty) return explicit;

    if (!_envTruthy(dotenv.env['MAILHOG_INFER_FROM_API'])) return null;

    try {
      final raw = dotenv.env['API_BASE_URL']?.trim();
      if (raw == null || raw.isEmpty) return null;
      final normalized = raw.contains('://') ? raw : 'http://$raw';
      final u = Uri.parse(normalized);
      if (u.host.isEmpty) return null;
      final portStr = dotenv.env['MAILHOG_UI_PORT']?.trim() ?? '8025';
      final mhPort = int.tryParse(portStr) ?? 8025;
      final scheme = u.scheme == 'https' ? 'http' : u.scheme;
      return Uri(scheme: scheme.isEmpty ? 'http' : scheme, host: u.host, port: mhPort)
          .toString();
    } catch (_) {
      return null;
    }
  }

  static bool _envTruthy(String? v) {
    final s = v?.trim().toLowerCase();
    return s == '1' || s == 'true' || s == 'yes' || s == 'on';
  }

  /// Timeout para request HTTP (milisegundos). Subido para dar margen al arranque de Docker/Postgres.
  static const int httpTimeout = 30000;

  /// Teléfono de la clínica (emergencias / agendar). Opcional; si falta, la app muestra un aviso genérico.
  static String? get clinicPhone {
    final s = dotenv.env['CLINIC_PHONE']?.trim();
    return (s != null && s.isNotEmpty) ? s : null;
  }
}
