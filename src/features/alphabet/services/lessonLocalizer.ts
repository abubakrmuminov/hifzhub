import type {
  Lesson,
  LessonModule,
  LessonStep,
  LocalizedString,
  TheoryStep,
  LetterIntroStep,
  ListenRepeatStep,
  QuizChoiceStep,
  QuizMatchStep,
  FindTheRuleStep,
  ReadingCheckStep,
  RawLesson,
  RawLessonModule,
  RawLessonStep,
} from '../types';

/**
 * Resolves a LocalizedString to a plain string for the requested language.
 * Falls back gracefully: requested lang -> 'ru' -> 'uz' -> first non-empty -> ''.
 */
export const resolveLocalizedString = (
  value: LocalizedString | undefined | null,
  lang: string = 'ru'
): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;

  if (typeof value === 'object') {
    const target = value[lang];
    if (typeof target === 'string' && target.trim().length > 0) {
      return target;
    }

    if (typeof value.ru === 'string' && value.ru.trim().length > 0) {
      return value.ru;
    }

    if (typeof value.uz === 'string' && value.uz.trim().length > 0) {
      return value.uz;
    }

    for (const key of Object.keys(value)) {
      const candidate = value[key];
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate;
      }
    }
  }

  return '';
};

/**
 * Localizes a single step's text fields for the current language.
 */
export const localizeStep = (step: RawLessonStep | LessonStep, lang: string = 'ru'): LessonStep => {
  switch (step.type) {
    case 'theory': {
      const s = step as any;
      return {
        ...s,
        title: resolveLocalizedString(s.title, lang),
        content: resolveLocalizedString(s.content, lang),
        mnemonic: s.mnemonic ? resolveLocalizedString(s.mnemonic, lang) : undefined,
        example: s.example ? resolveLocalizedString(s.example, lang) : undefined,
      };
    }

    case 'letter_intro': {
      const s = step as any;
      return {
        ...s,
        name: resolveLocalizedString(s.name, lang),
        transliteration: resolveLocalizedString(s.transliteration, lang),
        makhraj: resolveLocalizedString(s.makhraj, lang),
        note: s.note ? resolveLocalizedString(s.note, lang) : undefined,
        weightRule: s.weightRule ? resolveLocalizedString(s.weightRule, lang) : undefined,
      };
    }

    case 'listen_and_repeat': {
      const s = step as any;
      return {
        ...s,
        instruction: resolveLocalizedString(s.instruction, lang),
        items: s.items.map((it: any) => ({
          ...it,
          transliteration: resolveLocalizedString(it.transliteration, lang),
        })),
      };
    }

    case 'quiz_choice': {
      const s = step as any;
      return {
        ...s,
        question: resolveLocalizedString(s.question, lang),
        options: s.options.map((opt: any) => resolveLocalizedString(opt, lang)),
        explanation: resolveLocalizedString(s.explanation, lang),
      };
    }

    case 'quiz_match': {
      const s = step as any;
      return {
        ...s,
        question: resolveLocalizedString(s.question, lang),
        pairs: s.pairs.map((p: any) => ({
          left: resolveLocalizedString(p.left, lang),
          right: resolveLocalizedString(p.right, lang),
        })),
      };
    }

    case 'find_the_rule': {
      const s = step as any;
      return {
        ...s,
        instruction: resolveLocalizedString(s.instruction, lang),
        targetRule: resolveLocalizedString(s.targetRule, lang),
        explanation: resolveLocalizedString(s.explanation, lang),
      };
    }

    case 'reading_check': {
      const s = step as any;
      return {
        ...s,
        instruction: resolveLocalizedString(s.instruction, lang),
        transliteration: resolveLocalizedString(s.transliteration, lang),
      };
    }

    default:
      return step as LessonStep;
  }
};

/**
 * Creates a lightweight localized clone of a Lesson for timeline / list display,
 * resolving only header metadata and keeping steps intact without deep traversal.
 */
export const localizeLessonSummary = (lesson: RawLesson | Lesson, lang: string = 'ru'): Lesson => {
  return {
    ...lesson,
    moduleTitle: resolveLocalizedString(lesson.moduleTitle, lang),
    title: resolveLocalizedString(lesson.title, lang),
    description: resolveLocalizedString(lesson.description, lang),
    steps: (lesson.steps || []) as LessonStep[],
  };
};

const localizedLessonCache = new Map<string, Lesson>();

/**
 * Creates a localized clone of a Lesson with all text fields resolved for the current language.
 * Uses an in-memory cache to guarantee 0ms instant retrieval on subsequent opens.
 */
export const localizeLesson = (lesson: RawLesson | Lesson, lang: string = 'ru'): Lesson => {
  const cacheKey = `${lesson.lessonId}_${lang}_${(lesson as any).version || 1}`;
  const cached = localizedLessonCache.get(cacheKey);
  if (cached) return cached;

  const localized: Lesson = {
    ...lesson,
    moduleTitle: resolveLocalizedString(lesson.moduleTitle, lang),
    title: resolveLocalizedString(lesson.title, lang),
    description: resolveLocalizedString(lesson.description, lang),
    steps: (lesson.steps || []).map((st) => localizeStep(st, lang)),
  };
  localizedLessonCache.set(cacheKey, localized);
  return localized;
};

const localizedModuleCache = new Map<string, LessonModule>();

/**
 * Creates a localized clone of a LessonModule for display in lists.
 */
export const localizeModule = (module: RawLessonModule | LessonModule, lang: string = 'ru'): LessonModule => {
  const cacheKey = `${module.moduleId}_${lang}_${(module as any).version || 1}`;
  const cached = localizedModuleCache.get(cacheKey);
  if (cached) return cached;

  const localized: LessonModule = {
    ...module,
    moduleTitle: resolveLocalizedString(module.moduleTitle, lang),
    moduleDescription: resolveLocalizedString(module.moduleDescription, lang),
  };
  localizedModuleCache.set(cacheKey, localized);
  return localized;
};
