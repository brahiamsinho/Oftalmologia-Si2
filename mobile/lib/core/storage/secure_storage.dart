import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Almacenamiento seguro para tokens y datos sensibles.
class SecureStorageService {
  static const FlutterSecureStorage _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  // Keys
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _tenantSlugKey = 'tenant_slug';

  // ---- Tokens ----
  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }

  static Future<String?> getAccessToken() async {
    return await _storage.read(key: _accessTokenKey);
  }

  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }

  static Future<void> clearTokens() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
  }

  // ---- Tenant workspace ----
  static Future<void> saveTenantSlug(String slug) async {
    await _storage.write(key: _tenantSlugKey, value: slug);
  }

  static Future<String?> getTenantSlug() async {
    return await _storage.read(key: _tenantSlugKey);
  }

  static Future<void> clearTenantSlug() async {
    await _storage.delete(key: _tenantSlugKey);
  }

  // ---- General ----
  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
