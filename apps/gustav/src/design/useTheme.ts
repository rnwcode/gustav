import { useColorScheme } from 'react-native';

import { palette } from './tokens';

/** The active palette, following the device's light/dark setting. */
export function useTheme() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? palette.dark : palette.light;
  return { scheme: scheme === 'dark' ? ('dark' as const) : ('light' as const), colors };
}
