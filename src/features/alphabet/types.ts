/**
 * Multilingual string support. Can be a plain string (backward-compatible)
 * or a language dictionary { ru: "...", uz: "...", en: "..." }.
 */
export type LocalizedString = string | {
  ru?: string;
  uz?: string;
  en?: string;
  [key: string]: string | undefined;
};

// ==========================================
// Runtime (Resolved / Localized) Types
// Everything is a concrete string for direct UI rendering.
// ==========================================

export interface LessonModule {
  moduleId: number;
  moduleTitle: string;
  moduleDescription: string;
  lessonsCount: number;
  icon: string; // Ionicons name
  color: string; // hex color
  totalXP: number;
  version?: number;
  updatedAt?: number;
}

export interface Lesson {
  moduleId: number;
  moduleTitle: string;
  lessonId: string; // e.g. 'm1_l1'
  order: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  xpReward: number;
  isExam?: boolean;
  passingScore?: number;
  steps: LessonStep[];
  masteryGate?: MasteryGate;
  version?: number;
  updatedAt?: number;
  author?: string;
}

export type LessonStep =
  | TheoryStep
  | LetterIntroStep
  | ListenRepeatStep
  | QuizChoiceStep
  | QuizMatchStep
  | FindTheRuleStep
  | ReadingCheckStep;

export type StepType = LessonStep['type'];

export interface TheoryStep {
  id: string;
  type: 'theory';
  title: string;
  content: string;
  mnemonic?: string;
  example?: string;
}

export interface LetterIntroStep {
  id: string;
  type: 'letter_intro';
  arabic: string;
  name: string;
  transliteration: string;
  makhraj: string;
  isHeavy: boolean | null;
  audioFile: string;
  forms: { isolated: string; initial: string; medial: string; final: string };
  note?: string;
  weightRule?: string;
}

export interface ListenRepeatStep {
  id: string;
  type: 'listen_and_repeat';
  instruction: string;
  items: { arabic: string; transliteration: string; audioFile: string }[];
  recordingEnabled?: boolean;
  cameraHintEnabled?: boolean;
}

export interface QuizChoiceStep {
  id: string;
  type: 'quiz_choice';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  audioFile?: string;
}

export interface QuizMatchStep {
  id: string;
  type: 'quiz_match';
  question: string;
  pairs: { left: string; right: string }[];
}

export interface FindTheRuleStep {
  id: string;
  type: 'find_the_rule';
  instruction: string;
  items: string[];
  correctIndices: number[];
  targetRule: string;
  explanation: string;
}

export interface ReadingCheckStep {
  id: string;
  type: 'reading_check';
  instruction: string;
  arabic: string;
  transliteration: string;
  audioFile: string;
  recordingEnabled?: boolean;
  passScore?: number;
  transliterationInitiallyHidden?: boolean;
}

// ==========================================
// Raw / Schema Types (Supports LocalizedString)
// For storage in JSON files, AsyncStorage, CMS / OTA sync.
// ==========================================

export interface RawLessonModule {
  moduleId: number;
  moduleTitle: LocalizedString;
  moduleDescription: LocalizedString;
  lessonsCount: number;
  icon: string;
  color: string;
  totalXP: number;
  version?: number;
  updatedAt?: number;
}

export interface RawTheoryStep {
  id: string;
  type: 'theory';
  title: LocalizedString;
  content: LocalizedString;
  mnemonic?: LocalizedString;
  example?: LocalizedString;
}

export interface RawLetterIntroStep {
  id: string;
  type: 'letter_intro';
  arabic: string;
  name: LocalizedString;
  transliteration: LocalizedString;
  makhraj: LocalizedString;
  isHeavy: boolean | null;
  audioFile: string;
  forms: { isolated: string; initial: string; medial: string; final: string };
  note?: LocalizedString;
  weightRule?: LocalizedString;
}

export interface RawListenRepeatStep {
  id: string;
  type: 'listen_and_repeat';
  instruction: LocalizedString;
  items: { arabic: string; transliteration: LocalizedString; audioFile: string }[];
  recordingEnabled?: boolean;
  cameraHintEnabled?: boolean;
}

export interface RawQuizChoiceStep {
  id: string;
  type: 'quiz_choice';
  question: LocalizedString;
  options: LocalizedString[];
  correctIndex: number;
  explanation: LocalizedString;
  audioFile?: string;
}

export interface RawQuizMatchStep {
  id: string;
  type: 'quiz_match';
  question: LocalizedString;
  pairs: { left: LocalizedString; right: LocalizedString }[];
}

export interface RawFindTheRuleStep {
  id: string;
  type: 'find_the_rule';
  instruction: LocalizedString;
  items: string[];
  correctIndices: number[];
  targetRule: LocalizedString;
  explanation: LocalizedString;
}

export interface RawReadingCheckStep {
  id: string;
  type: 'reading_check';
  instruction: LocalizedString;
  arabic: string;
  transliteration: LocalizedString;
  audioFile: string;
  recordingEnabled?: boolean;
  passScore?: number;
  transliterationInitiallyHidden?: boolean;
}

export type RawLessonStep =
  | RawTheoryStep
  | RawLetterIntroStep
  | RawListenRepeatStep
  | RawQuizChoiceStep
  | RawQuizMatchStep
  | RawFindTheRuleStep
  | RawReadingCheckStep;

export interface RawLesson {
  moduleId: number;
  moduleTitle: LocalizedString;
  lessonId: string;
  order: number;
  title: LocalizedString;
  description: LocalizedString;
  estimatedMinutes: number;
  xpReward: number;
  isExam?: boolean;
  passingScore?: number;
  steps: (RawLessonStep | LessonStep)[];
  masteryGate?: MasteryGate;
  version?: number;
  updatedAt?: number;
  author?: string;
}

export interface MasteryGate {
  minimumScore: number;
  maximumCriticalConfusions?: number;
  criticalPairs?: string[][];
  remediationLessonIds?: string[];
}

export interface LessonProgress {
  lessonId: string;
  moduleId: number;
  completed: boolean;
  score: number;
  xpEarned: number;
  completedAt?: number;
  attempts: number;
}

export interface ModuleProgress {
  moduleId: number;
  completedLessons: number;
  totalLessons: number;
  totalXPEarned: number;
  unlocked: boolean;
}

/**
 * Manifest for remote over-the-air (OTA) content synchronization.
 */
export interface LessonManifest {
  version: string;
  lastUpdated: number;
  modules: Array<{
    moduleId: number;
    version: number;
    lessonCount: number;
    checksum?: string;
    downloadUrl?: string;
  }>;
}

/**
 * Portable bundle format for import / export of modules and lessons.
 */
export interface LessonPackage {
  formatVersion: '1.0';
  exportedAt: number;
  modules: (RawLessonModule | LessonModule)[];
  lessons: (RawLesson | Lesson)[];
}

export interface LessonImportResult {
  success: boolean;
  importedModules: number;
  importedLessons: number;
  errors: string[];
}

export interface LessonSyncResult {
  updated: boolean;
  modulesCount: number;
  lessonsCount: number;
  error?: string;
}
