import { useMemo } from 'react';
import { useMemorizationStore } from '@/stores/memorizationStore';
import { useProgressStore } from '@/stores/progressStore';
import { useLessonStore } from '@/stores/lessonStore';
import type { MemorizationCard } from '@/features/memorization/types';
import { JUZ_LIST, isAyahInJuz, calculateJuzProgress } from '../data/juzData';
import { getUserLevel } from '../data/userLevels';
import type { JuzProgress, ProgressOverview } from '../types';

export const isAyahMemorized = (card: MemorizationCard): boolean => {
  return (
    (card.reviewCount ?? 0) > 0 &&
    card.fsrsState.state !== 0 &&
    card.fsrsState.state !== 3
  );
};

export interface JuzProgressSummary {
  totalMemorizedAyahs: number;
  totalQuranAyahs: number;
  overallPercentage: number;
  quranPercentage: number;
  completedJuzCount: number;
  inProgressJuzCount: number;
  totalJuz: number;
}

export interface UseJuzProgressReturn extends JuzProgressSummary {
  juzProgress: JuzProgress[];
  juzList: JuzProgress[];
  stats: JuzProgressSummary;
  getJuzById: (juzId: number) => JuzProgress | undefined;
}

export function useJuzProgress(): UseJuzProgressReturn {
  const cards = useMemorizationStore((state) => state.cards);

  const memorizedCards = useMemo(() => {
    return Object.values(cards).filter(isAyahMemorized);
  }, [cards]);

  const juzProgressList: JuzProgress[] = useMemo(() => {
    return JUZ_LIST.map((juz) => {
      const memorizedInJuz = memorizedCards.filter((card) =>
        isAyahInJuz(card.surahId, card.ayahNumber, juz)
      ).length;

      return calculateJuzProgress(juz, memorizedInJuz);
    });
  }, [memorizedCards]);

  const stats = useMemo<JuzProgressSummary>(() => {
    const totalMemorizedAyahs = memorizedCards.length;
    const totalQuranAyahs = 6236;
    const overallPercentage =
      totalQuranAyahs > 0
        ? Number(((totalMemorizedAyahs / totalQuranAyahs) * 100).toFixed(2))
        : 0;
    const completedJuzCount = juzProgressList.filter((j) => j.isCompleted).length;
    const inProgressJuzCount = juzProgressList.filter(
      (j) => j.memorizedAyahs > 0 && !j.isCompleted
    ).length;

    return {
      totalMemorizedAyahs,
      totalQuranAyahs,
      overallPercentage,
      quranPercentage: overallPercentage,
      completedJuzCount,
      inProgressJuzCount,
      totalJuz: JUZ_LIST.length,
    };
  }, [memorizedCards.length, juzProgressList]);

  return {
    juzProgress: juzProgressList,
    juzList: juzProgressList,
    stats,
    ...stats,
    getJuzById: (juzId: number) => juzProgressList.find((j) => j.id === juzId),
  };
}

export function useProgressOverview(): ProgressOverview {
  const cards = useMemorizationStore((state) => state.cards);
  const getSabaqCards = useMemorizationStore((state) => state.getSabaqCards);
  const getSabqiCards = useMemorizationStore((state) => state.getSabqiCards);
  const getManzilCards = useMemorizationStore((state) => state.getManzilCards);
  const getTotalMemorized = useMemorizationStore((state) => state.getTotalMemorized);

  const rawCurrentStreak = useProgressStore((state) => state.currentStreak);
  const getEffectiveStreak = useProgressStore((state) => state.getEffectiveStreak);
  const currentStreak = typeof getEffectiveStreak === 'function' ? getEffectiveStreak() : rawCurrentStreak;
  const bestStreak = useProgressStore((state) => state.bestStreak);

  const lessonXP = useLessonStore((state) => state.totalXP);

  const totalAyahsMemorized = getTotalMemorized();
  const TOTAL_QURAN_AYAHS = 6236;
  const quranPercentage = Number(((totalAyahsMemorized / TOTAL_QURAN_AYAHS) * 100).toFixed(2));

  const memorizationXP = Object.values(cards).reduce(
    (acc, card) => acc + (card.reviewCount ?? 0) * 10,
    0
  );
  const totalXP = (lessonXP || 0) + memorizationXP;

  const { currentLevel, nextLevel, progress: levelProgress } = getUserLevel(totalXP);
  const nextLevelXP = nextLevel ? nextLevel.minXP : currentLevel.maxXP;

  const sabaqCount = getSabaqCards().length;
  const sabqiCount = getSabqiCards().length;
  const manzilCount = getManzilCards().length;

  return {
    totalAyahsMemorized,
    quranPercentage,
    currentStreak,
    bestStreak,
    totalXP,
    currentLevel,
    nextLevelXP,
    levelProgress,
    sabaqCount,
    sabqiCount,
    manzilCount,
  };
}
