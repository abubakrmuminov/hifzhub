import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const asyncStorage: StateStorage = {
  setItem: (name: string, value: string) => AsyncStorage.setItem(name, value),
  getItem: (name: string) => AsyncStorage.getItem(name),
  removeItem: (name: string) => AsyncStorage.removeItem(name),
};

export type AppLanguage = 'ru' | 'uz';
export type AppTheme = 'light' | 'dark' | 'system';
export type ReadingMode = 'translation' | 'mushaf';
export type UserLevel = 'beginner' | 'intermediate' | 'memorizer';

export interface SettingsState {
  language: AppLanguage;
  theme: AppTheme;
  defaultReciter: string;
  quranFontSize: number;
  showTranslation: boolean;
  showTajweed: boolean;
  readingMode: ReadingMode;
  lastReadSurahId: number;
  lastReadAyahNumber: number;
  userSeed: string;
  hasCompletedOnboarding: boolean;
  userLevel: UserLevel;
  dailyGoalMinutes: number;

  setLanguage: (language: AppLanguage) => void;
  setTheme: (theme: AppTheme) => void;
  setDefaultReciter: (reciter: string) => void;
  setQuranFontSize: (fontSize: number) => void;
  setShowTranslation: (show: boolean) => void;
  setShowTajweed: (show: boolean) => void;
  setReadingMode: (mode: ReadingMode) => void;
  setLastRead: (surahId: number, ayahNumber: number) => void;
  setUserLevel: (level: UserLevel) => void;
  setDailyGoalMinutes: (minutes: number) => void;
  completeOnboarding: (params: {
    language: AppLanguage;
    userLevel: UserLevel;
    dailyGoalMinutes: number;
  }) => void;
  resetOnboarding: () => void;
  resetSettings: () => void;
}

const generateInitialSeed = () =>
  'seed_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

const defaultSettings = {
  language: 'ru' as AppLanguage,
  theme: 'system' as AppTheme,
  defaultReciter: 'ar.alafasy',
  quranFontSize: 28,
  showTranslation: true,
  showTajweed: true,
  readingMode: 'translation' as ReadingMode,
  lastReadSurahId: 1,
  lastReadAyahNumber: 1,
  userSeed: generateInitialSeed(),
  hasCompletedOnboarding: false,
  userLevel: 'beginner' as UserLevel,
  dailyGoalMinutes: 10,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setDefaultReciter: (defaultReciter) => set({ defaultReciter }),
      setQuranFontSize: (quranFontSize) => set({ quranFontSize }),
      setShowTranslation: (showTranslation) => set({ showTranslation }),
      setShowTajweed: (showTajweed) => set({ showTajweed }),
      setReadingMode: (readingMode) => set({ readingMode }),
      setLastRead: (lastReadSurahId, lastReadAyahNumber) =>
        set({ lastReadSurahId, lastReadAyahNumber }),
      setUserLevel: (userLevel) => set({ userLevel }),
      setDailyGoalMinutes: (dailyGoalMinutes) => set({ dailyGoalMinutes }),
      completeOnboarding: ({ language, userLevel, dailyGoalMinutes }) =>
        set({ language, userLevel, dailyGoalMinutes, hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'hifzhub-settings',
      storage: createJSONStorage(() => asyncStorage),
    }
  )
);
