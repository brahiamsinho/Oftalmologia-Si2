import 'package:flutter/foundation.dart';

/// Notifica a [GoRouter] para re-evaluar [redirect] tras login / logout / restore.
final ValueNotifier<bool> authListenable = ValueNotifier<bool>(false);
