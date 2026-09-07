import { SURAHS_DATA } from '@/features/quran/data/surahsData';

export type QuestPillar = 'learning' | 'hifz' | 'reading';

export interface DailyQuest {
  id: string;
  pillar: QuestPillar;
  titleRu: string;
  titleUz: string;
  descriptionRu: string;
  descriptionUz: string;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  xpReward: number;
  icon: string;
  color: string;
  badgeRu: string;
  badgeUz: string;
  route?: string;
}

export interface UserProgressProfile {
  userSeed: string;
  todayDateKey: string;
  completedLessonsCount: number;
  activeModuleId: number;
  memorizedAyahsCount: number;
  dueCardsCount: number;
  currentStreak: number;
  dailyTargetAyahs: number;

  // Real today activity metrics
  ayahsReadToday: number;
  cardsReviewedToday: number;
  cardsAddedToday: number;
  completedLessonsToday: number;
  perfectQuizzesToday: number;
  bookmarksAddedToday: number;
  readDailyAyahToday: boolean;
  listenedAudioToday: boolean;
  usedRepeatToday: boolean;
  usedRangeLoopToday: boolean;
}

/**
 * 32-bit MurmurHash3 algorithm for high-entropy deterministic hashing
 */
export function murmurHash3(key: string, seed: number = 0): number {
  let h1 = seed;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;

  for (let i = 0; i < key.length; i++) {
    let k1 = key.charCodeAt(i);
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = Math.imul(h1, 5) + 0xe6546b64;
  }

  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}

/**
 * Fast 32-bit Mulberry32 PRNG returning uniform float in [0, 1)
 */
export function createMulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Creates a deterministic random number generator for a user on a given day
 */
export function getDailyRNG(userSeed: string, dateKey: string): () => number {
  const combinedKey = `${userSeed}:${dateKey}`;
  const hash = murmurHash3(combinedKey, 0x9747b28c);
  return createMulberry32(hash);
}

interface QuestTemplate {
  templateId: string;
  pillar: QuestPillar;
  titleRu: (ctx: UserProgressProfile) => string;
  titleUz: (ctx: UserProgressProfile) => string;
  descriptionRu: (ctx: UserProgressProfile) => string;
  descriptionUz: (ctx: UserProgressProfile) => string;
  target: (ctx: UserProgressProfile, rng: () => number) => number;
  getCurrent: (ctx: UserProgressProfile) => number;
  xpReward: number;
  icon: string;
  color: string;
  badgeRu: string;
  badgeUz: string;
  route: string;
  eligibility: (ctx: UserProgressProfile) => boolean;
}

