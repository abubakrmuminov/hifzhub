import { useMemo, useCallback } from 'react';
import { useMemorizationStore } from '@/stores/memorizationStore';
import type {
  MemorizationCard,
  MemorizationCategory,
  ReviewRating,
  ReviewSession,
  DailyMemorizationStats,
  AyahToMemorizeInput,
} from '@/features/memorization/types';

export interface MemorizationDashboardResult {
  dueCount: number;
  newCount: number;
  sabaqCount: number;
  sabqiCount: number;
  manzilCount: number;
  totalMemorized: number;
  todayStats: DailyMemorizationStats;
  startSession: (category: MemorizationCategory | 'review', maxCards?: number) => ReviewSession | null;
}

export interface ReviewSessionProgress {
  current: number;
  total: number;
  percentage: number;
}

export interface ReviewSessionResult {
  session: ReviewSession | null;
  currentCard: MemorizationCard | null;
  nextCard: MemorizationCard | null;
  recordReview: (rating: ReviewRating, revealedWords?: number, totalWords?: number) => void;
  completeSession: () => ReviewSession | null;
  progress: ReviewSessionProgress;
}

export interface AddAyahsResult {
  addAyahs: (ayahs: AyahToMemorizeInput[]) => void;
  removeCard: (cardId: string) => void;
  isAdded: (surahId: number, ayahNum: number) => boolean;
}

/**
 * Hook providing memorization overview statistics and session starter
 */
export const useMemorizationDashboard = (): MemorizationDashboardResult => {
  const cards = useMemorizationStore((state) => state.cards);
  const getDueCards = useMemorizationStore((state) => state.getDueCards);
  const getNewCards = useMemorizationStore((state) => state.getNewCards);
  const getSabaqCards = useMemorizationStore((state) => state.getSabaqCards);
  const getSabqiCards = useMemorizationStore((state) => state.getSabqiCards);
  const getManzilCards = useMemorizationStore((state) => state.getManzilCards);
  const getTotalMemorized = useMemorizationStore((state) => state.getTotalMemorized);
  const getTodayStats = useMemorizationStore((state) => state.getTodayStats);
  const startSession = useMemorizationStore((state) => state.startSession);

  return useMemo(() => {
    return {
      dueCount: getDueCards().length,
      newCount: getNewCards().length,
      sabaqCount: getSabaqCards().length,
      sabqiCount: getSabqiCards().length,
      manzilCount: getManzilCards().length,
      totalMemorized: getTotalMemorized(),
      todayStats: getTodayStats(),
      startSession,
    };
  }, [
    cards,
    getDueCards,
    getNewCards,
    getSabaqCards,
    getSabqiCards,
    getManzilCards,
    getTotalMemorized,
    getTodayStats,
    startSession,
  ]);
};

/**
 * Hook for managing the active review session, navigating cards and recording assessments
 */
export const useReviewSession = (): ReviewSessionResult => {
  const session = useMemorizationStore((state) => state.currentSession);
  const cards = useMemorizationStore((state) => state.cards);
  const storeRecordReview = useMemorizationStore((state) => state.recordReview);
  const completeSession = useMemorizationStore((state) => state.completeSession);

  const cardIds = session?.cardIds ?? [];
  const answeredCount = session?.cards.length ?? 0;
  const currentCardId = cardIds[answeredCount];
  const nextCardId = cardIds[answeredCount + 1];

  const currentCard = currentCardId ? cards[currentCardId] ?? null : null;
  const nextCard = nextCardId ? cards[nextCardId] ?? null : null;

  const total = session?.totalCards ?? 0;
  const percentage = total > 0 ? Math.round((answeredCount / total) * 100) : 0;
  const progress: ReviewSessionProgress = {
    current: answeredCount,
    total,
    percentage,
  };

  const recordReview = useCallback(
    (rating: ReviewRating, revealedWords = 0, totalWords?: number) => {
      if (!currentCard) {
        return;
      }
      const calculatedTotalWords =
        totalWords ??
        currentCard.arabicText
          .trim()
          .split(/\s+/)
          .filter((w) => w.length > 0).length;

      storeRecordReview(currentCard.id, rating, revealedWords, calculatedTotalWords);
    },
    [currentCard, storeRecordReview]
  );

  return {
    session,
    currentCard,
    nextCard,
    recordReview,
    completeSession,
    progress,
  };
};

/**
 * Hook for adding and managing ayahs in the memorization collection
 */
export const useAddAyahs = (): AddAyahsResult => {
  const cards = useMemorizationStore((state) => state.cards);
  const addAyahs = useMemorizationStore((state) => state.addAyahsToMemorize);
  const removeCard = useMemorizationStore((state) => state.removeCard);

  const isAdded = useCallback(
    (surahId: number, ayahNum: number): boolean => {
      return Boolean(cards[`${surahId}_${ayahNum}`]);
    },
    [cards]
  );

  return {
    addAyahs,
    removeCard,
    isAdded,
  };
};
