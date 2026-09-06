// Card representing a single ayah being memorized
export interface MemorizationCard {
  id: string; // 'surah_ayah' e.g. '2_255'
  surahId: number;
  ayahNumber: number;
  arabicText: string;
  translationRu?: string;
  translationUz?: string;
  // FSRS scheduling state
  fsrsState: FSRSCardState;
  // Tracking
  addedAt: number; // timestamp
  lastReviewedAt?: number;
  reviewCount: number;
  // Category
  category: MemorizationCategory;
}

export type MemorizationCategory = 'sabaq' | 'sabqi' | 'manzil';
// sabaq = new (learning today)
// sabqi = recent (learned in last 7 days, needs reinforcement)
// manzil = old (learned > 7 days ago, long-term review)

export interface FSRSCardState {
  due: string; // ISO date string
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number; // 0=New, 1=Learning, 2=Review, 3=Relearning
  lastReview?: string; // ISO date string
}

export interface ReviewSession {
  id: string;
  startedAt: number;
  completedAt?: number;
  cards: ReviewSessionCard[];
  category: MemorizationCategory | 'review';
  totalCards: number;
  correctCount: number;
  cardIds?: string[];
}

export interface ReviewSessionCard {
  cardId: string;
  rating: ReviewRating; // user's self-assessment
  answeredAt: number;
  revealedWordCount: number; // how many words they needed revealed
  totalWords: number;
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';
// Maps to FSRS Rating: Again=1, Hard=2, Good=3, Easy=4

export interface DailyMemorizationStats {
  date: string; // 'YYYY-MM-DD'
  newCardsStudied: number;
  cardsReviewed: number;
  totalTimeMinutes: number;
}

export interface AyahRange {
  surahId: number;
  fromAyah: number;
  toAyah: number;
}

export interface AyahToMemorizeInput {
  surahId: number;
  ayahNumber: number;
  arabicText: string;
  translationRu?: string;
  translationUz?: string;
}
