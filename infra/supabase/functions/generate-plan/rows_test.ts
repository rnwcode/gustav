import { assertEquals, assertThrows } from '../_shared/planner/dev_deps.ts';
import {
  activityFromRow,
  dogFromRow,
  householdFromRow,
  reasonJsonFromReason,
  resolveBreedGroups,
  skillFromRow,
  skillStateFromRow,
  skillStateRowFromState,
  slotRowFromSlot,
} from './rows.ts';

Deno.test('dogFromRow maps a dog row onto Dog, breed group from the linked breed', () => {
  const dog = dogFromRow({
    id: 'dog-1',
    name: 'Gustav',
    birth_date: '2023-01-01',
    arrival_date: '2023-01-15',
    origin: 'breeder',
    size_class: 'medium',
    body_type: ['brachycephalic'],
    restrictions: ['protectiveCare'],
    gender: 'male',
    neutered: true,
  }, [{ breed_group: 'herding', weight: null }]);

  assertEquals(dog.id, 'dog-1');
  assertEquals(dog.birthDate, new Date('2023-01-01'));
  assertEquals(dog.arrivalDate, new Date('2023-01-15'));
  assertEquals(dog.origin, 'breeder');
  assertEquals(dog.breedGroups, new Map([['herding', 1]]));
  assertEquals(dog.sizeClass, 'medium');
  assertEquals(dog.bodyType, new Set(['brachycephalic']));
  assertEquals(dog.restrictions, new Set(['protectiveCare']));
  assertEquals(dog.gender, 'male');
  assertEquals(dog.neutered, true);
});

Deno.test('dogFromRow tolerates unknown gender/neutered status', () => {
  const dog = dogFromRow({
    id: 'dog-1',
    name: 'Gustav',
    birth_date: '2023-01-01',
    arrival_date: '2023-01-15',
    origin: 'breeder',
    size_class: 'medium',
    body_type: [],
    restrictions: [],
    gender: null,
    neutered: null,
  }, [{ breed_group: 'mixed', weight: null }]);

  assertEquals(dog.gender, null);
  assertEquals(dog.neutered, null);
});

Deno.test('resolveBreedGroups: one breed, no weight needed', () => {
  const groups = resolveBreedGroups([{ breed_group: 'herding', weight: null }]);
  assertEquals(groups, new Map([['herding', 1]]));
});

Deno.test('resolveBreedGroups: two breeds without an explicit weight split evenly', () => {
  const groups = resolveBreedGroups([
    { breed_group: 'herding', weight: null },
    { breed_group: 'hunting', weight: null },
  ]);
  assertEquals(groups, new Map([['herding', 0.5], ['hunting', 0.5]]));
});

Deno.test('resolveBreedGroups: an explicit weight ratio overrides the even split', () => {
  const groups = resolveBreedGroups([
    { breed_group: 'herding', weight: 3 },
    { breed_group: 'hunting', weight: 1 },
  ]);
  assertEquals(groups, new Map([['herding', 0.75], ['hunting', 0.25]]));
});

Deno.test('resolveBreedGroups: two breeds in the same group merge into one weight', () => {
  const groups = resolveBreedGroups([
    { breed_group: 'herding', weight: null },
    { breed_group: 'herding', weight: null },
  ]);
  assertEquals(groups, new Map([['herding', 1]]));
});

Deno.test('resolveBreedGroups: no linked breed is a data error', () => {
  assertThrows(() => resolveBreedGroups([]));
});

Deno.test('householdFromRow maps a household row onto Household', () => {
  const household = householdFromRow({
    id: 'household-1',
    postal_code: '10115',
    housing_type: 'apartment',
    surroundings: 'city',
    experience: 'experienced',
    weekday_time_budget_min: 30,
    weekend_time_budget_min: 60,
    training_days: ['monday', 'wednesday', 'friday'],
    planning_day: 'sunday',
    household_size: 1,
    equipment: ['leash'],
  });

  assertEquals(household.postalCode, '10115');
  assertEquals(household.housingType, 'apartment');
  assertEquals(household.surroundings, 'city');
  assertEquals(household.experience, 'experienced');
  assertEquals(household.trainingDays, new Set(['monday', 'wednesday', 'friday']));
  assertEquals(household.planningDay, 'sunday');
  assertEquals(household.equipment, ['leash']);
});

Deno.test('skillStateFromRow decodes the JSON history', () => {
  const state = skillStateFromRow({
    skill_id: 'recall',
    status: 'generalizing',
    level_duration: 1,
    level_distance: 2,
    level_distraction: 3,
    history: [
      {
        date: '2026-03-01',
        outcome: 'succeeded',
        levelDuration: 1,
        levelDistance: 2,
        levelDistraction: 2,
      },
    ],
    last_practiced_at: '2026-03-01',
    due_at: '2026-03-10',
    interval_days: 9,
  }, 'dog-1');

  assertEquals(state.dogId, 'dog-1');
  assertEquals(state.status, 'generalizing');
  assertEquals(state.levels, { duration: 1, distance: 2, distraction: 3 });
  assertEquals(state.history, [
    {
      date: new Date('2026-03-01'),
      outcome: 'succeeded',
      levels: { duration: 1, distance: 2, distraction: 2 },
    },
  ]);
  assertEquals(state.dueAt, new Date('2026-03-10'));
});

Deno.test('skillStateFromRow tolerates a null history (never practiced)', () => {
  const state = skillStateFromRow({
    skill_id: 'recall',
    status: 'building',
    level_duration: 0,
    level_distance: 0,
    level_distraction: 0,
    history: null,
    last_practiced_at: null,
    due_at: null,
    interval_days: 1,
  }, 'dog-1');

  assertEquals(state.history, []);
  assertEquals(state.lastPracticedAt, null);
  assertEquals(state.dueAt, null);
});

