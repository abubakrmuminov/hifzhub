import AsyncStorage from '@react-native-async-storage/async-storage';
import { LESSON_MODULES } from '../data/modules';
import type {
  Lesson,
  LessonModule,
  RawLesson,
  RawLessonModule,
  LessonPackage,
  LessonImportResult,
  LessonSyncResult,
} from '../types';
import { validateLesson, validateModule } from './lessonValidator';

export type StoredLesson = RawLesson | Lesson;
export type StoredModule = RawLessonModule | LessonModule;

const STORAGE_KEY = '@hifzhub_custom_lessons_v1';

interface StoredOverrides {
  customModules: StoredModule[];
  customLessons: Record<string, StoredLesson>;
  deletedLessonIds: string[];
  deletedModuleIds: number[];
  contentVersion: number;
}

const DEFAULT_OVERRIDES: StoredOverrides = {
  customModules: [],
  customLessons: {},
  deletedLessonIds: [],
  deletedModuleIds: [],
  contentVersion: 1,
};

// Lazy static loaders for Metro bundler (only requested module is required and parsed on demand)
const BUNDLED_LESSON_LOADERS: Record<number, () => any> = {
  1: () => require('../../../../assets/data/lessons/module1.json'),
  2: () => require('../../../../assets/data/lessons/module2.json'),
  3: () => require('../../../../assets/data/lessons/module3.json'),
  4: () => require('../../../../assets/data/lessons/module4.json'),
  5: () => require('../../../../assets/data/lessons/module5.json'),
};

export class LessonContentService {
  private static instance: LessonContentService;
  private memoryCache: StoredOverrides | null = null;
  private bundledCache = new Map<number, StoredLesson[]>();

  public static getInstance(): LessonContentService {
    if (!LessonContentService.instance) {
      LessonContentService.instance = new LessonContentService();
    }
    return LessonContentService.instance;
  }

