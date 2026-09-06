import type {
  Lesson,
  LessonModule,
  LessonStep,
  StepType,
  RawLesson,
  RawLessonModule,
  RawLessonStep,
} from '../types';

export const VALID_STEP_TYPES: readonly StepType[] = [
  'theory',
  'letter_intro',
  'listen_and_repeat',
  'quiz_choice',
  'quiz_match',
  'find_the_rule',
  'reading_check',
] as const;

export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  data?: T;
}

/**
 * Check if a value is non-empty string or localized object with non-empty strings.
 */
export const isValidStringOrLocalized = (val: unknown): boolean => {
  if (typeof val === 'string') {
    return val.trim().length > 0;
  }
  if (val && typeof val === 'object') {
    const keys = Object.keys(val);
    if (keys.length === 0) return false;
    return keys.some((k) => typeof (val as Record<string, unknown>)[k] === 'string' && ((val as Record<string, unknown>)[k] as string).trim().length > 0);
  }
  return false;
};

/**
 * Validate a single lesson step.
 */
export const validateStep = (raw: unknown, index: number = 0): { valid: boolean; error?: string } => {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: `Step at index ${index} must be an object` };
  }

  const step = raw as Record<string, unknown>;

  if (!step.id || typeof step.id !== 'string') {
    return { valid: false, error: `Step at index ${index} is missing a valid 'id'` };
  }

  if (!step.type || typeof step.type !== 'string' || !VALID_STEP_TYPES.includes(step.type as StepType)) {
    return {
      valid: false,
      error: `Step '${step.id}' has invalid type: '${step.type}'. Expected one of: ${VALID_STEP_TYPES.join(', ')}`,
    };
  }

  switch (step.type as StepType) {
    case 'theory': {
      if (!isValidStringOrLocalized(step.title)) {
        return { valid: false, error: `Theory step '${step.id}' is missing a valid 'title'` };
      }
      if (!isValidStringOrLocalized(step.content)) {
        return { valid: false, error: `Theory step '${step.id}' is missing a valid 'content'` };
      }
      return { valid: true };
    }

    case 'letter_intro': {
      if (!step.arabic || typeof step.arabic !== 'string') {
        return { valid: false, error: `Letter intro step '${step.id}' is missing 'arabic' string` };
      }
      if (!isValidStringOrLocalized(step.name)) {
        return { valid: false, error: `Letter intro step '${step.id}' is missing 'name'` };
      }
      if (!step.forms || typeof step.forms !== 'object') {
        return { valid: false, error: `Letter intro step '${step.id}' is missing 'forms' object` };
      }
      const forms = step.forms as Record<string, unknown>;
      if (!forms.isolated || !forms.initial || !forms.medial || !forms.final) {
        return { valid: false, error: `Letter intro step '${step.id}' must include isolated, initial, medial, final forms` };
      }
      return { valid: true };
    }

    case 'listen_and_repeat': {
      if (!isValidStringOrLocalized(step.instruction)) {
        return { valid: false, error: `Listen & repeat step '${step.id}' is missing 'instruction'` };
      }
      if (!Array.isArray(step.items) || step.items.length === 0) {
        return { valid: false, error: `Listen & repeat step '${step.id}' must have at least one item in 'items'` };
      }
      for (let i = 0; i < step.items.length; i++) {
        const item = step.items[i];
        if (!item || typeof item !== 'object' || !item.arabic || !isValidStringOrLocalized(item.transliteration)) {
          return { valid: false, error: `Listen & repeat step '${step.id}' item at index ${i} is missing arabic or transliteration` };
        }
      }
      return { valid: true };
    }

    case 'quiz_choice': {
      if (!isValidStringOrLocalized(step.question)) {
        return { valid: false, error: `Quiz choice step '${step.id}' is missing 'question'` };
      }
      if (!Array.isArray(step.options) || step.options.length < 2) {
        return { valid: false, error: `Quiz choice step '${step.id}' must have at least 2 options` };
      }
      if (typeof step.correctIndex !== 'number' || step.correctIndex < 0 || step.correctIndex >= step.options.length) {
        return { valid: false, error: `Quiz choice step '${step.id}' correctIndex must be within options range` };
      }
      return { valid: true };
    }

    case 'quiz_match': {
      if (!isValidStringOrLocalized(step.question)) {
        return { valid: false, error: `Quiz match step '${step.id}' is missing 'question'` };
      }
      if (!Array.isArray(step.pairs) || step.pairs.length < 2) {
        return { valid: false, error: `Quiz match step '${step.id}' must have at least 2 pairs` };
      }
      for (let i = 0; i < step.pairs.length; i++) {
        const p = step.pairs[i];
        if (!p || typeof p !== 'object' || !isValidStringOrLocalized(p.left) || !isValidStringOrLocalized(p.right)) {
          return { valid: false, error: `Quiz match step '${step.id}' pair at index ${i} must have 'left' and 'right'` };
        }
      }
      return { valid: true };
    }

    case 'find_the_rule': {
      if (!isValidStringOrLocalized(step.instruction)) {
        return { valid: false, error: `Find the rule step '${step.id}' is missing 'instruction'` };
      }
      if (!Array.isArray(step.items) || step.items.length === 0) {
        return { valid: false, error: `Find the rule step '${step.id}' must have 'items'` };
      }
      if (!Array.isArray(step.correctIndices) || step.correctIndices.length === 0) {
        return { valid: false, error: `Find the rule step '${step.id}' must have 'correctIndices'` };
      }
      return { valid: true };
    }

    case 'reading_check': {
      if (!isValidStringOrLocalized(step.instruction)) {
        return { valid: false, error: `Reading check step '${step.id}' is missing 'instruction'` };
      }
      if (!step.arabic || typeof step.arabic !== 'string') {
        return { valid: false, error: `Reading check step '${step.id}' is missing 'arabic'` };
      }
      if (!isValidStringOrLocalized(step.transliteration)) {
        return { valid: false, error: `Reading check step '${step.id}' is missing 'transliteration'` };
      }
      return { valid: true };
    }

    default:
      return { valid: true };
  }
};

