import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { fonts, radii, spacing } from '../tokens';
import { useTheme } from '../useTheme';

type Variant = 'primary' | 'tint' | 'ghost' | 'text';

type Props = PropsWithChildren<{
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  flex?: boolean;
}>;

/**
 * The one button component every screen uses — "Loslegen"/"Erste Periode
 * erzeugen" is `primary`, "Weiter" is `tint`, "Zurück" is `ghost`, and quiet
 * actions like "Heute ist zu viel" or "ändern" are `text`.
 */
export function Button({ onPress, variant = 'primary', disabled, loading, flex, children }: Props) {
  const { colors } = useTheme();

  const backgrounds: Record<Variant, string> = {
    primary: colors.accent,
    tint: colors.accentTint,
    ghost: colors.surface,
    text: 'transparent',
  };
  const textColors: Record<Variant, string> = {
    primary: colors.onAccent,
    tint: colors.accentTintText,
    ghost: colors.textMuted,
    text: colors.textFaint,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        variant === 'text' ? styles.textBase : styles.base,
        flex ? styles.flex : undefined,
        variant !== 'text' && { backgroundColor: backgrounds[variant] },
        pressed && variant !== 'text' && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <Text
          style={[
            {
              fontFamily: variant === 'primary' || variant === 'tint' ? fonts.sansMedium : fonts.sansRegular,
              fontSize: variant === 'text' ? 15 : 16,
              color: textColors[variant],
            },
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBase: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
  },
  flex: { flex: 1 },
});
