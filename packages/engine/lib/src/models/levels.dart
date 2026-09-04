import 'package:meta/meta.dart';

import 'enums.dart';

/// The three Ds of a skill: duration, distance, distraction, each 0–5.
///
/// Only ever raising one dimension at a time is the state machine's job, not
/// this class's — `Levels` is a plain data holder.
@immutable
class Levels {
  const Levels(
      {required this.duration,
      required this.distance,
      required this.distraction});

  final int duration;
  final int distance;
  final int distraction;

  int operator [](Dimension d) => switch (d) {
        Dimension.duration => duration,
        Dimension.distance => distance,
        Dimension.distraction => distraction,
      };

  Levels updated(Dimension d, int value) => switch (d) {
        Dimension.duration =>
          Levels(duration: value, distance: distance, distraction: distraction),
        Dimension.distance =>
          Levels(duration: duration, distance: value, distraction: distraction),
        Dimension.distraction =>
          Levels(duration: duration, distance: distance, distraction: value),
      };

  @override
  bool operator ==(Object other) =>
      other is Levels &&
      other.duration == duration &&
      other.distance == distance &&
      other.distraction == distraction;

  @override
  int get hashCode => Object.hash(duration, distance, distraction);

  @override
  String toString() =>
      'Levels(duration: $duration, distance: $distance, distraction: $distraction)';
}
