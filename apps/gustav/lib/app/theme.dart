import 'package:flutter/material.dart';

/// Calm, descriptive — matches the product's tonality (CLAUDE.md: describe,
/// don't instruct). No mascot colors, no urgency red for normal states.
class AppTheme {
  const AppTheme._();

  static const _seedColor = Color(0xFF3A5A40);

  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: _seedColor,
        brightness: Brightness.light,
      ),
    );
  }

  static ThemeData dark() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: _seedColor,
        brightness: Brightness.dark,
      ),
    );
  }
}
