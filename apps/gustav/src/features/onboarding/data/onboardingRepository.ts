import { supabase } from '../../../lib/supabase';
import type { Dog } from '../domain/dog';
import { BREED_ID_BY_BREED_GROUP } from '../domain/dog';
import type { Household } from '../domain/household';

/**
 * Talks to the `dog`/`household` tables directly (CLAUDE.md: the app holds
 * no planner logic, only data access) — `owner` is never sent, the column
 * default (`auth.uid()`, `0001_init.sql`) fills it in server-side.
 */
export const onboardingRepository = {
  /** The signed-in owner's dog id, or `null` if none exists yet — RLS
   * already scopes the query to `auth.uid()`. */
  async findExistingDogId(): Promise<string | null> {
    const { data, error } = await supabase.from('dog').select('id').maybeSingle();
    if (error) throw error;
    return (data?.id as string | undefined) ?? null;
  },

  /** Creates the `dog` row, then links it to the `breed` matching the
   * chosen breed group via `dog_breed` (`breed_group` no longer lives on
   * `dog` itself, `0003_rasse.sql`). No `weight`: a single linked breed
   * doesn't need one (`resolveBreedGroups`, `generate-plan/rows.ts` treats
   * a missing weight as "the whole dog"). */
  async createDog(dog: Dog): Promise<string> {
    const { data, error } = await supabase
      .from('dog')
      .insert({
        name: dog.name,
        birth_date: dog.birthDate,
        arrival_date: dog.arrivalDate,
        origin: dog.origin,
        size_class: dog.sizeClass,
        body_type: dog.bodyType,
        restrictions: dog.restrictions,
        gender: dog.gender,
        neutered: dog.neutered,
      })
      .select('id')
      .single();
    if (error) throw error;
    const dogId = data.id as string;

    const { error: breedError } = await supabase.from('dog_breed').insert({
      dog_id: dogId,
      breed_id: BREED_ID_BY_BREED_GROUP[dog.breedGroup],
    });
    if (breedError) throw breedError;

    return dogId;
  },

  async createHousehold(household: Household): Promise<void> {
    const { error } = await supabase.from('household').insert({
      postal_code: household.postalCode,
      housing_type: household.housingType,
      surroundings: household.surroundings,
      experience: household.experience,
      weekday_time_budget_min: household.weekdayTimeBudgetMinutes,
      weekend_time_budget_min: household.weekendTimeBudgetMinutes,
      training_days: household.trainingDays,
      planning_day: household.planningDay,
      household_size: household.householdSize,
      equipment: household.equipment,
    });
    if (error) throw error;
  },
};
