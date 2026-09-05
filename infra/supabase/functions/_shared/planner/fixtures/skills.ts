import type { Skill } from '../models/skill.ts';

/**
 * Synthetic skills for the simulator and integration tests — NOT the real
 * content catalog. Writing the 40 real activities/skills is trainer work
 * (`docs/bauplan.md`, „Zusammenarbeit mit KI": fachliche Richtigkeit der
 * Hundeinhalte ist „Schlecht" für KI) and happens in `content/skills/`,
 * never here. Every id is prefixed `fixture_` so it can never be mistaken
 * for production content.
 */
export const FIXTURE_SKILLS: readonly Skill[] = [
  {
    id: 'fixture_name_focus',
    name: '[Fixture] Namensaufmerksamkeit',
    category: 'basicCue',
    prerequisites: [],
    minAgeWeeks: 8,
    isCoreSkill: true,
    targetLevels: { duration: 0, distance: 0, distraction: 2 },
    description: 'Test-Fixture, keine echte Trainingsanleitung.',
  },
  {
    id: 'fixture_sit',
    name: '[Fixture] Sitz',
    category: 'basicCue',
    prerequisites: ['fixture_name_focus'],
    minAgeWeeks: 9,
    isCoreSkill: true,
    targetLevels: { duration: 2, distance: 0, distraction: 3 },
    description: 'Test-Fixture, keine echte Trainingsanleitung.',
  },
  {
    id: 'fixture_recall',
    name: '[Fixture] Rückruf',
    category: 'basicCue',
    prerequisites: ['fixture_name_focus'],
    minAgeWeeks: 10,
    isCoreSkill: true,
    targetLevels: { duration: 1, distance: 3, distraction: 4 },
    description: 'Test-Fixture, keine echte Trainingsanleitung.',
  },
  {
    id: 'fixture_leash_walking',
    name: '[Fixture] Leinenführigkeit',
    category: 'leashWork',
    prerequisites: ['fixture_name_focus'],
    minAgeWeeks: 12,
    isCoreSkill: false,
    targetLevels: { duration: 3, distance: 2, distraction: 3 },
    description: 'Test-Fixture, keine echte Trainingsanleitung.',
  },
  {
    id: 'fixture_settle',
    name: '[Fixture] Ruhig liegen bleiben',
    category: 'impulseControl',
    prerequisites: ['fixture_sit'],
    minAgeWeeks: 16,
    isCoreSkill: false,
    targetLevels: { duration: 4, distance: 1, distraction: 2 },
    description: 'Test-Fixture, keine echte Trainingsanleitung.',
  },
];