  /**
   * Load stored overrides from AsyncStorage into memory cache.
   */
  public async loadOverrides(): Promise<StoredOverrides> {
    if (this.memoryCache) {
      return this.memoryCache;
    }

    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const parsed = JSON.parse(json) as StoredOverrides;
        this.memoryCache = {
          customModules: Array.isArray(parsed.customModules) ? parsed.customModules : [],
          customLessons: parsed.customLessons && typeof parsed.customLessons === 'object' ? parsed.customLessons : {},
          deletedLessonIds: Array.isArray(parsed.deletedLessonIds) ? parsed.deletedLessonIds : [],
          deletedModuleIds: Array.isArray(parsed.deletedModuleIds) ? parsed.deletedModuleIds : [],
          contentVersion: typeof parsed.contentVersion === 'number' ? parsed.contentVersion : 1,
        };
        return this.memoryCache;
      }
    } catch (e) {
      console.warn('[LessonContentService] Failed to load stored overrides:', e);
    }

    this.memoryCache = { ...DEFAULT_OVERRIDES };
    return this.memoryCache;
  }

  /**
   * Persist in-memory overrides to AsyncStorage.
   */
  private async persistOverrides(): Promise<void> {
    if (!this.memoryCache) return;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.memoryCache));
    } catch (e) {
      console.error('[LessonContentService] Failed to persist overrides:', e);
    }
  }

  /**
   * Get all bundled modules from code.
   */
  public getBundledModules(): StoredModule[] {
    return [...LESSON_MODULES];
  }

  /**
   * Get bundled lessons for a given module (lazy, cached, handles both array and { lessons: [] }).
   */
  public getBundledLessons(moduleId: number): StoredLesson[] {
    if (this.bundledCache.has(moduleId)) {
      return this.bundledCache.get(moduleId)!;
    }
    const loader = BUNDLED_LESSON_LOADERS[moduleId];
    if (!loader) return [];
    try {
      const raw = loader();
      let lessons: StoredLesson[] = [];
      if (Array.isArray(raw)) {
        lessons = raw;
      } else if (raw && Array.isArray(raw.lessons)) {
        lessons = raw.lessons;
      }
      // Normalize lesson.moduleId to be a number matching moduleId
      lessons = lessons.map((l) =>
        typeof l.moduleId === 'number' ? l : { ...l, moduleId }
      );
      this.bundledCache.set(moduleId, lessons);
      return lessons;
    } catch (e) {
      console.warn(`[LessonContentService] Failed to load bundled lessons for module ${moduleId}:`, e);
      return [];
    }
  }

  /**
   * Get all effective modules:
   * Merges bundled modules with custom modules, excludes deleted ones, and dynamically counts lessons.
   */
  public async getEffectiveModules(): Promise<StoredModule[]> {
    const overrides = await this.loadOverrides();
    const hasCustomOverrides =
      overrides.customModules.length > 0 ||
      overrides.deletedModuleIds.length > 0 ||
      overrides.deletedLessonIds.length > 0 ||
      Object.keys(overrides.customLessons).length > 0;

    if (!hasCustomOverrides) {
      // 0ms fast-path: bundled module metadata in LESSON_MODULES is already precalculated
      return this.getBundledModules();
    }

    const deletedModuleSet = new Set(overrides.deletedModuleIds);

    // Start with bundled modules that are not deleted
    const moduleMap = new Map<number, StoredModule>();
    for (const mod of this.getBundledModules()) {
      if (!deletedModuleSet.has(mod.moduleId)) {
        moduleMap.set(mod.moduleId, { ...mod });
      }
    }

    // Apply custom / overridden modules
    for (const mod of overrides.customModules) {
      if (!deletedModuleSet.has(mod.moduleId)) {
        moduleMap.set(mod.moduleId, { ...mod });
      }
    }

    const allModules = Array.from(moduleMap.values()).sort((a, b) => a.moduleId - b.moduleId);

    // Compute dynamic lessonsCount and totalXP for overridden modules only
    for (const mod of allModules) {
      const lessons = await this.getEffectiveLessons(mod.moduleId);
      mod.lessonsCount = lessons.length;
      const sumXP = lessons.reduce((sum, l) => sum + (l.xpReward || 0), 0);
      if (sumXP > 0) {
        mod.totalXP = sumXP;
      }
    }

    return allModules;
  }

  /**
   * Get single effective module by id.
   */
  public async getEffectiveModule(moduleId: number): Promise<StoredModule | undefined> {
    const modules = await this.getEffectiveModules();
    return modules.find((m) => m.moduleId === moduleId);
  }

  /**
   * Get all effective lessons for a module (or all modules if omitted):
   * Combines bundled lessons and custom lessons, excluding deleted ones.
   */
  public async getEffectiveLessons(moduleId?: number): Promise<StoredLesson[]> {
    const overrides = await this.loadOverrides();
    const deletedLessonSet = new Set(overrides.deletedLessonIds);

    const lessonMap = new Map<string, StoredLesson>();

    // 1. Load bundled lessons
    if (typeof moduleId === 'number') {
      const bundled = this.getBundledLessons(moduleId);
      for (const l of bundled) {
        if (!deletedLessonSet.has(l.lessonId)) {
          lessonMap.set(l.lessonId, l);
        }
      }
    } else {
      for (const idStr of Object.keys(BUNDLED_LESSON_LOADERS)) {
        const id = Number(idStr);
        const bundled = this.getBundledLessons(id);
        for (const l of bundled) {
          if (!deletedLessonSet.has(l.lessonId)) {
            lessonMap.set(l.lessonId, l);
          }
        }
      }
    }

    // 2. Overlay custom lessons (overriding bundled ones with same lessonId, or adding new ones)
    for (const lesson of Object.values(overrides.customLessons)) {
      if (typeof moduleId === 'number' && lesson.moduleId !== moduleId) {
        continue;
      }
      if (!deletedLessonSet.has(lesson.lessonId)) {
        lessonMap.set(lesson.lessonId, lesson);
      }
    }

    return Array.from(lessonMap.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Get single effective lesson by its lessonId.
   */
  public async getLessonById(lessonId: string): Promise<StoredLesson | undefined> {
    if (!lessonId) return undefined;
    const overrides = await this.loadOverrides();

    // Check if deleted
    if (overrides.deletedLessonIds.includes(lessonId)) {
      return undefined;
    }

    // Check custom lessons first (has priority)
    if (overrides.customLessons[lessonId]) {
      return overrides.customLessons[lessonId];
    }

    // Fast-path: targeted lookup by module prefix if available, e.g. m1_l1 -> module 1
    const match = lessonId.match(/^m(\d+)_/);
    if (match) {
      const targetModId = Number(match[1]);
      const list = this.getBundledLessons(targetModId);
      const found = list.find((l) => l.lessonId === lessonId);
      if (found) return found;
    }

    // Fallback scan across bundled modules
    for (const modIdStr of Object.keys(BUNDLED_LESSON_LOADERS)) {
      const list = this.getBundledLessons(Number(modIdStr));
      const found = list.find((l) => l.lessonId === lessonId);
      if (found) {
        return found;
      }
    }

    return undefined;
  }

  /**
   * Add or update a lesson. Validates schema before saving.
   */
  public async saveLesson(lesson: unknown): Promise<{ success: boolean; errors: string[]; lesson?: StoredLesson }> {
    const validation = validateLesson(lesson);
    if (!validation.valid || !validation.data) {
      return { success: false, errors: validation.errors };
    }

    const validatedLesson = validation.data;
    const overrides = await this.loadOverrides();

    // Remove from deleted list if it was previously marked deleted
    overrides.deletedLessonIds = overrides.deletedLessonIds.filter((id) => id !== validatedLesson.lessonId);
    overrides.customLessons[validatedLesson.lessonId] = {
      ...validatedLesson,
      updatedAt: Date.now(),
      version: (validatedLesson.version || 1) + 1,
    };
    overrides.contentVersion += 1;

    await this.persistOverrides();
    return { success: true, errors: [], lesson: overrides.customLessons[validatedLesson.lessonId] };
  }

  /**
   * Add or update a module. Validates schema before saving.
   */
  public async saveModule(module: unknown): Promise<{ success: boolean; errors: string[]; module?: StoredModule }> {
    const validation = validateModule(module);
    if (!validation.valid || !validation.data) {
      return { success: false, errors: validation.errors };
    }

    const validatedModule = validation.data;
    const overrides = await this.loadOverrides();

    overrides.deletedModuleIds = overrides.deletedModuleIds.filter((id) => id !== validatedModule.moduleId);

    const existingIdx = overrides.customModules.findIndex((m) => m.moduleId === validatedModule.moduleId);
    const updatedMod: StoredModule = {
      ...validatedModule,
      updatedAt: Date.now(),
      version: (validatedModule.version || 1) + 1,
    };

    if (existingIdx >= 0) {
      overrides.customModules[existingIdx] = updatedMod;
    } else {
      overrides.customModules.push(updatedMod);
    }
    overrides.contentVersion += 1;

    await this.persistOverrides();
    return { success: true, errors: [], module: updatedMod };
  }

  /**
   * Delete a lesson by lessonId.
   */
  public async deleteLesson(lessonId: string): Promise<boolean> {
    if (!lessonId) return false;
    const overrides = await this.loadOverrides();

    delete overrides.customLessons[lessonId];
    if (!overrides.deletedLessonIds.includes(lessonId)) {
      overrides.deletedLessonIds.push(lessonId);
    }
    overrides.contentVersion += 1;

    await this.persistOverrides();
    return true;
  }

  /**
   * Delete a module by moduleId.
   */
  public async deleteModule(moduleId: number): Promise<boolean> {
    const overrides = await this.loadOverrides();

    overrides.customModules = overrides.customModules.filter((m) => m.moduleId !== moduleId);
    if (!overrides.deletedModuleIds.includes(moduleId)) {
      overrides.deletedModuleIds.push(moduleId);
    }

    // Also delete all custom lessons for this module
    for (const [id, lesson] of Object.entries(overrides.customLessons)) {
      if (lesson.moduleId === moduleId) {
        delete overrides.customLessons[id];
        if (!overrides.deletedLessonIds.includes(id)) {
          overrides.deletedLessonIds.push(id);
        }
      }
    }

    overrides.contentVersion += 1;
    await this.persistOverrides();
    return true;
  }

  /**
   * Reset all custom lessons and overrides back to default bundled content.
   */
  public async resetToDefaults(): Promise<void> {
    this.memoryCache = { ...DEFAULT_OVERRIDES, contentVersion: Date.now() };
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Export all effective content (modules + lessons) as a portable LessonPackage JSON string.
   */
  public async exportPackage(): Promise<LessonPackage> {
    const modules = await this.getEffectiveModules();
    const lessons = await this.getEffectiveLessons();

    return {
      formatVersion: '1.0',
      exportedAt: Date.now(),
      modules,
      lessons,
    };
  }

  /**
   * Import lessons and modules from JSON string or object.
   */
  public async importPackage(raw: string | object): Promise<LessonImportResult> {
    const errors: string[] = [];
    let parsed: any;

    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch (e: any) {
        return {
          success: false,
          importedModules: 0,
          importedLessons: 0,
          errors: [`JSON syntax error: ${e.message}`],
        };
      }
    } else {
      parsed = raw;
    }

    if (!parsed || typeof parsed !== 'object') {
      return { success: false, importedModules: 0, importedLessons: 0, errors: ['Invalid package data'] };
    }

    let modulesToImport: any[] = [];
    let lessonsToImport: any[] = [];

    // Case 1: Standard LessonPackage
    if (parsed.formatVersion && Array.isArray(parsed.lessons)) {
      modulesToImport = Array.isArray(parsed.modules) ? parsed.modules : [];
      lessonsToImport = parsed.lessons;
    }
    // Case 2: Array of lessons
    else if (Array.isArray(parsed)) {
      lessonsToImport = parsed;
    }
    // Case 3: Single lesson
    else if (parsed.lessonId && Array.isArray(parsed.steps)) {
      lessonsToImport = [parsed];
    }
    // Case 4: Single module
    else if (parsed.moduleId && parsed.moduleTitle) {
      modulesToImport = [parsed];
    }

    let importedModules = 0;
    let importedLessons = 0;

    // Validate and save modules
    for (const mod of modulesToImport) {
      const res = await this.saveModule(mod);
      if (res.success) {
        importedModules++;
      } else {
        errors.push(...res.errors);
      }
    }

    // Validate and save lessons
    for (const les of lessonsToImport) {
      const res = await this.saveLesson(les);
      if (res.success) {
        importedLessons++;
      } else {
        errors.push(...res.errors);
      }
    }

    return {
      success: errors.length === 0 || importedLessons > 0 || importedModules > 0,
      importedModules,
      importedLessons,
      errors,
    };
  }

  /**
   * Sync with remote CMS / OTA endpoint.
   * Can be configured with a remote URL that serves a LessonPackage or update diff.
   */
  public async syncRemoteLessons(manifestUrl: string): Promise<LessonSyncResult> {
    try {
      const response = await fetch(manifestUrl, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        return {
          updated: false,
          modulesCount: 0,
          lessonsCount: 0,
          error: `HTTP Error: ${response.status} ${response.statusText}`,
        };
      }

      const remotePackage = await response.json();
      const importResult = await this.importPackage(remotePackage);

      return {
        updated: importResult.success,
        modulesCount: importResult.importedModules,
        lessonsCount: importResult.importedLessons,
        error: importResult.errors.length > 0 ? importResult.errors.join('; ') : undefined,
      };
    } catch (e: any) {
      return {
        updated: false,
        modulesCount: 0,
        lessonsCount: 0,
        error: `Sync error: ${e.message}`,
      };
    }
  }
}

export const lessonContentService = LessonContentService.getInstance();
