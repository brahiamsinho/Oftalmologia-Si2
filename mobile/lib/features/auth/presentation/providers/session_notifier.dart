import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../config/auth_listenable.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../data/auth_repository.dart';
import '../../domain/auth_user.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

final sessionNotifierProvider =
    NotifierProvider<SessionNotifier, AuthUser?>(SessionNotifier.new);

class SessionNotifier extends Notifier<AuthUser?> {
  @override
  AuthUser? build() => null;

  /// Restaura sesión si hay access token (valida con GET `/auth/me/`).
  Future<void> restoreFromStorage() async {
    final token = await SecureStorageService.getAccessToken();
    if (token == null || token.isEmpty) {
      state = null;
      authListenable.value = false;
      return;
    }
    try {
      final res = await ApiClient().dio.get<Map<String, dynamic>>('auth/me/');
      final data = res.data;
      if (data == null) {
        throw StateError('empty me');
      }
      state = AuthUser.fromJson(Map<String, dynamic>.from(data));
      authListenable.value = true;
    } catch (_) {
      await SecureStorageService.clearTokens();
      state = null;
      authListenable.value = false;
    }
  }

  Future<void> signIn(String email, String password) async {
    final user = await ref.read(authRepositoryProvider).login(
          email: email,
          password: password,
        );
    state = user;
    authListenable.value = true;
  }

  /// Tras [AuthRepository.register] (tokens ya persistidos).
  void setAuthenticatedUser(AuthUser user) {
    state = user;
    authListenable.value = true;
  }

  Future<void> signOut() async {
    await ref.read(authRepositoryProvider).logout();
    state = null;
    authListenable.value = false;
  }
}
