import { supabase } from '../../../lib/supabase';
import type { Dog } from '../domain/dog';
import { RASSE_ID_BY_BREED_GROUP } from '../domain/dog';
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

  /** Creates the `hund` row, then links it to the `rasse` matching the
   * chosen breed group via `hund_rasse` (`rassegruppe` no longer lives on
   * `hund` itself, `0003_rasse.sql`). No `gewichtung`: a single linked
   * breed doesn't need one (`resolveBreedGroups`, `generate-plan/rows.ts`
   * treats a missing weight as "the whole dog"). */
  async createDog(dog: Dog): Promise<string> {
    const { data, error } = await supabase
      .from('hund')
      .insert({
        name: dog.name,
        geburtsdatum: dog.birthDate,
        einzugsdatum: dog.arrivalDate,
        herkunft: dog.origin,
        groessenklasse: dog.sizeClass,
        koerperbau: dog.bodyType,
        einschraenkungen: dog.restrictions,
        geschlecht: dog.gender,
        kastriert: dog.neutered,
      })
      .select('id')
      .single();
    if (error) throw error;
    const dogId = data.id as string;

    const { error: rasseError } = await supabase.from('hund_rasse').insert({
      hund_id: dogId,
      rasse_id: RASSE_ID_BY_BREED_GROUP[dog.breedGroup],
    });
    if (rasseError) throw rasseError;

    return dogId;
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
