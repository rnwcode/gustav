import { supabase } from '../../../lib/supabase';
import type { Dog } from '../domain/dog';
import type { Household } from '../domain/household';

/**
 * Talks to the `hund`/`haushalt` tables directly (CLAUDE.md: the app holds
 * no planner logic, only data access) — `besitzer` is never sent, the
 * column default (`auth.uid()`, `0001_init.sql`) fills it in server-side.
 */
export const onboardingRepository = {
  /** The signed-in owner's dog id, or `null` if none exists yet — RLS
   * already scopes the query to `auth.uid()`. */
  async findExistingDogId(): Promise<string | null> {
    const { data, error } = await supabase.from('hund').select('id').maybeSingle();
    if (error) throw error;
    return (data?.id as string | undefined) ?? null;
  },

  async createDog(dog: Dog): Promise<string> {
    const { data, error } = await supabase
      .from('hund')
      .insert({
        name: dog.name,
        geburtsdatum: dog.birthDate,
        einzugsdatum: dog.arrivalDate,
        herkunft: dog.origin,
        rassegruppe: dog.breedGroup,
        groessenklasse: dog.sizeClass,
        koerperbau: dog.bodyType,
        einschraenkungen: dog.restrictions,
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id as string;
  },

  async createHousehold(household: Household): Promise<void> {
    const { error } = await supabase.from('haushalt').insert({
      plz: household.postalCode,
      wohnsituation: household.housingType,
      umgebung: household.surroundings,
      erfahrung: household.experience,
      zeitbudget_werktag_min: household.weekdayTimeBudgetMinutes,
      zeitbudget_wochenende_min: household.weekendTimeBudgetMinutes,
      trainingstage: household.trainingDays,
      planungstag: household.planningDay,
      personen: household.householdSize,
      equipment: household.equipment,
    });
    if (error) throw error;
  },
};
