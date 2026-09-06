import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { Colors, type ThemeColors, type TajweedColors } from './colors';
import { Spacing } from './spacing';
import { Radius } from './radius';
import { Shadows } from './shadows';
import { Typography, FontFamilies, FontSizes, FontWeights, getQuranLineHeight } from './typography';

export * from './colors';
export * from './spacing';
export * from './radius';
export * from './shadows';
export * from './typography';

export interface Theme {
  isDark: boolean;
  colors: ThemeColors & {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    secondaryDark: string;
    secondaryLight: string;
    tajweed: TajweedColors;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  spacing: typeof Spacing;
  radius: typeof Radius;
  shadows: typeof Shadows;
  typography: typeof Typography;
  fontFamilies: typeof FontFamilies;
  fontSizes: typeof FontSizes;
}

export const useTheme = (): Theme => {
  const systemScheme = useColorScheme();
  const userTheme = useSettingsStore((s) => s.theme);

  const isDark =
    userTheme === 'dark'
      ? true
      : userTheme === 'light'
      ? false
      : systemScheme === 'dark';

  const currentColors = isDark ? Colors.dark : Colors.light;

  return {
    isDark,
    colors: {
      ...currentColors,
      primary: Colors.primary,
      primaryDark: Colors.primaryDark,
      primaryLight: Colors.primaryLight,
      secondary: Colors.secondary,
      secondaryDark: Colors.secondaryDark,
      secondaryLight: Colors.secondaryLight,
      tajweed: Colors.tajweed,
      success: Colors.success,
      warning: Colors.warning,
      error: Colors.error,
      info: Colors.info,
    },
    spacing: Spacing,
    radius: Radius,
    shadows: Shadows,
    typography: Typography,
    fontFamilies: FontFamilies,
    fontSizes: FontSizes,
  };
};
