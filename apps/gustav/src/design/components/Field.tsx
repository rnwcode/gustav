import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { fonts, radii, spacing } from '../tokens';
import { useTheme } from '../useTheme';
import { Label } from './Type';

type WrapperProps = PropsWithChildren<{ label: string; hint?: string }>;

function FieldWrapper({ label, hint, children }: WrapperProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.group}>
      <Label>{label}</Label>
      {children}
      {hint ? (
        <Text style={{ fontFamily: fonts.sansRegular, fontSize: 13, lineHeight: 19, color: colors.accent }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  hint?: string;
};

/** A single-line text entry styled as the design's input box (e.g. Name). */
export function TextField({ label, value, onChangeText, placeholder, hint }: TextFieldProps) {
  const { colors } = useTheme();
  return (
    <FieldWrapper label={label} hint={hint}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        style={[
          styles.box,
          { backgroundColor: colors.surface, color: colors.textPrimary, fontFamily: fonts.sansRegular },
        ]}
      />
    </FieldWrapper>
  );
}

type TappableFieldProps = {
  label: string;
  valueLabel: string;
  onPress: () => void;
  hint?: string;
  trailingLabel?: string;
};

/** A tap-to-open field styled as the design's box (e.g. a date, a day picker). */
export function TappableField({ label, valueLabel, onPress, hint, trailingLabel }: TappableFieldProps) {
  const { colors } = useTheme();
  return (
    <FieldWrapper label={label} hint={hint}>
      <Pressable
        onPress={onPress}
        style={[styles.box, styles.tappable, { backgroundColor: colors.surface }]}
      >
        <Text style={{ fontFamily: fonts.sansRegular, fontSize: 19, color: colors.textPrimary }}>
          {valueLabel}
        </Text>
        {trailingLabel ? (
          <Text style={{ fontFamily: fonts.sansRegular, fontSize: 13, color: colors.textFaint }}>
            {trailingLabel}
          </Text>
        ) : null}
      </Pressable>
    </FieldWrapper>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  box: {
    borderRadius: radii.md,
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    fontSize: 19,
  },
  tappable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
