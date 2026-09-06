import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  MemorizationCard,
  MemorizationCategory,
  ReviewSession,
  ReviewSessionCard,
  ReviewRating,
  DailyMemorizationStats,
} from '@/features/memorization/types';
import { createNewCard, reviewCard, isDue } from '@/features/memorization/services/fsrsService';
import { getTodayDateString } from '@/stores/progressStore';

const asyncStorage: StateStorage = {
  setItem: (name: string, value: string) => AsyncStorage.setItem(name, value),
  getItem: (name: string) => AsyncStorage.getItem(name),
  removeItem: (name: string) => AsyncStorage.removeItem(name),
};

export interface MemorizationState {
  // State
  cards: Record<string, MemorizationCard>; // cardId -> card
  sessions: ReviewSession[]; // history (last 30)
  currentSession: ReviewSession | null;

  // Computed-like getters
  getDueCards: () => MemorizationCard[]; // all cards due today
  getNewCards: () => MemorizationCard[]; // cards never reviewed (state=0)
  getSabaqCards: () => MemorizationCard[];
  getSabqiCards: () => MemorizationCard[];
  getManzilCards: () => MemorizationCard[];
  getTotalMemorized: () => number; // cards with state >= 2 (Review)
  getTodayStats: () => DailyMemorizationStats;

  // Actions
  addAyahsToMemorize: (
    ayahs: Array<{
      surahId: number;
      ayahNumber: number;
      arabicText: string;
      translationRu?: string;
      translationUz?: string;
    }>
  ) => void;
  removeCard: (cardId: string) => void;

  // Session actions
  startSession: (
    category: MemorizationCategory | 'review',
    maxCards?: number,
    targetSurahId?: number
  ) => ReviewSession | null;
  recordReview: (
    cardId: string,
    rating: ReviewRating,
    revealedWords: number,
    totalWords: number
  ) => void;
  completeSession: () => ReviewSession | null;

  // Category management
  updateCategories: () => void; // re-categorize cards based on time

  // Reset
  resetAllMemorization: () => void;
}

/**
/**
 * Computes category according to traditional Islamic Hifz methodology:
 * - sabaq: unstudied cards (reviewCount=0, state=0) or failed cards needing relearning (state=3)
 * - sabqi: cards reviewed & memorized (reviewCount >= 1), under active retention consolidation (reviewCount < 4 or stability < 10)
 * - manzil: deeply consolidated long-term memory cards (reviewCount >= 4 and stability >= 10)
 */
export const calculateCardCategory = (
  card: MemorizationCard,
  _now: number = Date.now()
): MemorizationCategory => {
  const state = card.fsrsState.state;
  const stability = card.fsrsState.stability;
  const reviewCount = card.reviewCount ?? 0;

  // 1. If unstudied or failed in relearning: it's Sabaq (new / unmastered lesson)
  if (reviewCount === 0 || state === 0 || state === 3) {
    return 'sabaq';
  }

  // 2. If reviewed 4+ times with high stability: it has graduated to Manzil (permanent consolidation)
  if (reviewCount >= 4 && stability >= 10) {
    return 'manzil';
  }

  // 3. Otherwise, it has been learned at least once and is in active reinforcement: Sabqi (recent memorization)
  return 'sabqi';
};

