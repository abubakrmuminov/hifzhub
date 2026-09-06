import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  type Card,
  type RecordLog,
} from 'ts-fsrs';
import type { FSRSCardState, ReviewRating } from '../types';

export type { Card, RecordLog };

/**
 * Configure FSRS with defaults tuned for Quran memorization:
 * - request_retention: 0.85 (produces slightly longer intervals suitable for Quran review cycles)
 * - maximum_interval: 36500 (standard max interval)
 * - enable_fuzz: false (deterministic scheduling)
 */
export const quranFSRSParameters = generatorParameters({
  request_retention: 0.85,
  maximum_interval: 36500,
  enable_fuzz: false,
});

export const fsrsInstance = fsrs(quranFSRSParameters);

/**
 * Maps app ReviewRating ('again' | 'hard' | 'good' | 'easy') to ts-fsrs Rating enum
 */
export const mapRatingToFSRS = (rating: ReviewRating): Rating => {
  switch (rating) {
    case 'again':
      return Rating.Again;
    case 'hard':
      return Rating.Hard;
    case 'good':
      return Rating.Good;
    case 'easy':
      return Rating.Easy;
    default: {
      const _exhaustive: never = rating;
      return Rating.Good;
    }
  }
};

/**
 * Converts stored FSRSCardState to ts-fsrs Card object
 */
export const convertCardStateToFSRS = (state: FSRSCardState): Card => {
  return {
    due: new Date(state.due),
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: state.elapsedDays,
    scheduled_days: state.scheduledDays,
    learning_steps: 0,
    reps: state.reps,
    lapses: state.lapses,
    state: state.state as Card['state'],
    last_review: state.lastReview ? new Date(state.lastReview) : undefined,
  };
};

/**
 * Converts ts-fsrs Card object to serializable FSRSCardState
 */
export const convertFSRSToCardState = (card: Card): FSRSCardState => {
  return {
    due: card.due instanceof Date ? card.due.toISOString() : new Date(card.due).toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: Number(card.state),
    lastReview: card.last_review
      ? card.last_review instanceof Date
        ? card.last_review.toISOString()
        : new Date(card.last_review).toISOString()
      : undefined,
  };
};

/**
 * Creates an empty initial FSRSCardState for a new memorization card
 */
export const createNewCard = (now: Date = new Date()): FSRSCardState => {
  const emptyCard = createEmptyCard(now);
  return convertFSRSToCardState(emptyCard);
};

/**
 * Reviews a card with the given rating and returns the updated FSRSCardState
 */
export const reviewCard = (
  cardState: FSRSCardState,
  rating: ReviewRating,
  now: Date = new Date()
): FSRSCardState => {
  const card = convertCardStateToFSRS(cardState);
  const grade = mapRatingToFSRS(rating) as Exclude<Rating, Rating.Manual>;
  const recordItem = fsrsInstance.next(card, now, grade);
  return convertFSRSToCardState(recordItem.card);
};

/**
 * Checks if a card is due for review today or earlier
 */
export const isDue = (cardState: FSRSCardState, now: Date = new Date()): boolean => {
  const dueDate = new Date(cardState.due);
  if (isNaN(dueDate.getTime())) {
    return false;
  }
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return dueDate.getTime() <= endOfDay.getTime();
};

/**
 * Gets the next review Date from card state
 */
export const getNextReviewDate = (cardState: FSRSCardState): Date => {
  return new Date(cardState.due);
};
