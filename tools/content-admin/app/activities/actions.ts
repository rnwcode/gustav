'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  deleteActivity,
  deleteActivityText,
  upsertActivity,
  upsertActivityText,
} from '../../lib/activitiesRepo';
import {
  checkbox,
  commaListToArray,
  commaListToNumbers,
  linesToArray,
  optionalNumber,
  optionalString,
  parseForDistraction,
  parseSuitability,
  parseTroubleshooting,
  requiredNumber,
  requiredString,
} from '../../lib/formParsing';
import type { ActivityType, Location } from '../../lib/models';

export async function createOrUpdateActivity(formData: FormData): Promise<void> {
  const id = requiredString(formData, 'id');
  await upsertActivity({
    id,
    type: requiredString(formData, 'type') as ActivityType,
    trains_skill: optionalString(formData, 'trains_skill'),
    needs: {
      physical: requiredNumber(formData, 'needs_physical'),
      mentalWork: requiredNumber(formData, 'needs_mentalWork'),
      scent: requiredNumber(formData, 'needs_scent'),
      social: requiredNumber(formData, 'needs_social'),
      recovery: requiredNumber(formData, 'needs_recovery'),
    },
    arousal: requiredNumber(formData, 'arousal'),
    duration_min: requiredNumber(formData, 'duration_min'),
    duration_max: requiredNumber(formData, 'duration_max'),
    location: requiredString(formData, 'location') as Location,
    for_distraction: parseForDistraction(formData),
    is_refresher: checkbox(formData, 'is_refresher'),
    heat_suitable: checkbox(formData, 'heat_suitable'),
    rain_suitable: checkbox(formData, 'rain_suitable'),
    darkness_suitable: checkbox(formData, 'darkness_suitable'),
    joint_straining: checkbox(formData, 'joint_straining'),
    seasonal_window: commaListToNumbers(formData, 'seasonal_window'),
    equipment: commaListToArray(formData, 'equipment'),
    second_person: checkbox(formData, 'second_person'),
    min_age_weeks: requiredNumber(formData, 'min_age_weeks'),
    max_age_weeks: optionalNumber(formData, 'max_age_weeks'),
    suitability: parseSuitability(formData),
    variance_group: requiredString(formData, 'variance_group'),
    cooldown_days: requiredNumber(formData, 'cooldown_days'),
    illustration: optionalString(formData, 'illustration'),
  });
  revalidatePath('/activities');
  redirect(`/activities/${id}`);
}

export async function deleteActivityAction(formData: FormData): Promise<void> {
  const id = requiredString(formData, 'id');
  await deleteActivity(id);
  revalidatePath('/activities');
  redirect('/activities');
}

export async function saveActivityText(formData: FormData): Promise<void> {
  const activityId = requiredString(formData, 'activity_id');
  await upsertActivityText({
    activity_id: activityId,
    locale: requiredString(formData, 'locale'),
    title: requiredString(formData, 'title'),
    sentence: requiredString(formData, 'sentence'),
    instructions: linesToArray(formData, 'instructions'),
    success_criterion: requiredString(formData, 'success_criterion'),
    common_mistakes: linesToArray(formData, 'common_mistakes'),
    troubleshooting: parseTroubleshooting(formData, 'troubleshooting'),
  });
  revalidatePath(`/activities/${activityId}`);
  redirect(`/activities/${activityId}`);
}

export async function deleteActivityTextAction(formData: FormData): Promise<void> {
  const activityId = requiredString(formData, 'activity_id');
  const locale = requiredString(formData, 'locale');
  await deleteActivityText(activityId, locale);
  revalidatePath(`/activities/${activityId}`);
  redirect(`/activities/${activityId}`);
}
