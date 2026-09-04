import 'package:meta/meta.dart';

import '../models/enums.dart';

/// The slice of `content/planer.yaml` candidate collection needs (section
/// `bedarf_ziel`). Passed in, not imported (CLAUDE.md, rule 10).
@immutable
class CandidateConfig {
  const CandidateConfig({required this.needTargets});

  final Map<NeedDimension, int> needTargets;
}
