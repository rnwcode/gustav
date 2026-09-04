/// Planer-Engine von Gustav.
///
/// Reines Dart: keine Abhängigkeit auf Flutter, IO, Netzwerk oder Supabase.
/// Zeit kommt ausschließlich über [Clock] oder als Parameter herein —
/// Die Systemuhr direkt abzufragen ist im gesamten Repo verboten (siehe CLAUDE.md).
library engine;

export 'src/clock.dart';
export 'src/models/aktivitaet.dart';
export 'src/models/enums.dart';
export 'src/models/haushalt.dart';
export 'src/models/hund.dart';
export 'src/models/hund_ableitungen.dart';
export 'src/models/skill.dart';
export 'src/models/skill_stand.dart';
export 'src/models/stufen.dart';
export 'src/planer/zustandsautomat.dart';
export 'src/planer/zustandsautomat_konfig.dart';
