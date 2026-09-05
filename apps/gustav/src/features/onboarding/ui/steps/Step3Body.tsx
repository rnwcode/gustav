import { StyleSheet, View } from 'react-native';

import { Body, Chip, ChipRow, Heading, Label, SegmentedControl } from '../../../../design/components';
import { spacing } from '../../../../design/tokens';
import { BODY_TYPE_OPTIONS, SIZE_CLASS_OPTIONS } from '../../domain/dog';
import { useOnboardingStore } from '../../data/onboardingStore';

export function Step3Body() {
  const draft = useOnboardingStore((s) => s.draft);
  const setBreed = useOnboardingStore((s) => s.setBreed);
  const toggleBodyType = useOnboardingStore((s) => s.toggleBodyType);

  return (
    <View style={styles.group}>
      <View style={styles.intro}>
        <Heading>Körperbau</Heading>
        <Body>Zwei Angaben mit Folgen: Hitze und Gelenke.</Body>
      </View>

      <View style={styles.field}>
        <Label>Größe</Label>
        <SegmentedControl
          options={SIZE_CLASS_OPTIONS}
          value={draft.sizeClass ?? undefined}
          onChange={(sizeClass) => setBreed({ sizeClass })}
        />
      </View>

      <View style={styles.field}>
        <Label>Trifft zu</Label>
        <ChipRow>
          {BODY_TYPE_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={draft.bodyType.has(o.value)}
              onPress={() => toggleBodyType(o.value)}
            />
          ))}
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
