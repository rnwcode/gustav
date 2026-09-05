import type { PropsWithChildren } from 'react';
import { Text as RNText, type TextStyle } from 'react-native';

import { fonts } from '../tokens';
import { useTheme } from '../useTheme';

type Props = PropsWithChildren<{ style?: TextStyle | TextStyle[]; numberOfLines?: number }>;

/** The large serif heading/frame text — the biggest text on any screen. */
export function Heading({ style, children, numberOfLines }: Props) {
  const { colors } = useTheme();
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: fonts.serifMedium, fontSize: 29, lineHeight: 36, color: colors.textPrimary },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

/** The frame sentence on the day header — serif, set as running prose. */
export function FrameText({ style, children, numberOfLines }: Props) {
  const { colors } = useTheme();
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: fonts.serifRegular, fontSize: 23, lineHeight: 33, color: colors.textPrimary },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

export function Title({ style, children, numberOfLines }: Props) {
  const { colors } = useTheme();
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: fonts.serifMedium, fontSize: 25, lineHeight: 31, color: colors.textPrimary },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

export function Body({ style, children, numberOfLines }: Props) {
  const { colors } = useTheme();
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: fonts.sansRegular, fontSize: 15, lineHeight: 23, color: colors.textMuted },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

export function Label({ style, children, numberOfLines }: Props) {
  const { colors } = useTheme();
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: fonts.mono,
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 0.9,
          textTransform: 'uppercase',
          color: colors.textFaint,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

export function Mono({ style, children, numberOfLines }: Props) {
  const { colors } = useTheme();
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: fonts.mono, fontSize: 12, lineHeight: 15, color: colors.textFaint },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

export function ValueText({ style, children, numberOfLines }: Props) {
  const { colors } = useTheme();
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: fonts.sansRegular, fontSize: 19, lineHeight: 23, color: colors.textPrimary },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
