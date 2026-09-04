/// Planer-Engine des Hundeplaners.
///
/// Reines Dart: keine Abhängigkeit auf Flutter, IO, Netzwerk oder Supabase.
/// Zeit kommt ausschließlich über [Clock] oder als Parameter herein —
/// `DateTime.now()` ist im gesamten Repo verboten (siehe CLAUDE.md).
library engine;

export 'src/clock.dart';
