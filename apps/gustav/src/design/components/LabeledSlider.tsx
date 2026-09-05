import Slider from '@react-native-community/slider';
import { StyleSheet, Text, View } from 'react-native';

import { fonts, spacing } from '../tokens';
import { useTheme } from '../useTheme';
import { Label } from './Type';

type Props = {
  label: string;
  minutes: number;
  min: number;
  max: number;
  step: number;
  onChange: (minutes: number) => void;
};

/** Time-budget slider — value shown above as serif, e.g. "10 Min". */
export function LabeledSlider({ label, minutes, min, max, step, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.group}>
      <View style={styles.header}>
        <Label>{label}</Label>
        <Text style={{ fontFamily: fonts.serifMedium, fontSize: 20, color: colors.textPrimary }}>
          {minutes} Min
        </Text>
      </View>
      <Slider
        value={minutes}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.track}
        thumbTintColor={colors.accent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
