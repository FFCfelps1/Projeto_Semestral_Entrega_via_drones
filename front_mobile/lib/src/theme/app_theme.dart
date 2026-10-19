import 'package:flutter/material.dart';

/// Paleta compartilhada pelos dois temas; a página consome papéis semânticos.
abstract final class AppTheme {
  static const primary = Color(0xff2563eb);
  static final light = _build(Brightness.light);
  static final dark = _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final dark = brightness == Brightness.dark;
    final colors =
        ColorScheme.fromSeed(
          seedColor: primary,
          brightness: brightness,
        ).copyWith(
          primary: primary,
          onPrimary: Colors.white,
          secondary: dark ? const Color(0xff60a5fa) : const Color(0xff1d4ed8),
          surface: dark ? const Color(0xff0b1220) : Colors.white,
          surfaceContainerHighest: dark
              ? const Color(0xff111d30)
              : const Color(0xfff8fafc),
          onSurface: dark ? const Color(0xfff8fafc) : const Color(0xff0f172a),
          onSurfaceVariant: dark
              ? const Color(0xffa8b4c7)
              : const Color(0xff475569),
          // A borda identifica o campo mesmo em telas com baixo contraste.
          outline: const Color(0xff64748b),
          error: dark ? const Color(0xfffca5a5) : const Color(0xffb91c1c),
        );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colors,
      scaffoldBackgroundColor: colors.surface,
      fontFamily: 'Roboto',
      textTheme: ThemeData(brightness: brightness).textTheme.copyWith(
        headlineMedium: TextStyle(
          fontFamily: 'Manrope',
          fontSize: 28,
          height: 34 / 28,
          fontWeight: FontWeight.w700,
          color: colors.onSurface,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: colors.surface,
        foregroundColor: colors.onSurface,
        surfaceTintColor: Colors.transparent,
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: colors.secondary),
      ),
    );
  }
}
