import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, radii, spacing } from '../tokens';
import { useTheme } from '../useTheme';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
};

/** Equal-width exclusive toggle row — Größe, Wohnsituation, Umgebung, Erfahrung. */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, { backgroundColor: selected ? colors.accent : colors.surface }]}
          >
            <Text
              style={{
                fontFamily: fonts.sansRegular,
                fontSize: 15,
                color: selected ? colors.onAccent : colors.textMuted,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radii.pill,
  },
});
