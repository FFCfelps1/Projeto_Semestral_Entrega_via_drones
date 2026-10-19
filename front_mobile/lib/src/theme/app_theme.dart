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
        bodyLarge: TextStyle(
          fontFamily: 'Roboto',
          fontSize: 16,
          height: 1.5,
          color: colors.onSurface,
        ),
        bodyMedium: TextStyle(
          fontFamily: 'Roboto',
          fontSize: 16,
          height: 1.5,
          color: colors.onSurface,
        ),
        labelLarge: TextStyle(
          fontFamily: 'Roboto',
          fontSize: 14,
          height: 1.4,
          fontWeight: FontWeight.w500,
          color: colors.onSurface,
        ),
        headlineMedium: TextStyle(
          fontFamily: 'Manrope',
          fontSize: 28,
          height: 34 / 28,
          fontWeight: FontWeight.w700,
          color: colors.onSurface,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colors.surfaceContainerHighest,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        hintStyle: TextStyle(
          fontSize: 16,
          color: dark ? colors.onSurfaceVariant : const Color(0xff64748b),
        ),
        prefixIconColor: colors.onSurfaceVariant,
        suffixIconColor: colors.onSurfaceVariant,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.secondary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: colors.error, width: 2),
        ),
        errorMaxLines: 3,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          minimumSize: const Size.fromHeight(56),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          backgroundColor: colors.primary,
          foregroundColor: colors.onPrimary,
          elevation: 0,
          textStyle: const TextStyle(
            fontFamily: 'Roboto',
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: colors.surface,
        foregroundColor: colors.onSurface,
        surfaceTintColor: Colors.transparent,
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: colors.secondary,
          minimumSize: const Size(48, 48),
          textStyle: const TextStyle(
            fontFamily: 'Roboto',
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
