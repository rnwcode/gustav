import { StyleSheet, View } from 'react-native';

import { Body, Heading, PlaceholderArt, SummaryRow } from '../../../../design/components';
import { spacing } from '../../../../design/tokens';
import { useOnboardingStore } from '../../data/onboardingStore';
import { weekdayFullLabel } from '../../domain/weekday';
import { lifeStageHint } from '../lifeStageHint';

export function Step6Review() {
  const draft = useOnboardingStore((s) => s.draft);

  return (
    <View style={styles.group}>
      <View style={styles.intro}>
        <Heading>Das ist {draft.dogName || 'dein Hund'}</Heading>
        <Body>Stimmt das so, dann rechnen wir die erste Periode.</Body>
      </View>

      <PlaceholderArt style={styles.art} />

      <View>
        <SummaryRow label="Alter" value={draft.birthDate ? lifeStageHint(draft.birthDate) : '—'} />
        <SummaryRow
          label="Bei dir seit"
          value={draft.arrivalDate ? lifeStageHint(draft.arrivalDate).split(' — ')[0] : '—'}
        />
        <SummaryRow
          label="Zeit werktags"
          value={draft.weekdayTimeBudgetMinutes ? `${draft.weekdayTimeBudgetMinutes} Minuten` : '—'}
        />
        <SummaryRow label="Planungstag" value={weekdayFullLabel(draft.planningDay)} last />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.lg },
  intro: { gap: spacing.sm },
  art: { height: 150 },
});
