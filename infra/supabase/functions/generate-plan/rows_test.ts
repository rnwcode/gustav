import { assertEquals } from '../_shared/planner/dev_deps.ts';
import {
  activityFromRow,
  dogFromRow,
  householdFromRow,
  skillFromRow,
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

// Mirrors content/skills/rueckruf.yaml — and, once seeded, the `skill` row
// with the same id (0002_content.sql gives the table the same field names).
Deno.test('skillFromRow maps a skill row onto Skill', () => {
  const skill = skillFromRow({
    id: 'rueckruf',
    name: 'Rückruf',
    kategorie: 'grundsignal',
    voraussetzungen: ['namensaufmerksamkeit'],
    min_alter_wochen: 9,
    ist_kernskill: true,
    zielstufen: { dauer: 1, distanz: 3, ablenkung: 4 },
    beschreibung: 'Der Hund kommt zuverlässig zurück.\n',
  });

  assertEquals(skill.id, 'rueckruf');
  assertEquals(skill.name, 'Rückruf');
  assertEquals(skill.category, 'basicCue');
  assertEquals(skill.prerequisites, ['namensaufmerksamkeit']);
  assertEquals(skill.isCoreSkill, true);
  assertEquals(skill.targetLevels, { duration: 1, distance: 3, distraction: 4 });
  assertEquals(skill.description, 'Der Hund kommt zuverlässig zurück.');
});

// Mirrors content/aktivitaeten/schnueffelteppich_einfuehrung.yaml — and,
// once seeded, the `aktivitaet` row with the same id.
Deno.test('activityFromRow maps an aktivitaet row onto Activity', () => {
  const activity = activityFromRow({
    id: 'schnueffelteppich_einfuehrung',
    titel: 'Schnüffelteppich, erste Runde',
    satz: 'Futter im Teppich verstecken und suchen lassen.\n',
    typ: 'beschaeftigung',
    trainiert_skill: null,
    bedarf: { koerperlich: 1, kopfarbeit: 3, nase: 3, sozial: 0, erholung: 1 },
    belastung: 1,
    dauer_min: 5,
    dauer_max: 15,
    ort: 'drinnen',
    fuer_ablenkung: null,
    ist_auffrischung: false,
    hitzetauglich: true,
    regentauglich: true,
    dunkeltauglich: true,
    gelenkbelastend: false,
    saisonfenster: null,
    equipment: [],
    zweite_person: false,
    min_alter_wochen: 8,
    max_alter_wochen: null,
    eignung: { jagd: 1, huete: 1 },
    varianzgruppe: 'nasenarbeit_drinnen',
    sperrfrist_tage: 10,
    illustration: 'schnueffelteppich',
    anleitung: ['Ein Handtuch locker zusammenlegen.'],
    erfolgskriterium: 'Er sucht selbstständig weiter.\n',
    haeufige_fehler: ['Zu früh zu schwer versteckt.'],
    troubleshooting: [
      { problem: 'Er verliert das Interesse.', antwort: 'Nimm hochwertigeres Futter.\n' },
    ],
  });

  assertEquals(activity.id, 'schnueffelteppich_einfuehrung');
  assertEquals(activity.type, 'enrichment');
  assertEquals(activity.trainsSkill, null);
  assertEquals(activity.needs, { physical: 1, mentalWork: 3, scent: 3, social: 0, recovery: 1 });
  assertEquals(activity.location, 'indoors');
  assertEquals(activity.suitability, new Map([['hunting', 1], ['herding', 1]]));
  assertEquals(activity.varianceGroup, 'nasenarbeit_drinnen');
});
