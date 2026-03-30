import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'app.dart';
import 'features/auth/presentation/providers/session_notifier.dart';

/// Punto de entrada de la aplicación.
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(fileName: '.env');
  await initializeDateFormatting('es');

  final container = ProviderContainer();
  await container.read(sessionNotifierProvider.notifier).restoreFromStorage();

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const OftalmologiaApp(),
    ),
  );
}
