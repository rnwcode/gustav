import { StyleSheet, View } from 'react-native';

import { Body, Heading, Label, LabeledSlider, TappableField, WeekdayRow } from '../../../../design/components';
import { spacing } from '../../../../design/tokens';
import { useOnboardingStore } from '../../data/onboardingStore';
import { WEEKDAY_ORDER, weekdayFullLabel } from '../../domain/weekday';

export function Step5Budget() {
  const draft = useOnboardingStore((s) => s.draft);
  const setBudget = useOnboardingStore((s) => s.setBudget);
  const toggleTrainingDay = useOnboardingStore((s) => s.toggleTrainingDay);
  const setPlanningDay = useOnboardingStore((s) => s.setPlanningDay);

  return (
    <View style={styles.group}>
      <View style={styles.intro}>
        <Heading>Wie viel Zeit hast du wirklich?</Heading>
        <Body>Realistisch, nicht ambitioniert. Der Plan richtet sich danach.</Body>
      </View>

      <LabeledSlider
        label="Werktags"
        minutes={draft.weekdayTimeBudgetMinutes ?? 10}
        min={5}
        max={60}
        step={5}
        onChange={(weekdayTimeBudgetMinutes) => setBudget({ weekdayTimeBudgetMinutes })}
      />

      <LabeledSlider
        label="Wochenende"
        minutes={draft.weekendTimeBudgetMinutes ?? 25}
        min={5}
        max={90}
        step={5}
        onChange={(weekendTimeBudgetMinutes) => setBudget({ weekendTimeBudgetMinutes })}
      />

      <View style={styles.field}>
        <Label>Tage für Training</Label>
        <WeekdayRow selected={draft.trainingDays} onToggle={toggleTrainingDay} />
      </View>

      <View style={styles.field}>
        <TappableField
          label="Planungstag"
          valueLabel={weekdayFullLabel(draft.planningDay)}
          trailingLabel="ändern"
          onPress={() => {
            const index = WEEKDAY_ORDER.indexOf(draft.planningDay);
            setPlanningDay(WEEKDAY_ORDER[(index + 1) % WEEKDAY_ORDER.length]);
          }}
        />
        <Body>An diesem Tag erzählst du in drei Minuten, wie es lief.</Body>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xl },
  intro: { gap: spacing.sm },
  field: { gap: spacing.sm },
});
