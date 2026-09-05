import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Weekday } from '../../features/onboarding/domain/weekday';
import { WEEKDAY_ORDER, weekdayShortLabel } from '../../features/onboarding/domain/weekday';
import { fonts, radii, spacing } from '../tokens';
import { useTheme } from '../useTheme';

type Props = {
  selected: ReadonlySet<Weekday>;
  onToggle: (day: Weekday) => void;
};

/** Mo–So multi-select row — training days. */
export function WeekdayRow({ selected, onToggle }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {WEEKDAY_ORDER.map((day) => {
        const active = selected.has(day);
        return (
          <Pressable
            key={day}
            onPress={() => onToggle(day)}
            style={[styles.day, { backgroundColor: active ? colors.accent : colors.surface }]}
          >
            <Text
              style={{
                fontFamily: fonts.sansRegular,
                fontSize: 14,
                color: active ? colors.onAccent : colors.textMuted,
              }}
            >
              {weekdayShortLabel(day)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  day: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: radii.sm,
  },
});
