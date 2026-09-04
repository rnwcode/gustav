/// Gustav's planner engine.
///
/// Pure Dart: no dependency on Flutter, IO, network or Supabase. Time comes
/// in exclusively through [Clock] or as a parameter — reading the system
/// clock directly is forbidden everywhere in the repo (see CLAUDE.md).
library engine;

export 'src/clock.dart';
export 'src/models/activity.dart';
export 'src/models/checkin.dart';
export 'src/models/dog.dart';
export 'src/models/dog_derivations.dart';
export 'src/models/enums.dart';
export 'src/models/household.dart';
export 'src/models/levels.dart';
export 'src/models/skill.dart';
export 'src/models/skill_state.dart';
export 'src/models/weekly_plan.dart';
export 'src/planner/activity_filter.dart';
export 'src/planner/activity_filter_config.dart';
export 'src/planner/candidates.dart';
export 'src/planner/candidates_config.dart';
export 'src/planner/load_budget.dart';
export 'src/planner/load_budget_config.dart';
export 'src/planner/state_machine.dart';
export 'src/planner/state_machine_config.dart';