const QUEST_TEMPLATES: QuestTemplate[] = [
  // ===================== PILLAR 1: LEARNING & TAJWEED =====================
  {
    templateId: 'learn_lesson_beginner',
    pillar: 'learning',
    titleRu: (ctx) =>
      ctx.completedLessonsCount === 0
        ? 'Пройти 1-й урок алфавита'
        : 'Пройти следующий открытый урок',
    titleUz: (ctx) =>
      ctx.completedLessonsCount === 0
        ? 'Alifbodan 1-darsni o‘rganish'
        : 'Keyingi ochiq darsni o‘rganish',
    descriptionRu: () => 'Изучи буквы, махраджи и звуки арабского языка',
    descriptionUz: () => 'Arab harflari, maxrajlar va tovushlarni o‘rganing',
    target: () => 1,
    getCurrent: (ctx) => ctx.completedLessonsToday,
    xpReward: 25,
    icon: 'book-open',
    color: '#0D6B4E',
    badgeRu: 'Обучение',
    badgeUz: 'Ta’lim',
    route: '/(tabs)/learn',
    eligibility: (ctx) => ctx.completedLessonsCount < 6,
  },
  {
    templateId: 'learn_practice_makhraj',
    pillar: 'learning',
    titleRu: () => 'Тренировка произношения (Махрадж)',
    titleUz: () => 'Talaffuz mashqi (Maxraj)',
    descriptionRu: () => 'Пройди практические карточки в разделе обучения',
    descriptionUz: () => 'O‘rganish bo‘limidagi amaliy darslarni bajaring',
    target: () => 1,
    getCurrent: (ctx) => ctx.completedLessonsToday,
    xpReward: 20,
    icon: 'mic',
    color: '#0D6B4E',
    badgeRu: 'Махрадж',
    badgeUz: 'Maxraj',
    route: '/(tabs)/learn',
    eligibility: () => true,
  },
  {
    templateId: 'learn_two_lessons',
    pillar: 'learning',
    titleRu: () => 'Пройти 2 урока подряд',
    titleUz: () => 'Ketma-ket 2 ta darsni yakunlash',
    descriptionRu: () => 'Укрепи знания и сделай шаг к беглому чтению',
    descriptionUz: () => 'Bilimlarni mustahkamlab, ravon o‘qish sari qadam tashlang',
    target: () => 2,
    getCurrent: (ctx) => ctx.completedLessonsToday,
    xpReward: 40,
    icon: 'award',
    color: '#0D6B4E',
    badgeRu: 'Интенсив',
    badgeUz: 'Intensiv',
    route: '/(tabs)/learn',
    eligibility: (ctx) => ctx.completedLessonsCount >= 3,
  },
  {
    templateId: 'learn_quiz_perfect',
    pillar: 'learning',
    titleRu: () => 'Тест на 100% результат',
    titleUz: () => '100% natija bilan test topshirish',
    descriptionRu: () => 'Ответь на все вопросы квиза без единой ошибки',
    descriptionUz: () => 'Viktorinadagi barcha savollarga xatosiz javob bering',
    target: () => 1,
    getCurrent: (ctx) => ctx.perfectQuizzesToday,
    xpReward: 30,
    icon: 'check-circle',
    color: '#0D6B4E',
    badgeRu: 'Тестирование',
    badgeUz: 'Sinov',
    route: '/(tabs)/learn',
    eligibility: (ctx) => ctx.completedLessonsCount >= 2,
  },

  // ===================== PILLAR 2: MEMORIZATION & HIFZ =====================
  {
    templateId: 'hifz_review_due',
    pillar: 'hifz',
    titleRu: (ctx) => `Повторить ${Math.min(10, Math.max(3, ctx.dueCardsCount))} карточек Хифза`,
    titleUz: (ctx) => `${Math.min(10, Math.max(3, ctx.dueCardsCount))} ta Hifz kartasini takrorlash`,
    descriptionRu: () => 'Интервальное повторение FSRS для прочной памяти',
    descriptionUz: () => 'Mustahkam xotira uchun FSRS oraliq takrorlash tizimi',
    target: (ctx) => Math.min(10, Math.max(3, ctx.dueCardsCount)),
    getCurrent: (ctx) => ctx.cardsReviewedToday,
    xpReward: 35,
    icon: 'refresh-cw',
    color: '#D4A745',
    badgeRu: 'Хифз',
    badgeUz: 'Hifz',
    route: '/(tabs)/memorize',
    eligibility: (ctx) => ctx.dueCardsCount > 0,
  },
  {
    templateId: 'hifz_add_new_ayah',
    pillar: 'hifz',
    titleRu: () => 'Добавить 1 аят в заучивание',
    titleUz: () => 'Yodlash uchun 1 ta yangi oyat qo‘shish',
    descriptionRu: () => 'Выбери аят в Коране и добавь его в карточки Хифза',
    descriptionUz: () => 'Qur’ondan oyat tanlab, uni Hifz kartalariga qo‘shing',
    target: () => 1,
    getCurrent: (ctx) => ctx.cardsAddedToday,
    xpReward: 25,
    icon: 'plus-circle',
    color: '#D4A745',
    badgeRu: 'Новый аят',
    badgeUz: 'Yangi oyat',
    route: '/(tabs)/memorize',
    eligibility: () => true,
  },
  {
    templateId: 'hifz_repeat_mode_listen',
    pillar: 'hifz',
    titleRu: () => 'Прослушать аят в режиме повтора (3x)',
    titleUz: () => 'Oyatni 3x takrorlash rejimida tinglash',
    descriptionRu: () => 'Включи циклический повтор аята в аудиоплеере',
    descriptionUz: () => 'Audioda oyatni ketma-ket 3 marta takrorlab tinglang',
    target: () => 1,
    getCurrent: (ctx) => (ctx.usedRepeatToday ? 1 : 0),
    xpReward: 20,
    icon: 'repeat',
    color: '#D4A745',
    badgeRu: 'Аудио Хифз',
    badgeUz: 'Audio Hifz',
    route: '/(tabs)/quran',
    eligibility: () => true,
  },
  {
    templateId: 'hifz_range_loop_session',
    pillar: 'hifz',
    titleRu: () => 'Запустить повтор диапазона (A-B)',
    titleUz: () => 'Oyatlar oralig‘ini takrorlash (A-B)',
    descriptionRu: () => 'Используй заучивание отрезка аятов в плеере',
    descriptionUz: () => 'Pleyerda oyatlar oralig‘ini belgilab takrorlang',
    target: () => 1,
    getCurrent: (ctx) => (ctx.usedRangeLoopToday ? 1 : 0),
    xpReward: 30,
    icon: 'shuffle',
    color: '#D4A745',
    badgeRu: 'Диапазон',
    badgeUz: 'Oraliq',
    route: '/(tabs)/quran',
    eligibility: (ctx) => ctx.completedLessonsCount >= 5 || ctx.memorizedAyahsCount > 0,
  },

  // ===================== PILLAR 3: READING & SPIRITUAL REFLECTION =====================
  {
    templateId: 'read_daily_quota',
    pillar: 'reading',
    titleRu: (ctx) => `Прочитать ${Math.max(5, ctx.dailyTargetAyahs)} аятов в Коране`,
    titleUz: (ctx) => `Qur’ondan ${Math.max(5, ctx.dailyTargetAyahs)} ta oyat o‘qish`,
    descriptionRu: () => 'Ежедневная норма чтения приближает к Аллаху',
    descriptionUz: () => 'Har kungi tilovat ko‘ngilga nur va fayz bag‘ishlaydi',
    target: (ctx) => Math.max(5, ctx.dailyTargetAyahs),
    getCurrent: (ctx) => ctx.ayahsReadToday,
    xpReward: 30,
    icon: 'book',
    color: '#8B5CF6',
    badgeRu: 'Чтение',
    badgeUz: 'Qiroat',
    route: '/(tabs)/quran',
    eligibility: () => true,
  },
  {
    templateId: 'read_daily_ayah_reflect',
    pillar: 'reading',
    titleRu: () => 'Прочитать Аят дня с переводом',
    titleUz: () => 'Kun oyatini ma’nosi bilan o‘qish',
    descriptionRu: () => 'Вдумчиво осмысли сегодняшний вдохновляющий аят',
    descriptionUz: () => 'Bugungi kun oyatini tafakkur bilan o‘qib chiqing',
    target: () => 1,
    getCurrent: (ctx) => (ctx.readDailyAyahToday ? 1 : 0),
    xpReward: 20,
    icon: 'compass',
    color: '#8B5CF6',
    badgeRu: 'Размышление',
    badgeUz: 'Tafakkur',
    route: '/(tabs)',
    eligibility: () => true,
  },
  {
    templateId: 'read_listen_surah',
    pillar: 'reading',
    titleRu: (ctx) => {
      const sampleSurahs = ['Аль-Мульк', 'Ясин', 'Ар-Рахман', 'Аль-Вакиа', 'Аль-Кахф'];
      const hash = murmurHash3(ctx.todayDateKey);
      const name = sampleSurahs[hash % sampleSurahs.length];
      return `Послушать чтение суры «${name}»`;
    },
    titleUz: (ctx) => {
      const sampleSurahs = ['Mulk', 'Yosin', 'Rohman', 'Voqea', 'Kahf'];
      const hash = murmurHash3(ctx.todayDateKey);
      const name = sampleSurahs[hash % sampleSurahs.length];
      return `«${name}» surasini qori tilovatida tinglash`;
    },
    descriptionRu: () => 'Насладись красивым чтением одного из лучших кари мира',
    descriptionUz: () => 'Dunyoning eng mashhur qorisi tilovatidan bahramand bo‘ling',
    target: () => 1,
    getCurrent: (ctx) => (ctx.listenedAudioToday ? 1 : 0),
    xpReward: 25,
    icon: 'headphones',
    color: '#8B5CF6',
    badgeRu: 'Слушание',
    badgeUz: 'Tinglash',
    route: '/(tabs)/quran',
    eligibility: () => true,
  },
  {
    templateId: 'read_bookmark_favorite',
    pillar: 'reading',
    titleRu: () => 'Добавить 1 аят в закладки',
    titleUz: () => '1 ta oyatni xatcho‘pga saqlash',
    descriptionRu: () => 'Сохрани любимый аят для возвращения к нему позже',
    descriptionUz: () => 'Yoqtirgan oyatingizni keyinroq o‘qish uchun saqlab qo‘ying',
    target: () => 1,
    getCurrent: (ctx) => ctx.bookmarksAddedToday,
    xpReward: 20,
    icon: 'bookmark',
    color: '#8B5CF6',
    badgeRu: 'Закладка',
    badgeUz: 'Xatcho‘p',
    route: '/(tabs)/quran',
    eligibility: () => true,
  },
];

