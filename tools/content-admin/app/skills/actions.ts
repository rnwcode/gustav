'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  deleteSkill,
  deleteSkillText,
  upsertSkill,
  upsertSkillText,
} from '../../lib/skillsRepo';
import { checkbox, commaListToArray, requiredNumber, requiredString } from '../../lib/formParsing';
import type { SkillCategory } from '../../lib/models';

export async function createOrUpdateSkill(formData: FormData): Promise<void> {
  const id = requiredString(formData, 'id');
  await upsertSkill({
    id,
    category: requiredString(formData, 'category') as SkillCategory,
    prerequisites: commaListToArray(formData, 'prerequisites'),
    min_age_weeks: requiredNumber(formData, 'min_age_weeks'),
    is_core_skill: checkbox(formData, 'is_core_skill'),
    target_levels: {
      duration: requiredNumber(formData, 'target_duration'),
      distance: requiredNumber(formData, 'target_distance'),
      distraction: requiredNumber(formData, 'target_distraction'),
    },
  });
  revalidatePath('/skills');
  redirect(`/skills/${id}`);
}

export async function deleteSkillAction(formData: FormData): Promise<void> {
  const id = requiredString(formData, 'id');
  await deleteSkill(id);
  revalidatePath('/skills');
  redirect('/skills');
}

export async function saveSkillText(formData: FormData): Promise<void> {
  const skillId = requiredString(formData, 'skill_id');
  await upsertSkillText({
    skill_id: skillId,
    locale: requiredString(formData, 'locale'),
    name: requiredString(formData, 'name'),
    description: requiredString(formData, 'description'),
  });
  revalidatePath(`/skills/${skillId}`);
  redirect(`/skills/${skillId}`);
}

export async function deleteSkillTextAction(formData: FormData): Promise<void> {
  const skillId = requiredString(formData, 'skill_id');
  const locale = requiredString(formData, 'locale');
  await deleteSkillText(skillId, locale);
  revalidatePath(`/skills/${skillId}`);
  redirect(`/skills/${skillId}`);
}
