import 'package:flutter/foundation.dart';

enum AppSessionStatus {
  needsTenant,
  unauthenticated,
  authenticated,
}

/// Notifica a [GoRouter] para re-evaluar [redirect] tras cambios de sesión.
final ValueNotifier<AppSessionStatus> authListenable =
    ValueNotifier<AppSessionStatus>(AppSessionStatus.needsTenant);
