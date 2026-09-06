import { Platform, TextStyle } from 'react-native';

export const FontFamilies = {
  quran: 'KFGQPC_HAFS',
  arabic: 'Amiri',
  ui: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
} as const;

export const FontSizes = {
  xxs: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  // Quran-specific font sizes
  quranSm: 22,
  quranMd: 28,
  quranLg: 34,
  quranXl: 40,
} as const;

export const QURAN_LINE_HEIGHT_MULTIPLIER = 2.5;

export const getQuranLineHeight = (fontSize: number): number => {
  return Math.round(fontSize * QURAN_LINE_HEIGHT_MULTIPLIER);
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Typography: Record<string, TextStyle> = {
  // UI Headings & Body
  h1: {
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.bold,
    lineHeight: 40,
    fontFamily: FontFamilies.ui,
  },
  h2: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    lineHeight: 32,
    fontFamily: FontFamilies.ui,
  },
  h3: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    lineHeight: 28,
    fontFamily: FontFamilies.ui,
  },
  bodyLarge: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.regular,
    lineHeight: 24,
    fontFamily: FontFamilies.ui,
  },
  bodyMedium: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.regular,
    lineHeight: 22,
    fontFamily: FontFamilies.ui,
  },
  bodySmall: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    lineHeight: 18,
    fontFamily: FontFamilies.ui,
  },
  caption: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    lineHeight: 16,
    fontFamily: FontFamilies.ui,
  },

  // Quran & Arabic Specific
  quranText: {
    fontFamily: FontFamilies.quran,
    fontSize: FontSizes.quranMd,
    lineHeight: getQuranLineHeight(FontSizes.quranMd),
    textAlign: 'right',
  },
  arabicText: {
    fontFamily: FontFamilies.arabic,
    fontSize: FontSizes.xl,
    lineHeight: Math.round(FontSizes.xl * 1.8),
    textAlign: 'right',
  },
} as const;

export type FontSizeKey = keyof typeof FontSizes;
export type FontWeightKey = keyof typeof FontWeights;
