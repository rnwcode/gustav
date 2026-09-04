import 'package:meta/meta.dart';

import 'enums.dart';

/// How one past slot turned out, gathered on the planning day.
@immutable
class ReviewEntry {
  const ReviewEntry({required this.slotId, required this.outcome});

  final String slotId;
  final Outcome outcome;
}

/// What the owner reports on the planning day: how the period went and what
/// matters to them next. „Not sure" must be a valid answer and still lead to
/// a good period (`docs/produkt.md`).
@immutable
class WeeklyCheckin {
  const WeeklyCheckin({
    this.review = const [],
    this.freeTextReview,
    this.intentChips = const {},
    this.freeTextIntent,
    this.availableDays = const {},
    this.reviewChips = const {},
  });

  final List<ReviewEntry> review;
  final String? freeTextReview;
  final Set<IntentChip> intentChips;
  final String? freeTextIntent;
  final Set<Weekday> availableDays;

  /// Optional, shown on the planning-day screen — never asked daily.
  final Set<ReviewChip> reviewChips;
}

/// One weight for a skill or topic, 0–3.
@immutable
class Priority {
  const Priority({required this.skillIdOrTopic, required this.weight});

  final String skillIdOrTopic;
  final int weight;
}

@immutable
class Constraints {
  const Constraints(
      {this.days = const {}, this.minutesPerDay, this.locations = const []});

  final Set<Weekday> days;
  final int? minutesPerDay;
  final List<Location> locations;
}

/// The result of translating [WeeklyCheckin] into something the planner can
/// use directly. In the MVP this translation is template-based; later an
/// LLM translates free text into the same shape (`docs/datenmodell.md`,
/// backlog V1.2) — the planner itself never sees free text.
@immutable
class WeeklyContext {
  const WeeklyContext({
    this.priorities = const [],
    required this.constraints,
    this.flags = const {},
    required this.source,
  });

  final List<Priority> priorities;
  final Constraints constraints;

  /// Open-ended on purpose (`docs/datenmodell.md` lists `radfahrer | hitze |
  /// schonung | ueberdreht | …`) — flags are produced by the translator, not
  /// enumerated up front here.
  final Set<String> flags;

  /// Decides whether the app is allowed to say „you told us" (see
  /// `docs/produkt.md`, section Tonalität).
  final WeeklyContextSource source;
}
