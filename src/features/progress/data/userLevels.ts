import type { UserLevel } from '../types';

export const USER_LEVELS: UserLevel[] = [
  {
    level: 1,
    titleRu: 'Мубтади (Начинающий)',
    titleUz: 'Boshlovchi',
    titleArabic: 'مبتدئ',
    minXP: 0,
    maxXP: 200,
  },
  {
    level: 2,
    titleRu: 'Мутааллим (Ученик)',
    titleUz: 'O‘rganuvchi',
    titleArabic: 'متعلّم',
    minXP: 200,
    maxXP: 500,
  },
  {
    level: 3,
    titleRu: 'Муджтахид (Усердный)',
    titleUz: 'Mujtahid',
    titleArabic: 'مجتهد',
    minXP: 500,
    maxXP: 1200,
  },
  {
    level: 4,
    titleRu: 'Кари (Чтец)',
    titleUz: 'Qori',
    titleArabic: 'قارئ',
    minXP: 1200,
    maxXP: 2500,
  },
  {
    level: 5,
    titleRu: 'Мураджи (Повторяющий)',
    titleUz: 'Takrorlovchi',
    titleArabic: 'مراجع',
    minXP: 2500,
    maxXP: 5000,
  },
  {
    level: 6,
    titleRu: 'Хафиз в пути',
    titleUz: 'Hofiz yo‘lida',
    titleArabic: 'حافظ في الطريق',
    minXP: 5000,
    maxXP: 10000,
  },
  {
    level: 7,
    titleRu: 'Хафиз (Хранитель Корана)',
    titleUz: 'Hofiz',
    titleArabic: 'حافظ',
    minXP: 10000,
    maxXP: Infinity,
  },
];

export function getUserLevel(totalXP: number): {
  currentLevel: UserLevel;
  nextLevel: UserLevel | null;
  progress: number;
} {
  const safeXP = Math.max(0, totalXP);

  let currentLevel = USER_LEVELS[0];
  for (let i = USER_LEVELS.length - 1; i >= 0; i--) {
    if (safeXP >= USER_LEVELS[i].minXP) {
      currentLevel = USER_LEVELS[i];
      break;
    }
  }

  const nextIndex = USER_LEVELS.findIndex((l) => l.level === currentLevel.level + 1);
  const nextLevel = nextIndex !== -1 ? USER_LEVELS[nextIndex] : null;

  let progress = 1;
  if (nextLevel) {
    const range = nextLevel.minXP - currentLevel.minXP;
    progress = range > 0 ? Math.min(1, Math.max(0, (safeXP - currentLevel.minXP) / range)) : 0;
  }

  return {
    currentLevel,
    nextLevel,
    progress: Number(progress.toFixed(4)),
  };
}

export function getLevelProgress(totalXP: number): {
  currentLevel: UserLevel;
  nextLevel: UserLevel | null;
  progress: number;
  remainingXp: number;
} {
  const { currentLevel, nextLevel, progress } = getUserLevel(totalXP);
  const remainingXp = nextLevel ? Math.max(0, nextLevel.minXP - Math.max(0, totalXP)) : 0;
  return {
    currentLevel,
    nextLevel,
    progress,
    remainingXp,
  };
}
