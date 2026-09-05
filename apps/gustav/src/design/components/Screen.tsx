import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../useTheme';

type Props = PropsWithChildren<{
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}>;

/** Full-bleed background + safe area — every top-level screen starts here. */
export function Screen({ children, style, edges = ['top', 'bottom'] }: Props) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.root, { backgroundColor: colors.background }, style]}
    >
      <View style={styles.fill}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
});
