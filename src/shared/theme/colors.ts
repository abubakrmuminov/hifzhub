export const Colors = {
  primary: '#0D6B4E',
  primaryDark: '#094D38',
  primaryLight: '#12956B',
  secondary: '#D4A745',
  secondaryDark: '#B8912E',
  secondaryLight: '#E4BF6A',

  light: {
    background: '#F8F6F0',
    surface: '#FFFFFF',
    surfaceGlass: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    textTertiary: '#999999',
    quranText: '#1A1A1A',
    border: 'rgba(0, 0, 0, 0.06)',
    borderGlass: 'rgba(0, 0, 0, 0.06)',
  },
  dark: {
    background: '#131322',
    surface: '#1E1E34',
    surfaceGlass: '#1E1E34',
    text: '#E8E3D9',
    textSecondary: '#A0A0B0',
    textTertiary: '#6B6B80',
    quranText: '#E8E3D9',
    border: 'rgba(255, 255, 255, 0.08)',
    borderGlass: 'rgba(255, 255, 255, 0.08)',
  },

  tajweed: {
    idgham: '#169B62',
    ikhfa: '#E67E22',
    iqlab: '#3498DB',
    qalqalah: '#E74C3C',
    ghunna: '#9B59B6',
    madd: '#E91E8E',
  },

  success: '#27AE60',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#3498DB',
} as const;

export type ThemeColors = Record<keyof typeof Colors.light, string>;
export type TajweedColors = typeof Colors.tajweed;
export type TajweedRuleKey = keyof TajweedColors;
