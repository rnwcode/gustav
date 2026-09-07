import 'server-only';
import { supabaseAdmin } from './supabaseAdmin';
import type { Skill, SkillText } from './models';

export async function listSkills(): Promise<readonly Skill[]> {
  const { data, error } = await supabaseAdmin.from('skill').select('*').order('id');
  if (error) throw error;
  return data as Skill[];
}

export async function getSkill(id: string): Promise<Skill | null> {
  const { data, error } = await supabaseAdmin.from('skill').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Skill | null;
}

export async function listSkillTexts(skillId: string): Promise<readonly SkillText[]> {
  const { data, error } = await supabaseAdmin
    .from('skill_text')
    .select('*')
    .eq('skill_id', skillId)
    .order('locale');
  if (error) throw error;
  return data as SkillText[];
}

/**
 * `created_at` is deliberately not part of the input: omitting it from the
 * upsert payload lets Postgres apply its `default now()` on insert and
 * leaves the column untouched on update (supabase-js only SETs columns
 * present in the payload) — never overwritten with a client-supplied value.
 */
export async function upsertSkill(skill: Omit<Skill, 'created_at'>): Promise<void> {
  const { error } = await supabaseAdmin.from('skill').upsert(skill);
  if (error) throw error;
}

export async function deleteSkill(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('skill').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertSkillText(text: SkillText): Promise<void> {
  const { error } = await supabaseAdmin.from('skill_text').upsert(text);
  if (error) throw error;
}

export async function deleteSkillText(skillId: string, locale: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('skill_text')
    .delete()
    .eq('skill_id', skillId)
    .eq('locale', locale);
  if (error) throw error;
}
