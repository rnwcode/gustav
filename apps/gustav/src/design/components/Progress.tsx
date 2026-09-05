import { StyleSheet, View } from 'react-native';

import { useTheme } from '../useTheme';

/** The dash row at the top of onboarding — filled dashes up to the current step. */
export function ProgressDashes({ total, current }: { total: number; current: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.dashRow}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dash,
            { backgroundColor: i === current ? colors.accent : colors.divider },
          ]}
        />
      ))}
    </View>
  );
}

/** The small round dots under an exercise's step image. */
export function ProgressDots({ total, current }: { total: number; current: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.dotRow}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[styles.dot, { backgroundColor: i === current ? colors.accent : colors.divider }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dashRow: { flexDirection: 'row', gap: 6 },
  dash: { width: 22, height: 3, borderRadius: 2 },
  dotRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
