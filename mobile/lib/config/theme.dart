import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Tema de la aplicación — paleta oftalmológica profesional.
class AppTheme {
  AppTheme._();

  // ---- Colores ----
  static const Color primaryColor = Color(0xFF2563EB);
  static const Color primaryLight = Color(0xFF60A5FA);
  static const Color primaryDark = Color(0xFF1D4ED8);
  static const Color secondaryColor = Color(0xFF1E3A8A);
  static const Color primaryBlue = Color(0xFF2563EB);
  static const Color accentColor = Color(0xFFF59E0B);
  static const Color errorColor = Color(0xFFDC2626);
  static const Color successColor = Color(0xFF16A34A);
  static const Color backgroundColor = Color(0xFFF8FAFC);
  static const Color surfaceColor = Color(0xFFFFFFFF);
  static const Color textColor = Color(0xFF1E293B);
  static const Color textMuted = Color(0xFF94A3B8);

  // ---- Color Scheme ----
  static const ColorScheme _lightColorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: primaryColor,
    onPrimary: Colors.white,
    secondary: secondaryColor,
    onSecondary: Colors.white,
    error: errorColor,
    onError: Colors.white,
    surface: surfaceColor,
    onSurface: textColor,
  );

  static const ColorScheme _darkColorScheme = ColorScheme(
    brightness: Brightness.dark,
    primary: primaryLight,
    onPrimary: Color(0xFF003735),
    secondary: Color(0xFF93B5FF),
    onSecondary: Color(0xFF002B75),
    error: Color(0xFFFFB4AB),
    onError: Color(0xFF690005),
    surface: Color(0xFF1E1E2E),
    onSurface: Color(0xFFE6E1E5),
  );

  // ---- Light Theme ----
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: _lightColorScheme,
      scaffoldBackgroundColor: backgroundColor,
      textTheme: _textTheme,
      appBarTheme: const AppBarTheme(
        backgroundColor: surfaceColor,
        foregroundColor: textColor,
        elevation: 0,
        centerTitle: false,
        scrolledUnderElevation: 1,
      ),
      cardTheme: CardThemeData(
        color: surfaceColor,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFFFFFFF),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        hintStyle: const TextStyle(color: Color(0xFF9CA3AF)),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          minimumSize: const Size(double.infinity, 52),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: Color(0xFFE2E8F0),
        thickness: 1,
      ),
    );
  }

  // ---- Dark Theme ----
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: _darkColorScheme,
      scaffoldBackgroundColor: const Color(0xFF11111B),
      textTheme: _textTheme.apply(
        bodyColor: const Color(0xFFE6E1E5),
        displayColor: const Color(0xFFE6E1E5),
      ),
    );
  }

  // ---- Text Theme ----
  static TextTheme get _textTheme {
    return GoogleFonts.interTextTheme().copyWith(
      headlineLarge: GoogleFonts.outfit(
        fontSize: 32,
        fontWeight: FontWeight.w700,
      ),
      headlineMedium: GoogleFonts.outfit(
        fontSize: 24,
        fontWeight: FontWeight.w600,
      ),
      headlineSmall: GoogleFonts.outfit(
        fontSize: 20,
        fontWeight: FontWeight.w600,
      ),
      titleLarge: GoogleFonts.inter(
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
      bodyLarge: GoogleFonts.inter(fontSize: 16),
      bodyMedium: GoogleFonts.inter(fontSize: 14),
      labelLarge: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w600,
      ),
    );
  }
}
