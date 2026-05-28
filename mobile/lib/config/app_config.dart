import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Configuración de la aplicación.
class AppConfig {
  AppConfig._();
  static String? _runtimeTenantSlug;

  static void setRuntimeTenantSlug(String? slug) {
    final s = slug?.trim();
    _runtimeTenantSlug = (s == null || s.isEmpty) ? null : s;
  }

  /// URL base del API **con barra final** (`.../api/`).
  /// Sin ella, Dio concatena mal y termina en rutas tipo `/apiauth/login/`.
  /// Definir `API_BASE_URL` en `mobile/.env` (ver `mobile/.env.example`).
  /// Slug del tenant (clínica). Usado si `API_BASE_URL` no incluye `/t/<slug>/`.
  static String get tenantSlug {
    final runtime = _runtimeTenantSlug?.trim();
    if (runtime != null && runtime.isNotEmpty) return runtime;
    final s = dotenv.env['TENANT_SLUG']?.trim();
    return (s != null && s.isNotEmpty) ? s : 'clinica-demo';
  }

  static String get apiBaseUrl {
    final raw = dotenv.env['API_BASE_URL']?.trim();
    if (raw == null || raw.isEmpty) {
      throw StateError(
        'API_BASE_URL no está definida en mobile/.env. Copiá mobile/.env.example a mobile/.env.',
      );
    }
    return _resolveTenantApiBaseUrl(raw, tenantSlug);
  }

  /// URL base para endpoints públicos no tenant (e.g. `/api/public/...`).
  static String get publicApiBaseUrl {
    final raw = dotenv.env['API_BASE_URL']?.trim();
    if (raw == null || raw.isEmpty) {
      throw StateError(
        'API_BASE_URL no está definida en mobile/.env. Copiá mobile/.env.example a mobile/.env.',
      );
    }
    return _resolvePublicApiBaseUrl(raw);
  }

  /// Convierte base API a tenant base:
  /// `http://host:8000/api` -> `http://host:8000/t/<slug>/api/`
  /// `http://host:8000/t/demo/api` -> `http://host:8000/t/<slug>/api/`
  static String _resolveTenantApiBaseUrl(String raw, String slug) {
    final base = _normalizeBaseApi(raw);
    final tenantPath = _composePath(base.prefixPath, '/t/$slug/api');
    return _withTrailingSlash(base.uri.replace(path: tenantPath).toString());
  }

  /// Convierte base API a public base:
  /// `http://host:8000/api` -> `http://host:8000/api/public/`
  static String _resolvePublicApiBaseUrl(String raw) {
    final base = _normalizeBaseApi(raw);
    final publicPath = _composePath(base.prefixPath, '/api/public');
    return _withTrailingSlash(base.uri.replace(path: publicPath).toString());
  }

  static _BaseApi _normalizeBaseApi(String raw) {
    final trimmed = raw.trim().replaceAll(RegExp(r'/+$'), '');
    final withScheme =
        trimmed.contains('://') ? trimmed : 'http://$trimmed';
    final uri = Uri.parse(withScheme);
    final path = uri.path.replaceAll(RegExp(r'/+$'), '');
    final tenantApiRegex = RegExp(r'^(.*)/t/[^/]+/api$');

    String prefixPath = '';
    if (tenantApiRegex.hasMatch(path)) {
      prefixPath = tenantApiRegex.firstMatch(path)?.group(1) ?? '';
    } else if (path.endsWith('/api')) {
      prefixPath = path.substring(0, path.length - 4);
    } else if (path.isEmpty || path == '/') {
      prefixPath = '';
    } else {
      prefixPath = path;
    }

    final normalized = Uri(
      scheme: uri.scheme.isEmpty ? 'http' : uri.scheme,
      host: uri.host,
      port: uri.hasPort ? uri.port : null,
      path: '/',
    );
    return _BaseApi(normalized, prefixPath);
  }

  static String _composePath(String prefix, String suffix) {
    final cleanPrefix = prefix.trim();
    final left = cleanPrefix.isEmpty
        ? ''
        : '/${cleanPrefix.replaceAll(RegExp(r'^/+|/+$'), '')}';
    final right = suffix.startsWith('/') ? suffix : '/$suffix';
    return '$left$right';
  }

  static String _withTrailingSlash(String input) {
    return '${input.replaceAll(RegExp(r'/+$'), '')}/';
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

class _BaseApi {
  _BaseApi(this.uri, this.prefixPath);
  final Uri uri;
  final String prefixPath;
}
