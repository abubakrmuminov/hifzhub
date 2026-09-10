import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useProgressStore } from './progressStore';
import { appStorage } from '@/shared/storage/mmkvStorage';

export interface LessonResult {
  lessonId: string;
  moduleId: number;
  score: number; // 0-100
  xpEarned: number;
  completedAt: number; // timestamp
  attempts: number;
  passed: boolean;
}

export interface LessonStoreState {
  // State
  completedLessons: Record<string, LessonResult>; // keyed by lessonId
  unlockedModules: number[]; // moduleIds that are unlocked (module 1 always unlocked)
  totalXP: number;
  currentStreak: number; // days in a row
  lastActiveDate: string | null; // ISO date string 'YYYY-MM-DD'

  // Actions
  completeLesson: (result: Omit<LessonResult, 'attempts'>) => void;
  isLessonCompleted: (lessonId: string) => boolean;
  isLessonPassed: (lessonId: string) => boolean;
  getLessonResult: (lessonId: string) => LessonResult | undefined;
  getModuleProgress: (moduleId: number, totalLessons: number) => { completed: number; total: number; percentage: number };
  unlockModule: (moduleId: number) => void;
  isModuleUnlocked: (moduleId: number) => boolean;
  getNextLessonId: (moduleId: number, completedLessonIds: string[]) => string | null;
  updateStreak: () => void;
  addXP: (amount: number) => void;
  resetProgress: () => void;
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialLessonState = {
  completedLessons: {} as Record<string, LessonResult>,
  unlockedModules: [1],
  totalXP: 0,
  currentStreak: 0,
  lastActiveDate: null as string | null,
};

export const useLessonStore = create<LessonStoreState>()(
  persist(
    (set, get) => ({
      ...initialLessonState,

      completeLesson: (result: Omit<LessonResult, 'attempts'>) => {
        const state = get();
        const existing = state.completedLessons[result.lessonId];

        if (!existing) {
          set({
            completedLessons: {
              ...state.completedLessons,
              [result.lessonId]: {
                ...result,
                attempts: 1,
              },
            },
            totalXP: state.totalXP + result.xpEarned,
          });
          try {
            useProgressStore.getState().recordAyahRead(2);
          } catch {}
        } else {
          set({
            completedLessons: {
              ...state.completedLessons,
              [result.lessonId]: {
                ...existing,
                ...result,
                attempts: existing.attempts + 1,
                score: Math.max(existing.score, result.score),
                passed: existing.passed || result.passed,
                xpEarned: existing.xpEarned,
              },
            },
          });
        }
      },

      isLessonCompleted: (lessonId: string) => {
        return Boolean(get().completedLessons[lessonId]);
      },

      isLessonPassed: (lessonId: string) => {
        const lesson = get().completedLessons[lessonId];
        return Boolean(lesson && lesson.passed);
      },

      getLessonResult: (lessonId: string) => {
        return get().completedLessons[lessonId];
      },

      getModuleProgress: (moduleId: number, totalLessons: number) => {
        const completedLessons = get().completedLessons;
        const completed = Object.values(completedLessons).filter(
          (lesson) => lesson.moduleId === moduleId
        ).length;
        const percentage =
          totalLessons > 0 ? Math.min(100, Math.round((completed / totalLessons) * 100)) : 0;
        return { completed, total: totalLessons, percentage };
      },

      unlockModule: (moduleId: number) => {
        const currentUnlocked = get().unlockedModules;
        if (!currentUnlocked.includes(moduleId)) {
          set({ unlockedModules: [...currentUnlocked, moduleId] });
        }
      },

      isModuleUnlocked: (moduleId: number) => {
        return get().unlockedModules.includes(moduleId);
      },

      getNextLessonId: (moduleId: number, completedLessonIds: string[]) => {
        const completedLessons = get().completedLessons;
        const nextLesson = completedLessonIds.find((id) => !completedLessons[id]);
        return nextLesson ?? null;
      },

      updateStreak: () => {
        const { lastActiveDate, currentStreak } = get();
        const today = formatDate(new Date());

        if (lastActiveDate === today) {
          return;
        }

        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = formatDate(yesterdayDate);

        if (lastActiveDate === yesterday) {
          set({
            currentStreak: currentStreak + 1,
            lastActiveDate: today,
          });
        } else {
          set({
            currentStreak: 1,
            lastActiveDate: today,
          });
        }
      },

      addXP: (amount: number) => {
        set((state) => ({ totalXP: state.totalXP + Math.max(0, amount) }));
      },

      resetProgress: () => {
        set(initialLessonState);
      },
    }),
    {
      name: 'hifzhub-lesson-progress',
      storage: createJSONStorage(() => appStorage),
    }
  )
);
