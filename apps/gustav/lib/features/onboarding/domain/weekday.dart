/// Day of the week — used for `trainingDays`/`planningDay`. The German wire
/// value (`content/*.yaml`, `infra/supabase/migrations/0001_init.sql`) is
/// the two-letter abbreviation; see `toGerman`/`weekdayFromGerman`.
enum Weekday { monday, tuesday, wednesday, thursday, friday, saturday, sunday }

const _germanByWeekday = {
  Weekday.monday: 'mo',
  Weekday.tuesday: 'di',
  Weekday.wednesday: 'mi',
  Weekday.thursday: 'do',
  Weekday.friday: 'fr',
  Weekday.saturday: 'sa',
  Weekday.sunday: 'so',
};

extension WeekdayGerman on Weekday {
  String toGerman() => _germanByWeekday[this]!;
}

Weekday weekdayFromGerman(String value) {
  return _germanByWeekday.entries.firstWhere((e) => e.value == value).key;
}