/**
 * Validate a complete lesson object.
 */
export const validateLesson = (raw: unknown): ValidationResult<RawLesson> => {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Lesson must be a non-null object'] };
  }

  const lesson = raw as Record<string, unknown>;

  if (!lesson.lessonId || typeof lesson.lessonId !== 'string' || lesson.lessonId.trim().length === 0) {
    errors.push('Lesson is missing a valid non-empty string for \'lessonId\'');
  }

  if (typeof lesson.moduleId !== 'number' || isNaN(lesson.moduleId)) {
    errors.push('Lesson is missing a valid numeric \'moduleId\'');
  }

  if (!isValidStringOrLocalized(lesson.title)) {
    errors.push('Lesson is missing a valid \'title\'');
  }

  if (typeof lesson.order !== 'number' || lesson.order < 1) {
    errors.push('Lesson \'order\' must be a positive integer');
  }

  if (!Array.isArray(lesson.steps) || lesson.steps.length === 0) {
    errors.push('Lesson must contain a non-empty array of \'steps\'');
  } else {
    const stepIds = new Set<string>();
    lesson.steps.forEach((step, idx) => {
      const stepValidation = validateStep(step, idx);
      if (!stepValidation.valid && stepValidation.error) {
        errors.push(stepValidation.error);
      }
      if (step && typeof step === 'object' && typeof (step as any).id === 'string') {
        const id = (step as any).id;
        if (stepIds.has(id)) {
          errors.push(`Duplicate step id '${id}' in lesson '${lesson.lessonId}'`);
        }
        stepIds.add(id);
      }
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const sanitizedLesson: RawLesson = {
    moduleId: Number(lesson.moduleId),
    moduleTitle: lesson.moduleTitle ? (lesson.moduleTitle as any) : `Модуль ${lesson.moduleId}`,
    lessonId: String(lesson.lessonId).trim(),
    order: Number(lesson.order),
    title: lesson.title as any,
    description: (lesson.description as any) || '',
    estimatedMinutes: typeof lesson.estimatedMinutes === 'number' ? lesson.estimatedMinutes : 5,
    xpReward: typeof lesson.xpReward === 'number' ? lesson.xpReward : 20,
    isExam: Boolean(lesson.isExam),
    passingScore: typeof lesson.passingScore === 'number' ? lesson.passingScore : 70,
    steps: lesson.steps as any[],
    masteryGate: lesson.masteryGate as any,
    version: typeof lesson.version === 'number' ? lesson.version : 1,
    updatedAt: typeof lesson.updatedAt === 'number' ? lesson.updatedAt : Date.now(),
    author: typeof lesson.author === 'string' ? lesson.author : undefined,
  };

  return { valid: true, errors: [], data: sanitizedLesson };
};

/**
 * Validate module metadata.
 */
export const validateModule = (raw: unknown): ValidationResult<RawLessonModule> => {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Module must be a non-null object'] };
  }

  const mod = raw as Record<string, unknown>;

  if (typeof mod.moduleId !== 'number' || isNaN(mod.moduleId) || mod.moduleId < 1) {
    errors.push('Module \'moduleId\' must be a positive number');
  }

  if (!isValidStringOrLocalized(mod.moduleTitle)) {
    errors.push('Module is missing a valid \'moduleTitle\'');
  }

  if (!isValidStringOrLocalized(mod.moduleDescription)) {
    errors.push('Module is missing a valid \'moduleDescription\'');
  }

  if (typeof mod.lessonsCount !== 'number' || mod.lessonsCount < 0) {
    errors.push('Module \'lessonsCount\' must be a non-negative number');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const sanitizedModule: RawLessonModule = {
    moduleId: Number(mod.moduleId),
    moduleTitle: mod.moduleTitle as any,
    moduleDescription: mod.moduleDescription as any,
    lessonsCount: Number(mod.lessonsCount),
    icon: typeof mod.icon === 'string' ? mod.icon : 'book-outline',
    color: typeof mod.color === 'string' ? mod.color : '#0D6B4E',
    totalXP: typeof mod.totalXP === 'number' ? mod.totalXP : 100,
    version: typeof mod.version === 'number' ? mod.version : 1,
    updatedAt: typeof mod.updatedAt === 'number' ? mod.updatedAt : Date.now(),
  };

  return { valid: true, errors: [], data: sanitizedModule };
};
