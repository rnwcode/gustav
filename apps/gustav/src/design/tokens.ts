// Design tokens ported from the Gustav design concept
// (claude.ai/design/p/6d68f553-fd83-4de4-8566-b7a40380a6c0). Keep every
// screen sourcing color/type/spacing from here — a palette or font change
// should never require touching a screen file.

export const palette = {
  light: {
    background: '#EFEAE1',
    surface: '#F9F6F0',
    surfaceHover: '#F2EDE4',
    textPrimary: '#221F1A',
    textSecondary: '#5E5749',
    textMuted: '#6E675B',
    textFaint: '#8A8272',
    accent: '#7A6A52',
    accentHover: '#68593F',
    accentTint: 'rgba(122,106,82,0.12)',
    accentTintHover: 'rgba(122,106,82,0.2)',
    accentTintStrong: 'rgba(122,106,82,0.14)',
    accentTintText: '#5E5140',
    onAccent: '#FBF8F2',
    divider: 'rgba(34,31,26,0.07)',
    track: 'rgba(34,31,26,0.10)',
    placeholder: 'rgba(122,106,82,0.13)',
  },
  dark: {
    background: '#191712',
    surface: '#211E18',
    surfaceHover: '#2A261E',
    textPrimary: '#EDE7DA',
    textSecondary: '#9C9484',
    textMuted: '#9C9484',
    textFaint: '#8B8474',
    accent: '#C3AE8C',
    accentHover: '#D8C6A8',
    accentTint: 'rgba(195,174,140,0.16)',
    accentTintHover: 'rgba(195,174,140,0.24)',
    accentTintStrong: 'rgba(195,174,140,0.16)',
    accentTintText: '#C3AE8C',
    onAccent: '#191712',
    divider: 'rgba(237,231,218,0.10)',
    track: 'rgba(237,231,218,0.12)',
    placeholder: 'rgba(195,174,140,0.14)',
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type Palette = (typeof palette)[ColorScheme];

export const fonts = {
  serifRegular: 'SourceSerif4_400Regular',
  serifMedium: 'SourceSerif4_500Medium',
  serifSemibold: 'SourceSerif4_600SemiBold',
  sansRegular: 'IBMPlexSans_400Regular',
  sansMedium: 'IBMPlexSans_500Medium',
  mono: 'IBMPlexMono_400Regular',
} as const;

export const radii = {
  sm: 10,
  md: 12,
  lg: 13,
  xl: 14,
  xxl: 16,
  pill: 11,
  round: 999,
} as const;

export const spacing = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
