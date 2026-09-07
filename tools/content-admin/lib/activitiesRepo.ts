import 'server-only';
import { supabaseAdmin } from './supabaseAdmin';
import type { Activity, ActivityText } from './models';

export async function listActivities(): Promise<readonly Activity[]> {
  const { data, error } = await supabaseAdmin.from('activity').select('*').order('id');
  if (error) throw error;
  return data as Activity[];
}

export async function getActivity(id: string): Promise<Activity | null> {
  const { data, error } = await supabaseAdmin
    .from('activity')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Activity | null;
}

export async function listActivityTexts(activityId: string): Promise<readonly ActivityText[]> {
  const { data, error } = await supabaseAdmin
    .from('activity_text')
    .select('*')
    .eq('activity_id', activityId)
    .order('locale');
  if (error) throw error;
  return data as ActivityText[];
}

/** `created_at` omitted deliberately — see `upsertSkill` in `skillsRepo.ts`. */
export async function upsertActivity(activity: Omit<Activity, 'created_at'>): Promise<void> {
  const { error } = await supabaseAdmin.from('activity').upsert(activity);
  if (error) throw error;
}

export async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('activity').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertActivityText(text: ActivityText): Promise<void> {
  const { error } = await supabaseAdmin.from('activity_text').upsert(text);
  if (error) throw error;
}

export async function deleteActivityText(activityId: string, locale: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('activity_text')
    .delete()
    .eq('activity_id', activityId)
    .eq('locale', locale);
  if (error) throw error;
}
