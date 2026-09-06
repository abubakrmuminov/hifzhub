import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const asyncStorage: StateStorage = {
  setItem: (name: string, value: string) => AsyncStorage.setItem(name, value),
  getItem: (name: string) => AsyncStorage.getItem(name),
  removeItem: (name: string) => AsyncStorage.removeItem(name),
};

export const getTodayDateString = (d = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getTodayDateString(d);
};

export interface DayActivity {
  date: string; // 'YYYY-MM-DD'
  dayName: string; // 'Пн', 'Вт', etc.
  completedAyahs: number;
  isToday: boolean;
  hasActivity: boolean;
  metGoal: boolean;
}

export interface ProgressState {
  // Daily Goal
  dailyTarget: number; // Default: 10 ayahs
  dailyHistory: Record<string, number>; // dateString -> count of ayahs read that day

  // Streak tracking
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null; // dateString of last activity

  // Today's checklist tasks persistence
  tasksCompleted: Record<string, boolean>;
  lastTasksDate: string | null;

  // Actions
  recordAyahRead: (count?: number) => void;
  setDailyTarget: (target: number) => void;
  toggleTask: (taskId: string) => void;
  getTodayCompleted: () => number;
  getEffectiveStreak: () => number;
  checkAndRefreshDay: () => void;
  getLast7DaysActivity: (locale?: string) => DayActivity[];
  resetTodayProgress: () => void;
  resetAllProgress: () => void;
}

const DEFAULT_TARGET = 10;

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      dailyTarget: DEFAULT_TARGET,
      dailyHistory: {
        [getTodayDateString()]: 0,
      },
      currentStreak: 1, // Start with 1 on first launch as encouragement
      bestStreak: 1,
      lastActiveDate: getTodayDateString(),
      tasksCompleted: {},
      lastTasksDate: getTodayDateString(),

      checkAndRefreshDay: () => {
        const today = getTodayDateString();
        const yesterday = getYesterdayDateString();
        const { lastActiveDate, currentStreak, bestStreak, lastTasksDate } = get();

        // 1. Reset tasks if date changed
        if (lastTasksDate !== today) {
          set({
            tasksCompleted: {},
            lastTasksDate: today,
          });
        }

        // 2. Validate streak
        if (!lastActiveDate) {
          set({ currentStreak: 1, bestStreak: Math.max(bestStreak, 1), lastActiveDate: today });
          return;
        }

        if (lastActiveDate === today) {
          // Already active today, streak is valid
          return;
        }

        if (lastActiveDate === yesterday) {
          // Last active yesterday, streak is still alive!
          return;
        }

        // Gap of more than 1 day -> streak broke
        set({ currentStreak: 0 });

        // Cap existing today count if it was previously over-accumulated
        const todayCount = get().dailyHistory[today] ?? 0;
        if (todayCount > get().dailyTarget) {
          set({
            dailyHistory: {
              ...get().dailyHistory,
              [today]: get().dailyTarget,
            },
          });
        }
      },

      recordAyahRead: (count = 1) => {
        const today = getTodayDateString();
        const yesterday = getYesterdayDateString();
        const state = get();

        const currentTodayCount = state.dailyHistory[today] ?? 0;
        // Cap at dailyTarget: once the plan is reached, it doesn't inflate past the goal
        const newTodayCount = Math.min(state.dailyTarget, currentTodayCount + count);

        let newStreak = state.currentStreak;
        if (!state.lastActiveDate || state.lastActiveDate === yesterday) {
          newStreak = (state.currentStreak || 0) + 1;
        } else if (state.lastActiveDate !== today) {
          // Break in streak, restart at 1
          newStreak = 1;
        }

        const newBestStreak = Math.max(state.bestStreak || 1, newStreak);

        set({
          dailyHistory: {
            ...state.dailyHistory,
            [today]: newTodayCount,
          },
          currentStreak: newStreak,
          bestStreak: newBestStreak,
          lastActiveDate: today,
        });
      },

      setDailyTarget: (target: number) => {
        const safeTarget = Math.max(1, target);
        set({ dailyTarget: safeTarget });
      },

      toggleTask: (taskId: string) => {
        const today = getTodayDateString();
        const state = get();
        const isCurrentDay = state.lastTasksDate === today;
        const currentTasks = isCurrentDay ? state.tasksCompleted : {};
        const willBeCompleted = !currentTasks[taskId];

        const updatedTasks = {
          ...currentTasks,
          [taskId]: willBeCompleted,
        };

        set({
          tasksCompleted: updatedTasks,
          lastTasksDate: today,
        });
      },

      getTodayCompleted: () => {
        const today = getTodayDateString();
        const state = get();
        const count = state.dailyHistory[today] ?? 0;
        return Math.min(state.dailyTarget, count);
      },

      getEffectiveStreak: () => {
        const state = get();
        const today = getTodayDateString();
        const yesterday = getYesterdayDateString();

        if (!state.lastActiveDate) return 1;
        if (state.lastActiveDate === today || state.lastActiveDate === yesterday) {
          return Math.max(1, state.currentStreak);
        }
        return 0; // Missed more than 1 day
      },

      getLast7DaysActivity: (locale = 'ru') => {
        const state = get();
        const todayStr = getTodayDateString();
        const days: DayActivity[] = [];

        const dayNamesRu = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const dayNamesUz = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
        const dayNames = locale === 'uz' ? dayNamesUz : dayNamesRu;

        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = getTodayDateString(d);
          const dayName = dayNames[d.getDay()] ?? '';
          const completedAyahs = state.dailyHistory[dateStr] ?? 0;
          const isToday = dateStr === todayStr;
          const hasActivity = completedAyahs > 0;
          const metGoal = completedAyahs >= state.dailyTarget;

          days.push({
            date: dateStr,
            dayName,
            completedAyahs,
            isToday,
            hasActivity,
            metGoal,
          });
        }

        return days;
      },

      resetTodayProgress: () => {
        const today = getTodayDateString();
        set({
          dailyHistory: {
            ...get().dailyHistory,
            [today]: 0,
          },
        });
      },

      resetAllProgress: () => {
        const today = getTodayDateString();
        set({
          dailyTarget: DEFAULT_TARGET,
          dailyHistory: { [today]: 0 },
          currentStreak: 1,
          bestStreak: 1,
          lastActiveDate: today,
          tasksCompleted: {},
          lastTasksDate: today,
        });
      },
    }),
    {
      name: 'hifzhub-user-progress',
      storage: createJSONStorage(() => asyncStorage),
    }
  )
);
