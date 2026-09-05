import { StyleSheet, View } from 'react-native';

import { Body, Heading, Label, SegmentedControl } from '../../../../design/components';
import { spacing } from '../../../../design/tokens';
import { EXPERIENCE_OPTIONS, HOUSING_TYPE_OPTIONS, SURROUNDINGS_OPTIONS } from '../../domain/household';
import { useOnboardingStore } from '../../data/onboardingStore';

export function Step4Household() {
  const draft = useOnboardingStore((s) => s.draft);
  const setHousehold = useOnboardingStore((s) => s.setHousehold);

  return (
    <View style={styles.group}>
      <View style={styles.intro}>
        <Heading>Wo wohnt ihr?</Heading>
        <Body>Entscheidet, welche Orte im Plan überhaupt vorkommen.</Body>
      </View>

      <View style={styles.field}>
        <Label>Wohnsituation</Label>
        <SegmentedControl
          options={HOUSING_TYPE_OPTIONS}
          value={draft.housingType ?? undefined}
          onChange={(housingType) => setHousehold({ housingType })}
        />
      </View>

      <View style={styles.field}>
        <Label>Umgebung</Label>
        <SegmentedControl
          options={SURROUNDINGS_OPTIONS}
          value={draft.surroundings ?? undefined}
          onChange={(surroundings) => setHousehold({ surroundings })}
        />
      </View>

      <View style={styles.field}>
        <Label>Erfahrung</Label>
        <SegmentedControl
          options={EXPERIENCE_OPTIONS}
          value={draft.experience ?? undefined}
          onChange={(experience) => setHousehold({ experience })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xl },
  intro: { gap: spacing.sm },
  field: { gap: spacing.sm },
});
