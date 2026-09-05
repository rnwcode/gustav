import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { fonts, radii, spacing } from '../tokens';
import { useTheme } from '../useTheme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** A single selectable pill — origin, breed group, "trifft zu" chips. */
export function Chip({ label, selected, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: selected ? colors.accent : colors.surface },
      ]}
    >
      <Text
        style={{
          fontFamily: fonts.sansRegular,
          fontSize: 15,
          color: selected ? colors.onAccent : colors.textMuted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipRow({ style, children }: { style?: ViewStyle; children: React.ReactNode }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: radii.pill,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