Deno.test('skillStateRowFromState round-trips through skillStateFromRow', () => {
  const original = skillStateFromRow({
    skill_id: 'recall',
    status: 'generalizing',
    level_duration: 1,
    level_distance: 2,
    level_distraction: 3,
    history: [
      {
        date: '2026-03-01',
        outcome: 'succeeded',
        levelDuration: 1,
        levelDistance: 2,
        levelDistraction: 2,
      },
    ],
    last_practiced_at: '2026-03-01',
    due_at: '2026-03-10',
    interval_days: 9,
  }, 'dog-1');

  const row = skillStateRowFromState('dog-1', original);
  const roundTripped = skillStateFromRow(
    { ...row, history: row.history },
    'dog-1',
  );
  assertEquals(roundTripped, original);
});

Deno.test('slotRowFromSlot maps an empty slot', () => {
  const row = slotRowFromSlot('plan-1', {
    date: new Date('2026-03-16'),
    activityId: null,
    reason: { kind: 'empty', skillId: null, needDimension: null },
    outcome: null,
  });
  assertEquals(row, {
    weekly_plan_id: 'plan-1',
    date: '2026-03-16',
    activity_id: null,
    reason_kind: 'empty',
    reason_skill_id: null,
    reason_need_dimension: null,
    outcome: null,
  });
});

Deno.test('slotRowFromSlot maps a need-gap slot', () => {
  const row = slotRowFromSlot('plan-1', {
    date: new Date('2026-03-17'),
    activityId: 'sniff',
    reason: { kind: 'needGap', skillId: null, needDimension: 'scent' },
    outcome: null,
  });
  assertEquals(row.reason_kind, 'needGap');
  assertEquals(row.reason_need_dimension, 'scent');
  assertEquals(row.activity_id, 'sniff');
});

Deno.test('reasonJsonFromReason passes the vocabulary through unchanged (DB and planner now agree)', () => {
  assertEquals(
    reasonJsonFromReason({ kind: 'newSkill', skillId: 'recall', needDimension: null }),
    { kind: 'newSkill', skillId: 'recall', needDimension: null },
  );
  assertEquals(
    reasonJsonFromReason({ kind: 'needGap', skillId: null, needDimension: 'scent' }),
    { kind: 'needGap', skillId: null, needDimension: 'scent' },
  );
});

// Mirrors content/skills/rueckruf.yaml (still German, simulator-only) — and,
// once seeded, the joined `skill`/`skill_text` row for the same id
// (0002_content.sql), which speaks the planner's English vocabulary directly.
Deno.test('skillFromRow maps a skill row joined with its skill_text onto Skill', () => {
  const skill = skillFromRow({
    id: 'recall',
    category: 'basicCue',
    prerequisites: ['name_focus'],
    min_age_weeks: 9,
    is_core_skill: true,
    target_levels: { duration: 1, distance: 3, distraction: 4 },
    skill_text: [{ skill_id: 'recall', locale: 'de', name: 'Rückruf', description: 'Der Hund kommt zuverlässig zurück.\n' }],
  });

  assertEquals(skill.id, 'recall');
  assertEquals(skill.name, 'Rückruf');
  assertEquals(skill.category, 'basicCue');
  assertEquals(skill.prerequisites, ['name_focus']);
  assertEquals(skill.isCoreSkill, true);
  assertEquals(skill.targetLevels, { duration: 1, distance: 3, distraction: 4 });
  assertEquals(skill.description, 'Der Hund kommt zuverlässig zurück.');
});

// Mirrors content/aktivitaeten/schnueffelteppich_einfuehrung.yaml (still
// German, simulator-only) — and, once seeded, the joined
// `activity`/`activity_text` row for the same id.
Deno.test('activityFromRow maps an activity row joined with its activity_text onto Activity', () => {
  const activity = activityFromRow({
    id: 'sniffing_mat_intro',
    type: 'enrichment',
    trains_skill: null,
    needs: { physical: 1, mentalWork: 3, scent: 3, social: 0, recovery: 1 },
    arousal: 1,
    duration_min: 5,
    duration_max: 15,
    location: 'indoors',
    for_distraction: null,
    is_refresher: false,
    heat_suitable: true,
    rain_suitable: true,
    darkness_suitable: true,
    joint_straining: false,
    seasonal_window: null,
    equipment: [],
    second_person: false,
    min_age_weeks: 8,
    max_age_weeks: null,
    suitability: { hunting: 1, herding: 1 },
    variance_group: 'sniffing_indoors',
    cooldown_days: 10,
    illustration: 'sniffing_mat',
    activity_text: [{
      activity_id: 'sniffing_mat_intro',
      locale: 'de',
      title: 'Schnüffelteppich, erste Runde',
      sentence: 'Futter im Teppich verstecken und suchen lassen.\n',
      instructions: ['Ein Handtuch locker zusammenlegen.'],
      success_criterion: 'Er sucht selbstständig weiter.\n',
      common_mistakes: ['Zu früh zu schwer versteckt.'],
      troubleshooting: [
        { problem: 'Er verliert das Interesse.', answer: 'Nimm hochwertigeres Futter.\n' },
      ],
    }],
  });

  assertEquals(activity.id, 'sniffing_mat_intro');
  assertEquals(activity.type, 'enrichment');
  assertEquals(activity.trainsSkill, null);
  assertEquals(activity.needs, { physical: 1, mentalWork: 3, scent: 3, social: 0, recovery: 1 });
  assertEquals(activity.location, 'indoors');
  assertEquals(activity.suitability, new Map([['hunting', 1], ['herding', 1]]));
  assertEquals(activity.varianceGroup, 'sniffing_indoors');
});
