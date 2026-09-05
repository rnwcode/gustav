import { assertEquals } from '../_shared/planner/dev_deps.ts';
import {
  dogFromRow,
  householdFromRow,
  skillStandRowFromState,
  skillStateFromRow,
  slotRowFromSlot,
} from './rows.ts';

Deno.test('dogFromRow maps a hund row onto Dog', () => {
  const dog = dogFromRow({
    id: 'dog-1',
    name: 'Gustav',
    geburtsdatum: '2023-01-01',
    einzugsdatum: '2023-01-15',
    herkunft: 'zuechter',
    rassegruppe: 'huete',
    groessenklasse: 'mittel',
    koerperbau: ['brachyzephal'],
    einschraenkungen: ['schonung'],
  });

  assertEquals(dog.id, 'dog-1');
  assertEquals(dog.birthDate, new Date('2023-01-01'));
  assertEquals(dog.arrivalDate, new Date('2023-01-15'));
  assertEquals(dog.origin, 'breeder');
  assertEquals(dog.breedGroup, 'herding');
  assertEquals(dog.sizeClass, 'medium');
  assertEquals(dog.bodyType, new Set(['brachycephalic']));
  assertEquals(dog.restrictions, new Set(['protectiveCare']));
});

Deno.test('householdFromRow maps a haushalt row onto Household', () => {
  const household = householdFromRow({
    id: 'household-1',
    plz: '10115',
    wohnsituation: 'wohnung',
    umgebung: 'stadt',
    erfahrung: 'erfahren',
    zeitbudget_werktag_min: 30,
    zeitbudget_wochenende_min: 60,
    trainingstage: ['mo', 'mi', 'fr'],
    planungstag: 'so',
    personen: 1,
    equipment: ['leine'],
  });

  assertEquals(household.postalCode, '10115');
  assertEquals(household.housingType, 'apartment');
  assertEquals(household.surroundings, 'city');
  assertEquals(household.experience, 'experienced');
  assertEquals(household.trainingDays, new Set(['monday', 'wednesday', 'friday']));
  assertEquals(household.planningDay, 'sunday');
  assertEquals(household.equipment, ['leine']);
});

Deno.test('skillStateFromRow decodes the JSON history', () => {
  const state = skillStateFromRow({
    skill_id: 'rueckruf',
    status: 'generalisierung',
    stufe_dauer: 1,
    stufe_distanz: 2,
    stufe_ablenkung: 3,
    historie: [
      {
        datum: '2026-03-01',
        ergebnis: 'klappte',
        stufe_dauer: 1,
        stufe_distanz: 2,
        stufe_ablenkung: 2,
      },
    ],
    letzte_uebung_am: '2026-03-01',
    faellig_am: '2026-03-10',
    intervall_tage: 9,
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
    skill_id: 'rueckruf',
    status: 'aufbau',
    stufe_dauer: 0,
    stufe_distanz: 0,
    stufe_ablenkung: 0,
    historie: null,
    letzte_uebung_am: null,
    faellig_am: null,
    intervall_tage: 1,
  }, 'dog-1');

  assertEquals(state.history, []);
  assertEquals(state.lastPracticedAt, null);
  assertEquals(state.dueAt, null);
});

Deno.test('skillStandRowFromState round-trips through skillStateFromRow', () => {
  const original = skillStateFromRow({
    skill_id: 'rueckruf',
    status: 'generalisierung',
    stufe_dauer: 1,
    stufe_distanz: 2,
    stufe_ablenkung: 3,
    historie: [
      {
        datum: '2026-03-01',
        ergebnis: 'klappte',
        stufe_dauer: 1,
        stufe_distanz: 2,
        stufe_ablenkung: 2,
      },
    ],
    letzte_uebung_am: '2026-03-01',
    faellig_am: '2026-03-10',
    intervall_tage: 9,
  }, 'dog-1');

  const row = skillStandRowFromState('dog-1', original);
  const roundTripped = skillStateFromRow(
    { ...row, historie: row.historie },
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
    wochenplan_id: 'plan-1',
    datum: '2026-03-16',
    aktivitaet_id: null,
    begruendung_art: 'leer',
    begruendung_skill_id: null,
    begruendung_bedarfsdimension: null,
    ergebnis: null,
  });
});

Deno.test('slotRowFromSlot maps a need-gap slot', () => {
  const row = slotRowFromSlot('plan-1', {
    date: new Date('2026-03-17'),
    activityId: 'sniff',
    reason: { kind: 'needGap', skillId: null, needDimension: 'scent' },
    outcome: null,
  });
  assertEquals(row.begruendung_art, 'bedarfsluecke');
  assertEquals(row.begruendung_bedarfsdimension, 'nase');
  assertEquals(row.aktivitaet_id, 'sniff');
});
