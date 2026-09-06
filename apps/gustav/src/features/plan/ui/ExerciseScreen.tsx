import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Body, Button, FrameText, Mono, PlaceholderArt, Screen } from '../../../design/components';
import { spacing } from '../../../design/tokens';
import { usePlanStore } from '../data/planStore';
import type { SlotResult } from '../domain/weeklyPlan';

const RATING_OPTIONS: { value: SlotResult; label: string }[] = [
  { value: 'succeeded', label: 'Klappte' },
  { value: 'partial', label: 'So halb' },
  { value: 'notYet', label: 'Noch nicht' },
];

const RATED_LABEL: Partial<Record<SlotResult, string>> = {
  succeeded: 'Klappte',
  partial: 'So halb',
  notYet: 'Noch nicht',
};

type Props = { slotId: string };

export function ExerciseScreen({ slotId }: Props) {
  const router = useRouter();
  const plan = usePlanStore((s) => s.plan);
  const setSlotResult = usePlanStore((s) => s.setSlotResult);
  const slot = plan?.slots.find((s) => s.id === slotId) ?? null;

  if (!slot) {
    return (
      <Screen>
        <View style={styles.content}>
          <Body>Diese Übung wurde nicht gefunden.</Body>
        </View>
      </Screen>
    );
  }

  const isRated = slot.result !== null && slot.result !== 'skipped';

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Button variant="text" onPress={() => router.back()}>
            ‹ {slot.title ?? 'Übung'}
          </Button>
        </View>

        <PlaceholderArt style={styles.art} />

        {slot.sentence ? <FrameText>{slot.sentence}</FrameText> : null}

        <View style={styles.footer}>
          {isRated ? (
            <View style={styles.ratedRow}>
              <View>
                <Body>{RATED_LABEL[slot.result!]}</Body>
                <Mono>Notiert.</Mono>
              </View>
              <Button variant="text" onPress={() => setSlotResult(slot.id!, null)}>
                ändern
              </Button>
            </View>
          ) : (
            <View style={styles.ratingGroup}>
              <Mono>Wie lief es?</Mono>
              <View style={styles.ratingRow}>
                {RATING_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant="ghost"
                    flex
                    onPress={() => setSlotResult(slot.id!, option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.xl, gap: spacing.xl },
  topBar: { flexDirection: 'row' },
  art: { height: 260 },
  footer: { marginTop: 'auto', gap: spacing.md },
  ratingGroup: { gap: spacing.sm },
  ratingRow: { flexDirection: 'row', gap: spacing.sm },
  ratedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
