import { create } from 'zustand';
import { lessonContentService } from '../features/alphabet/services/lessonContentService';
import type {
  Lesson,
  LessonModule,
  RawLesson,
  RawLessonModule,
  LessonImportResult,
} from '../features/alphabet/types';

export type StoredLesson = RawLesson | Lesson;
export type StoredModule = RawLessonModule | LessonModule;

export interface LessonContentState {
  // State
  modules: StoredModule[];
  lessonsByModule: Record<number, StoredLesson[]>;
  lessonsById: Record<string, StoredLesson>;
  isInitialized: boolean;
  isLoading: boolean;
  contentVersion: number;

  // Actions
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  saveLesson: (lesson: unknown) => Promise<{ success: boolean; errors: string[]; lesson?: StoredLesson }>;
  saveModule: (module: unknown) => Promise<{ success: boolean; errors: string[]; module?: StoredModule }>;
  deleteLesson: (lessonId: string) => Promise<boolean>;
  deleteModule: (moduleId: number) => Promise<boolean>;
  importPackage: (raw: string | object) => Promise<LessonImportResult>;
  resetToDefaults: () => Promise<void>;
}

export const useLessonContentStore = create<LessonContentState>((set, get) => ({
  modules: lessonContentService.getBundledModules(),
  lessonsByModule: {},
  lessonsById: {},
  isInitialized: false,
  isLoading: false,
  contentVersion: 1,

  initialize: async () => {
    if (get().isInitialized) return;
    await get().refresh();
  },

  refresh: async () => {
    set({ isLoading: true });
    try {
      const modules = await lessonContentService.getEffectiveModules();
      const allLessons = await lessonContentService.getEffectiveLessons();

      const lessonsByModule: Record<number, StoredLesson[]> = {};
      const lessonsById: Record<string, StoredLesson> = {};

      for (const mod of modules) {
        lessonsByModule[mod.moduleId] = [];
      }

      for (const lesson of allLessons) {
        lessonsById[lesson.lessonId] = lesson;
        if (!lessonsByModule[lesson.moduleId]) {
          lessonsByModule[lesson.moduleId] = [];
        }
        lessonsByModule[lesson.moduleId].push(lesson);
      }

      // Sort lessons in each module by order
      for (const modId of Object.keys(lessonsByModule)) {
        lessonsByModule[Number(modId)].sort((a, b) => a.order - b.order);
      }

      set({
        modules,
        lessonsByModule,
        lessonsById,
        isInitialized: true,
        isLoading: false,
        contentVersion: get().contentVersion + 1,
      });
    } catch (e) {
      console.error('[useLessonContentStore] refresh failed:', e);
      set({ isLoading: false });
    }
  },

  saveLesson: async (lesson: unknown) => {
    const res = await lessonContentService.saveLesson(lesson);
    if (res.success) {
      await get().refresh();
    }
    return res;
  },

  saveModule: async (module: unknown) => {
    const res = await lessonContentService.saveModule(module);
    if (res.success) {
      await get().refresh();
    }
    return res;
  },

  deleteLesson: async (lessonId: string) => {
    const success = await lessonContentService.deleteLesson(lessonId);
    if (success) {
      await get().refresh();
    }
    return success;
  },

  deleteModule: async (moduleId: number) => {
    const success = await lessonContentService.deleteModule(moduleId);
    if (success) {
      await get().refresh();
    }
    return success;
  },

  importPackage: async (raw: string | object) => {
    const res = await lessonContentService.importPackage(raw);
    if (res.success) {
      await get().refresh();
    }
    return res;
  },

  resetToDefaults: async () => {
    await lessonContentService.resetToDefaults();
    await get().refresh();
  },
}));