/**
 * Main Dynamic Generator: Generates exactly 3 tailored, personalized quests
 * for a user based on their unique seed + today's calendar date + their progress profile.
 */
export function generateDailyQuests(
  profile: UserProgressProfile,
  completedMap: Record<string, boolean> = {}
): DailyQuest[] {
  const rng = getDailyRNG(profile.userSeed, profile.todayDateKey);

  const pillars: QuestPillar[] = ['learning', 'hifz', 'reading'];
  const generatedQuests: DailyQuest[] = [];

  for (const pillar of pillars) {
    const candidates = QUEST_TEMPLATES.filter(
      (t) => t.pillar === pillar && t.eligibility(profile)
    );

    const pool = candidates.length > 0
      ? candidates
      : QUEST_TEMPLATES.filter((t) => t.pillar === pillar);

    // Pick a deterministic item from the candidate pool using the RNG
    const pickedIndex = Math.floor(rng() * pool.length);
    const template = pool[pickedIndex];

    const target = template.target(profile, rng);
    const questId = `quest_${pillar}_${profile.todayDateKey}_${template.templateId}`;
    const rawCurrent = template.getCurrent(profile);
    const current = Math.min(target, Math.max(0, rawCurrent));
    const completed = current >= target || Boolean(completedMap[questId]);

    generatedQuests.push({
      id: questId,
      pillar: template.pillar,
      titleRu: template.titleRu(profile),
      titleUz: template.titleUz(profile),
      descriptionRu: template.descriptionRu(profile),
      descriptionUz: template.descriptionUz(profile),
      target,
      current: completed ? target : current,
      completed,
      claimed: completed,
      xpReward: template.xpReward,
      icon: template.icon,
      color: template.color,
      badgeRu: template.badgeRu,
      badgeUz: template.badgeUz,
      route: template.route,
    });
  }

  return generatedQuests;
}
