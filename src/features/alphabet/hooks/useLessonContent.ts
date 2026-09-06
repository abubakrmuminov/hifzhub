import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useCallback } from 'react';
import { useLessonContentStore } from '@/stores/lessonContentStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { localizeLesson, localizeModule } from '../services/lessonLocalizer';
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
    return modules.find((m) => m.moduleId === moduleId);
  }, [modules, moduleId]);

  const localizedModule = useMemo(() => {
    return rawModule ? localizeModule(rawModule, language) : undefined;
  }, [rawModule, language]);

  const rawLessons = useMemo(() => {
    const list = lessonsByModule[moduleId];
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
    return [];
  }, [lessonsByModule, moduleId]);

  const localizedLessons = useMemo(() => {
    return rawLessons.map((l) => localizeLesson(l, language));
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
  const isInitialized = useLessonContentStore((s) => s.isInitialized);
  const contentVersion = useLessonContentStore((s) => s.contentVersion);
  const initialize = useLessonContentStore((s) => s.initialize);
  const language = useSettingsStore((s) => s.language);
  useEffect(() => { void initialize(); }, [initialize]);
  const result = useQuery({
    queryKey: ['lesson', lessonId, contentVersion],
    queryFn: async () => {
      const lesson = await lessonContentService.getLessonById(lessonId);
      if (!lesson) throw new Error('Lesson not found');
      return lesson;
    },
    enabled: isInitialized,
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
  const lesson = useMemo(() => result.data ? localizeLesson(result.data, language) : undefined,
    [result.data, language]);
  return { lesson, rawLesson: result.data, isLoading: result.isPending, error: result.error, retry: result.refetch };
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
