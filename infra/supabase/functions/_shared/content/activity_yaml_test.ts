import { assertEquals } from '../planner/dev_deps.ts';
import { parseActivityYaml } from './activity_yaml.ts';

// Mirrors content/aktivitaeten/schnueffelteppich_einfuehrung.yaml.
const schnueffelteppich = {
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
};

Deno.test('parses an activity document into Activity', () => {
  const activity = parseActivityYaml(schnueffelteppich);

  assertEquals(activity.id, 'schnueffelteppich_einfuehrung');
  assertEquals(activity.title, 'Schnüffelteppich, erste Runde');
  assertEquals(activity.sentence, 'Futter im Teppich verstecken und suchen lassen.');
  assertEquals(activity.type, 'enrichment');
  assertEquals(activity.trainsSkill, null);
  assertEquals(activity.needs, { physical: 1, mentalWork: 3, scent: 3, social: 0, recovery: 1 });
  assertEquals(activity.location, 'indoors');
  assertEquals(activity.forDistraction, null);
  assertEquals(activity.seasonalWindow, null);
  assertEquals(activity.maxAgeWeeks, null);
  assertEquals(activity.suitability, new Map([['hunting', 1], ['herding', 1]]));
  assertEquals(activity.varianceGroup, 'nasenarbeit_drinnen');
  assertEquals(activity.illustration, 'schnueffelteppich');
  assertEquals(activity.successCriterion, 'Er sucht selbstständig weiter.');
  assertEquals(activity.troubleshooting, [
    { problem: 'Er verliert das Interesse.', answer: 'Nimm hochwertigeres Futter.' },
  ]);
});

Deno.test('a training activity keeps its distraction range', () => {
  const activity = parseActivityYaml({
    ...schnueffelteppich,
    typ: 'training',
    trainiert_skill: 'rueckruf',
    fuer_ablenkung: [2, 3],
    ort: 'draussen',
  });

  assertEquals(activity.type, 'training');
  assertEquals(activity.trainsSkill, 'rueckruf');
  assertEquals(activity.forDistraction, [2, 3]);
  assertEquals(activity.location, 'outdoors');
});

Deno.test('a distraction range absent in the document (not typ=training) stays null', () => {
  const { fuer_ablenkung: _omitted, ...withoutDistraction } = schnueffelteppich as
    & typeof schnueffelteppich
    & {
      fuer_ablenkung?: readonly [number, number];
    };
  const activity = parseActivityYaml(withoutDistraction);
  assertEquals(activity.forDistraction, null);
});
