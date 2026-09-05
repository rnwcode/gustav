import { StyleSheet, Text, View } from 'react-native';

import { fonts } from '../tokens';
import { useTheme } from '../useTheme';

/** One label/value row with a hairline divider — the onboarding review step. */
export function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: colors.divider }]}
    >
      <Text style={{ fontFamily: fonts.sansRegular, fontSize: 15, color: colors.textFaint }}>{label}</Text>
      <Text style={{ fontFamily: fonts.sansRegular, fontSize: 15, color: colors.textPrimary }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13 },
});
