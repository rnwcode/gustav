import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Body, Button, Label, Mono, PlaceholderArt, Screen, Title } from '../../../design/components';
import { spacing } from '../../../design/tokens';
import { usePlanStore } from '../data/planStore';
import { REASON_LABELS } from '../domain/weeklyPlan';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekdayHeaderLabel(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function DayScreen() {
  const router = useRouter();
  const plan = usePlanStore((s) => s.plan);
  const setSlotResult = usePlanStore((s) => s.setSlotResult);

  const today = useMemo(() => todayIso(), []);
  const slot = plan?.slots.find((s) => s.date === today) ?? null;

  return (
    <Screen edges={['bottom']}>
      <PlaceholderArt rounded={false} style={styles.header}>
        <Mono style={styles.headerLabel}>{weekdayHeaderLabel(today)}</Mono>
      </PlaceholderArt>

      {!slot ? (
        <View style={styles.content}>
          <Label>Deine eine Sache</Label>
          <Body>Für heute liegt noch kein Tag in der aktuellen Periode vor.</Body>
        </View>
      ) : slot.result === 'uebersprungen' ? (
        <View style={styles.content}>
          <Label>Deine eine Sache</Label>
          <Title>Nichts.</Title>
          <Body>Das ist die Übung. Morgen steht wieder etwas an.</Body>
          <Button variant="text" onPress={() => setSlotResult(slot.id!, null)}>
            Doch wieder anzeigen
          </Button>
        </View>
      ) : slot.activityId === null ? (
        <View style={styles.content}>
          <Label>Deine eine Sache</Label>
          <Title>Nichts.</Title>
          <Body>Das ist die Übung. Morgen steht wieder etwas an.</Body>
        </View>
      ) : (
        <View style={styles.content}>
          <Label>Deine eine Sache</Label>
          <Title>{slot.title ?? 'Heutige Übung'}</Title>
          {slot.sentence ? <Body>{slot.sentence}</Body> : null}
          <Mono>{REASON_LABELS[slot.reason.kind]}</Mono>

          <View style={styles.actions}>
            <Button
              variant="primary"
              onPress={() => router.push({ pathname: '/exercise/[slotId]', params: { slotId: slot.id ?? '' } })}
            >
              Loslegen
            </Button>
            {slot.id ? (
              <Button variant="text" onPress={() => setSlotResult(slot.id!, 'uebersprungen')}>
                Heute ist zu viel
              </Button>
            ) : null}
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 260,
    borderRadius: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: spacing.xl,
  },
  headerLabel: { position: 'absolute', bottom: spacing.xl, left: spacing.xl },
  content: { flex: 1, padding: spacing.xl, gap: spacing.md },
  actions: { marginTop: 'auto', gap: spacing.sm, paddingTop: spacing.xl },
});
