import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { radii } from '../tokens';
import { useTheme } from '../useTheme';

type Props = PropsWithChildren<{ style?: ViewStyle; rounded?: boolean }>;

/**
 * Stand-in for the illustration slots the design reserves (dog expression,
 * exercise step image) until real artwork exists. A flat tint, not a
 * skeleton loader — this is deliberate empty space, not a loading state.
 */
export function PlaceholderArt({ style, rounded = true, children }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors.placeholder, borderRadius: rounded ? radii.xxl : 0 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
