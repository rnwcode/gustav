import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Body, Chip, ChipRow, Heading, Label, TappableField } from '../../../../design/components';
import { spacing } from '../../../../design/tokens';
import { BREED_GROUP_OPTIONS, ORIGIN_OPTIONS } from '../../domain/dog';
import { useOnboardingStore } from '../../data/onboardingStore';
import { formatDateDe } from '../lifeStageHint';

export function Step2Origin() {
  const draft = useOnboardingStore((s) => s.draft);
  const setDogBasics = useOnboardingStore((s) => s.setDogBasics);
  const setBreed = useOnboardingStore((s) => s.setBreed);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <View style={styles.group}>
      <View style={styles.intro}>
        <Heading>Woher kommt er?</Heading>
        <Body>Und seit wann ist er bei dir? Die ersten Wochen im neuen Haushalt planen sich leiser.</Body>
      </View>

      <View style={styles.field}>
        <Label>Herkunft</Label>
        <ChipRow>
          {ORIGIN_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={draft.origin === o.value}
              onPress={() => setDogBasics({ origin: o.value })}
            />
          ))}
        </ChipRow>
      </View>

      <View style={styles.field}>
        <Label>Rassegruppe</Label>
        <ChipRow>
          {BREED_GROUP_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={draft.breedGroup === o.value}
              onPress={() => setBreed({ breedGroup: o.value })}
            />
          ))}
        </ChipRow>
        <Body>Die Gruppe gewichtet Vorschläge, sie schließt nichts aus.</Body>
      </View>

      <TappableField
        label="Bei dir seit"
        valueLabel={draft.arrivalDate ? formatDateDe(draft.arrivalDate) : 'Auswählen'}
        onPress={() => setPickerOpen(true)}
      />

      {pickerOpen ? (
        <DateTimePicker
          value={draft.arrivalDate ? new Date(draft.arrivalDate) : new Date()}
          mode="date"
          maximumDate={new Date()}
          onChange={(_, date) => {
            setPickerOpen(false);
            if (date) setDogBasics({ arrivalDate: date.toISOString().slice(0, 10) });
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xl },
  intro: { gap: spacing.sm },
  field: { gap: spacing.sm },
});
