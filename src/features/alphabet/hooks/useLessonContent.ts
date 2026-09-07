import { useEffect, useMemo, useCallback } from 'react';
import { useLessonContentStore } from '@/stores/lessonContentStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { localizeLesson, localizeLessonSummary, localizeModule } from '../services/lessonLocalizer';
import { lessonContentService } from '../services/lessonContentService';
import type {
  Lesson,
  LessonModule,
  RawLesson,
  RawLessonModule,
  LessonImportResult,
  LessonPackage,
} from '../types';

/**
 * Hook to get all available modules, reactively updated and localized for the current language.
 */
export const useLessonModules = () => {
  const modules = useLessonContentStore((s) => s.modules);
  const isInitialized = useLessonContentStore((s) => s.isInitialized);
  const isLoading = useLessonContentStore((s) => s.isLoading);
  const initialize = useLessonContentStore((s) => s.initialize);
  const refresh = useLessonContentStore((s) => s.refresh);
  const language = useSettingsStore((s) => s.language);

  useEffect(() => {
    if (!isInitialized) {
      void initialize();
    }
  }, [isInitialized, initialize]);

  const localizedModules = useMemo(() => {
    return modules.map((m) => localizeModule(m, language));
  }, [modules, language]);

  return {
    modules: localizedModules,
    rawModules: modules,
    isLoading,
    refresh,
  };
};

/**
 * Hook to get detail and lessons for a specific module, localized for the current language.
 * Uses lightweight lesson summaries for timeline rendering to guarantee 0ms screen opening.
 */
export const useModuleDetail = (moduleId: number) => {
  const modules = useLessonContentStore((s) => s.modules);
  const lessonsByModule = useLessonContentStore((s) => s.lessonsByModule);
  const isInitialized = useLessonContentStore((s) => s.isInitialized);
  const isLoading = useLessonContentStore((s) => s.isLoading);
  const initialize = useLessonContentStore((s) => s.initialize);
  const refresh = useLessonContentStore((s) => s.refresh);
  const language = useSettingsStore((s) => s.language);

  useEffect(() => {
    if (!isInitialized) {
      void initialize();
    }
  }, [isInitialized, initialize]);

  const rawModule = useMemo(() => {
    return modules.find((m) => m.moduleId === moduleId) ?? modules[0];
  }, [modules, moduleId]);

  const localizedModule = useMemo(() => {
    return rawModule ? localizeModule(rawModule, language) : undefined;
  }, [rawModule, language]);

  const rawLessons = useMemo(() => {
    const list = lessonsByModule[moduleId];
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
    // Fallback to bundled lessons if store not yet populated
    return lessonContentService.getBundledLessons(moduleId);
  }, [lessonsByModule, moduleId]);

  const localizedLessons = useMemo(() => {
    return rawLessons.map((l) => localizeLessonSummary(l, language));
  }, [rawLessons, language]);

  return {
    module: localizedModule,
    rawModule,
    lessons: localizedLessons,
    rawLessons,
    isLoading,
    refresh,
  };
};

/**
 * Hook to get a single lesson by its ID, localized for the current language.
 */
export const useLessonDetail = (lessonId: string) => {
  const lessonsById = useLessonContentStore((s) => s.lessonsById);
  const isInitialized = useLessonContentStore((s) => s.isInitialized);
  const isLoading = useLessonContentStore((s) => s.isLoading);
  const initialize = useLessonContentStore((s) => s.initialize);
  const language = useSettingsStore((s) => s.language);

  useEffect(() => {
    if (!isInitialized) {
      void initialize();
    }
  }, [isInitialized, initialize]);

  const rawLesson = useMemo(() => {
    if (lessonsById[lessonId]) {
      return lessonsById[lessonId];
    }
    // Fast-path: targeted lookup using module prefix if available, e.g. m1_l1 -> module 1
    const match = lessonId.match(/^m(\d+)_/);
    if (match) {
      const targetModId = Number(match[1]);
      const list = lessonContentService.getBundledLessons(targetModId);
      const found = list.find((l) => l.lessonId === lessonId);
      if (found) return found;
    }
    // Fallback lookup across bundled lessons
    for (const modId of [1, 2, 3, 4, 5]) {
      const bundled = lessonContentService.getBundledLessons(modId);
      const found = bundled.find((l) => l.lessonId === lessonId);
      if (found) return found;
    }
    return undefined;
  }, [lessonsById, lessonId]);

  const localizedLesson = useMemo(() => {
    return rawLesson ? localizeLesson(rawLesson, language) : undefined;
  }, [rawLesson, language]);

  return {
    lesson: localizedLesson,
    rawLesson,
    isLoading,
  };
};

/**
 * Hook for administration, dynamic editing, importing and resetting lessons.
 */
export const useLessonManager = () => {
  const saveLesson = useLessonContentStore((s) => s.saveLesson);
  const saveModule = useLessonContentStore((s) => s.saveModule);
  const deleteLesson = useLessonContentStore((s) => s.deleteLesson);
  const deleteModule = useLessonContentStore((s) => s.deleteModule);
  const importPackage = useLessonContentStore((s) => s.importPackage);
  const resetToDefaults = useLessonContentStore((s) => s.resetToDefaults);
  const refresh = useLessonContentStore((s) => s.refresh);
  const isLoading = useLessonContentStore((s) => s.isLoading);

  const exportPackage = useCallback(async (): Promise<LessonPackage> => {
    return lessonContentService.exportPackage();
  }, []);

  const syncRemoteLessons = useCallback(async (url: string) => {
    const res = await lessonContentService.syncRemoteLessons(url);
    if (res.updated) {
      await refresh();
    }
    return res;
  }, [refresh]);

  return {
    saveLesson,
    saveModule,
    deleteLesson,
    deleteModule,
    importPackage,
    exportPackage,
    resetToDefaults,
    syncRemoteLessons,
    refresh,
    isLoading,
  };
};
