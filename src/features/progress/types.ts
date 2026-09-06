export interface UserLevel {
  level: number;
  titleRu: string;
  titleUz: string;
  titleArabic: string;
  minXP: number;
  maxXP: number;
}

export type AchievementCategory = 'streak' | 'memorization' | 'lessons' | 'special';

export type AchievementConditionType =
  | 'streak'
  | 'ayahs_count'
  | 'surah_completed'
  | 'juz_completed'
  | 'lessons_count'
  | 'xp_total'
  | 'special';

export interface AchievementCondition {
  type: AchievementConditionType;
  target: number;
  targetId?: number;
}

export interface Achievement {
  id: string;
  titleRu: string;
  titleUz: string;
  descriptionRu: string;
  descriptionUz: string;
  category: AchievementCategory;
  icon: string; // Ionicons name or emoji
  color: string;
  condition: AchievementCondition;
  unlockedAt?: number;
  progress: number; // 0 to 1
  isUnlocked: boolean;
}

export type AchievementConfig = Omit<Achievement, 'isUnlocked' | 'progress' | 'unlockedAt'>;

export interface JuzSurahInfo {
  id: number;
  nameRu: string;
  nameUz?: string;
  nameArabic: string;
  startAyah: number;
  endAyah: number;
  totalAyahs: number;
  ayahCount: number;
}

export type JuzStatus = 'not_started' | 'in_progress' | 'completed';
export type JuzFilter = 'all' | 'in_progress' | 'completed';

export interface JuzInfo {
  id: number; // 1-30
  nameArabic: string;
  nameRu: string;
  nameUz: string;
  startSurahId: number;
  startAyah: number;
  endSurahId: number;
  endAyah: number;
  totalAyahs: number;
  juzNumber: number;
  nameTransliteration: string;
  surahs: JuzSurahInfo[];
}

export type JuzProgress = JuzInfo & {
  memorizedAyahs: number;
  percentage: number;
  isCompleted: boolean;
  status?: JuzStatus;
  totalVerses?: number;
  memorizedVerses?: number;
};

export interface ProgressOverview {
  totalAyahsMemorized: number;
  quranPercentage: number;
  currentStreak: number;
  bestStreak: number;
  totalXP: number;
  currentLevel: UserLevel;
  nextLevelXP: number;
  levelProgress: number; // 0 to 1
  sabaqCount: number;
  sabqiCount: number;
  manzilCount: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
  isToday: boolean;
}

export interface MemorizationStats {
  totalVerses: number;
  memorizedVerses: number;
  percentage: number;
  sabaqCount: number;
  sabqiCount: number;
  manzilCount: number;
}

export type AchievementFilter = 'all' | 'memorization' | 'streak' | 'lessons' | 'Все' | 'Заучивание' | 'Стрик' | 'Уроки';

export interface AchievementsSectionProps {
  achievements?: Achievement[];
  onSelectAchievement?: (achievement: Achievement) => void;
}

export interface LessonProgressCardProps {
  onContinueLearning?: () => void;
}

export interface LessonModuleProgressItem {
  moduleId: number;
  moduleTitle: string;
  moduleDescription: string;
  lessonsCount: number;
  completedLessons: number;
  icon: string;
  color: string;
  totalXP: number;
  percentage: number;
  isUnlocked: boolean;
}

