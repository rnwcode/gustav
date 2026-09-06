import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Body, Chip, ChipRow, Heading, Label, TappableField, TextField } from '../../../../design/components';
import { spacing } from '../../../../design/tokens';
import { GENDER_OPTIONS } from '../../domain/dog';
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

      <View style={styles.field}>
        <Label>Geschlecht</Label>
        <ChipRow>
          {GENDER_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={draft.gender === o.value}
              onPress={() => setDogBasics({ gender: o.value })}
            />
          ))}
        </ChipRow>
      </View>

      <View style={styles.field}>
        <Label>Kastriert</Label>
        <ChipRow>
          <Chip label="Ja" selected={draft.neutered === true} onPress={() => setDogBasics({ neutered: true })} />
          <Chip label="Nein" selected={draft.neutered === false} onPress={() => setDogBasics({ neutered: false })} />
        </ChipRow>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xl },
  intro: { gap: spacing.sm },
  field: { gap: spacing.sm },
});
