import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Body, Heading, TappableField, TextField } from '../../../../design/components';
import { spacing } from '../../../../design/tokens';
import { useOnboardingStore } from '../../data/onboardingStore';
import { formatDateDe, lifeStageHint } from '../lifeStageHint';

export function Step1Dog() {
  const draft = useOnboardingStore((s) => s.draft);
  const setDogBasics = useOnboardingStore((s) => s.setDogBasics);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <View style={styles.group}>
      <View style={styles.intro}>
        <Heading>Wie heißt er?</Heading>
        <Body>Der Name steht später in jedem Tagesrahmen.</Body>
      </View>

      <TextField
        label="Name"
        value={draft.dogName ?? ''}
        onChangeText={(dogName) => setDogBasics({ dogName })}
        placeholder="Gustav"
      />

      <TappableField
        label="Geburtsdatum"
        valueLabel={draft.birthDate ? formatDateDe(draft.birthDate) : 'Auswählen'}
        onPress={() => setPickerOpen(true)}
        hint={draft.birthDate ? lifeStageHint(draft.birthDate) : undefined}
      />

      {pickerOpen ? (
        <DateTimePicker
          value={draft.birthDate ? new Date(draft.birthDate) : new Date()}
          mode="date"
          maximumDate={new Date()}
          onChange={(_, date) => {
            setPickerOpen(false);
            if (date) setDogBasics({ birthDate: date.toISOString().slice(0, 10) });
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xl },
  intro: { gap: spacing.sm },
});
