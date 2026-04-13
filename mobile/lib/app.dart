import 'package:flutter/material.dart';
import 'config/app_config.dart';
import 'config/theme.dart';
import 'config/routes.dart';

/// Widget raíz de la aplicación.
class OftalmologiaApp extends StatelessWidget {
  const OftalmologiaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,

      // Theme
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,

      // Router
      routerConfig: appRouter,
    );
  }
}