export const useMemorizationStore = create<MemorizationState>()(
  persist(
    (set, get) => ({
      cards: {},
      sessions: [],
      currentSession: null,

      getDueCards: () => {
        return Object.values(get().cards).filter(
          (card) => (card.reviewCount ?? 0) > 0 && isDue(card.fsrsState)
        );
      },

      getNewCards: () => {
        return Object.values(get().cards).filter(
          (card) => (card.reviewCount ?? 0) === 0 || card.fsrsState.state === 0
        );
      },

      getSabaqCards: () => {
        return Object.values(get().cards).filter(
          (card) => calculateCardCategory(card) === 'sabaq'
        );
      },

      getSabqiCards: () => {
        return Object.values(get().cards).filter(
          (card) => calculateCardCategory(card) === 'sabqi'
        );
      },

      getManzilCards: () => {
        return Object.values(get().cards).filter(
          (card) => calculateCardCategory(card) === 'manzil'
        );
      },

      getTotalMemorized: () => {
        return Object.values(get().cards).filter(
          (card) =>
            (card.reviewCount ?? 0) > 0 &&
            card.fsrsState.state !== 0 &&
            card.fsrsState.state !== 3
        ).length;
      },

      getTodayStats: () => {
        const todayStr = getTodayDateString();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const startOfDayMs = startOfDay.getTime();
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const endOfDayMs = endOfDay.getTime();

        const { cards, sessions, currentSession } = get();

        let cardsReviewed = 0;
        let totalTimeMs = 0;
        const studiedCardIdsToday = new Set<string>();

        const allSessions = currentSession ? [currentSession, ...sessions] : sessions;

        for (const session of allSessions) {
          if (session.startedAt >= startOfDayMs && session.startedAt <= endOfDayMs) {
            if (session.completedAt) {
              totalTimeMs += Math.max(0, session.completedAt - session.startedAt);
            } else if (session === currentSession) {
              totalTimeMs += Math.max(0, Date.now() - session.startedAt);
            }
          }

          for (const card of session.cards) {
            if (card.answeredAt >= startOfDayMs && card.answeredAt <= endOfDayMs) {
              cardsReviewed += 1;
              studiedCardIdsToday.add(card.cardId);
            }
          }
        }

        let newCardsStudied = 0;
        for (const cardId of studiedCardIdsToday) {
          const card = cards[cardId];
          if (card && card.addedAt >= startOfDayMs && card.addedAt <= endOfDayMs) {
            newCardsStudied += 1;
          }
        }

        const totalTimeMinutes = Math.round((totalTimeMs / (1000 * 60)) * 10) / 10;

        return {
          date: todayStr,
          newCardsStudied,
          cardsReviewed,
          totalTimeMinutes,
        };
      },

      addAyahsToMemorize: (ayahs) => {
        const now = Date.now();
        const currentCards = { ...get().cards };
        let hasChanges = false;

        for (const ayah of ayahs) {
          const cardId = `${ayah.surahId}_${ayah.ayahNumber}`;
          if (!currentCards[cardId]) {
            const initialFsrs = createNewCard();
            const newCard: MemorizationCard = {
              id: cardId,
              surahId: ayah.surahId,
              ayahNumber: ayah.ayahNumber,
              arabicText: ayah.arabicText,
              translationRu: ayah.translationRu,
              translationUz: ayah.translationUz,
              fsrsState: initialFsrs,
              addedAt: now,
              reviewCount: 0,
              category: 'sabaq',
            };
            currentCards[cardId] = newCard;
            hasChanges = true;
          } else {
            const existing = currentCards[cardId];
            if (
              (ayah.translationRu && existing.translationRu !== ayah.translationRu) ||
              (ayah.translationUz && existing.translationUz !== ayah.translationUz) ||
              (ayah.arabicText && existing.arabicText !== ayah.arabicText)
            ) {
              currentCards[cardId] = {
                ...existing,
                arabicText: ayah.arabicText || existing.arabicText,
                translationRu: ayah.translationRu ?? existing.translationRu,
                translationUz: ayah.translationUz ?? existing.translationUz,
              };
              hasChanges = true;
            }
          }
        }

        if (hasChanges) {
          set({ cards: currentCards });
        }
      },

      removeCard: (cardId) => {
        const currentCards = { ...get().cards };
        delete currentCards[cardId];

        let updatedSession = get().currentSession;
        if (updatedSession?.cardIds) {
          const filteredCardIds = updatedSession.cardIds.filter((id) => id !== cardId);
          updatedSession = {
            ...updatedSession,
            cardIds: filteredCardIds,
            totalCards: filteredCardIds.length,
          };
        }

        set({ cards: currentCards, currentSession: updatedSession });
      },

      startSession: (category, maxCards = 20, targetSurahId?: number) => {
        get().updateCategories();
        const allCards = Object.values(get().cards);
        let categoryCards: MemorizationCard[] = [];

        if (targetSurahId) {
          // If a specific surah is requested, include cards of this surah
          categoryCards = allCards.filter((card) => card.surahId === targetSurahId);
        } else if (category === 'review') {
          const dueCards = allCards.filter(
            (card) => (card.reviewCount ?? 0) > 0 && isDue(card.fsrsState)
          );
          if (dueCards.length > 0) {
            categoryCards = dueCards;
          } else {
            categoryCards = allCards.filter((card) => {
              const cat = calculateCardCategory(card);
              return cat === 'sabqi' || cat === 'manzil';
            });
          }
        } else {
          categoryCards = allCards.filter((card) => calculateCardCategory(card) === category);
          if (categoryCards.length === 0) {
            categoryCards = allCards;
          }
        }

        if (categoryCards.length === 0) {
          return null;
        }

        // CRITICAL: Sort strictly in Quranic chronological order (surahId, ayahNumber)
        // Never split into due/nonDue which causes holes and gaps like missing verses!
        categoryCards.sort((a, b) => a.surahId - b.surahId || a.ayahNumber - b.ayahNumber);

        const selectedCards = categoryCards.slice(0, Math.max(1, maxCards));

        const session: ReviewSession = {
          id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          startedAt: Date.now(),
          cards: [],
          category,
          totalCards: selectedCards.length,
          correctCount: 0,
          cardIds: selectedCards.map((card) => card.id),
        };

        set({ currentSession: session });
        return session;
      },

      recordReview: (cardId, rating, revealedWords, totalWords) => {
        const state = get();
        const card = state.cards[cardId];
        if (!card) {
          return;
        }

        const now = Date.now();
        const updatedFsrs = reviewCard(card.fsrsState, rating, new Date(now));

        const updatedCard: MemorizationCard = {
          ...card,
          fsrsState: updatedFsrs,
          lastReviewedAt: now,
          reviewCount: card.reviewCount + 1,
        };

        const updatedCards = {
          ...state.cards,
          [cardId]: updatedCard,
        };

        let updatedCurrentSession = state.currentSession;
        if (updatedCurrentSession) {
          const isCorrect = rating !== 'again';
          const sessionCard: ReviewSessionCard = {
            cardId,
            rating,
            answeredAt: now,
            revealedWordCount: revealedWords,
            totalWords,
          };

          updatedCurrentSession = {
            ...updatedCurrentSession,
            cards: [...updatedCurrentSession.cards, sessionCard],
            correctCount: updatedCurrentSession.correctCount + (isCorrect ? 1 : 0),
          };
        }

        set({
          cards: updatedCards,
          currentSession: updatedCurrentSession,
        });

        get().updateCategories();
      },

      completeSession: () => {
        const { currentSession, sessions } = get();
        if (!currentSession) {
          return null;
        }

        const completedSession: ReviewSession = {
          ...currentSession,
          completedAt: Date.now(),
        };

        const updatedSessions = [completedSession, ...sessions].slice(0, 30);

        set({
          currentSession: null,
          sessions: updatedSessions,
        });

        get().updateCategories();
        return completedSession;
      },

      updateCategories: () => {
        const { cards } = get();
        const now = Date.now();
        let hasChanges = false;
        const updatedCards: Record<string, MemorizationCard> = {};

        for (const card of Object.values(cards)) {
          const nextCategory = calculateCardCategory(card, now);
          if (card.category !== nextCategory) {
            hasChanges = true;
            updatedCards[card.id] = {
              ...card,
              category: nextCategory,
            };
          } else {
            updatedCards[card.id] = card;
          }
        }

        if (hasChanges) {
          set({ cards: updatedCards });
        }
      },

      resetAllMemorization: () => {
        set({
          cards: {},
          sessions: [],
          currentSession: null,
        });
      },
    }),
    {
      name: 'hifzhub-memorization-v1',
      storage: createJSONStorage(() => asyncStorage),
    }
  )
);
