import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components';
import { useSettingsStore } from '@/stores/settingsStore';
import { useMemorizationStore } from '@/stores/memorizationStore';
import {
  AyahListenCard,
  AyahWordScramble,
  AyahFillBlanks,
  AyahStageResult,
  MushafBlindTrainer,
  SessionComplete,
  SessionEmptyState,
  SessionTopBar,
  useReviewSession,
  type SessionCategory,
  type ReviewRating,
  type MemorizationCategory,
} from '@/features/memorization';
import { SURAH_LIST } from '@/features/quran/data/surahList';

type AyahTrainingStage = 'listen' | 'scramble' | 'blanks' | 'result';
type SessionMode = 'mushaf' | 'drill';

export default function MemorizationSessionScreen() {
  const router = useRouter();
  const { category, surahId } = useLocalSearchParams<{ category?: string; surahId?: string }>();
  const parsedSurahId = surahId ? parseInt(surahId, 10) : undefined;
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const language = useSettingsStore((s) => s.language);

  const rawCategory = (category as MemorizationCategory | 'review') || 'sabaq';
  const startSession = useMemorizationStore((s) => s.startSession);
  const cardsMap = useMemorizationStore((s) => s.cards);

  const {
    session,
    currentCard,
    recordReview,
    completeSession,
    progress,
  } = useReviewSession();

  const startTimeRef = useRef<number>(Date.now());

  // Mode: Mushaf page view (authentic continuous text / blind / linking) vs Drill (puzzles)
  const [sessionMode, setSessionMode] = useState<SessionMode>('mushaf');

  // Interactive training stage per ayah (for drill mode):
  // 1. listen -> 2. scramble -> 3. blanks -> 4. result
  const [trainingStage, setTrainingStage] = useState<AyahTrainingStage>('listen');
  const [scrambleMistakes, setScrambleMistakes] = useState(0);
  const [blanksMistakes, setBlanksMistakes] = useState(0);

  const [completedStats, setCompletedStats] = useState<{
    totalCards: number;
    correctCount: number;
    category: SessionCategory;
    timeSpentSeconds: number;
  } | null>(null);

  // Initialize or start session on mount
  useEffect(() => {
    startTimeRef.current = Date.now();
    startSession(rawCategory, 25, parsedSurahId);
  }, [rawCategory, parsedSurahId, startSession]);

  // Reset training stages when switching to a new card
  useEffect(() => {
    setTrainingStage('listen');
    setScrambleMistakes(0);
    setBlanksMistakes(0);
  }, [currentCard?.id]);

  // Handle completion when all cards in session have been reviewed
  useEffect(() => {
    if (
      session &&
      session.totalCards > 0 &&
      session.cards.length >= session.totalCards &&
      !completedStats
    ) {
      const timeSpent = Math.max(
        1,
        Math.round((Date.now() - startTimeRef.current) / 1000)
      );
      const finished = completeSession();
      if (finished) {
        setCompletedStats({
          totalCards: finished.totalCards,
          correctCount: finished.correctCount,
          category: finished.category as SessionCategory,
          timeSpentSeconds: timeSpent,
        });
      }
    }
  }, [session, completedStats, completeSession]);

  const allSessionCards = useMemo(() => {
    if (!session?.cardIds) return [];
    return session.cardIds
      .map((id) => cardsMap[id])
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
  }, [session?.cardIds, cardsMap]);

  const currentSurah = useMemo(() => {
    const targetSurahId = currentCard?.surahId || allSessionCards[0]?.surahId;
    if (!targetSurahId) return null;
    return SURAH_LIST.find((s) => s.id === targetSurahId) || null;
  }, [currentCard, allSessionCards]);

  const surahName =
    currentSurah?.name ||
    (currentCard
      ? `Сура ${currentCard.surahId}`
      : allSessionCards[0]
      ? `Сура ${allSessionCards[0].surahId}`
      : '');
  const translation =
    language === 'uz'
      ? currentCard?.translationUz || currentCard?.translationRu
      : currentCard?.translationRu || currentCard?.translationUz;

  // Handlers for step transitions
  const handleReadyToTrain = useCallback(() => {
    setTrainingStage('scramble');
  }, []);

  const handleScrambleComplete = useCallback((mistakes: number) => {
    setScrambleMistakes(mistakes);
    setTrainingStage('blanks');
  }, []);

  const handleBlanksComplete = useCallback((mistakes: number) => {
    setBlanksMistakes(mistakes);
    setTrainingStage('result');
  }, []);

  const totalMistakes = scrambleMistakes + blanksMistakes;

  const handleNextAyah = useCallback(
    (rating: ReviewRating) => {
      // Record review in store with real performance metric
      recordReview(rating, 0, 0);
    },
    [recordReview]
  );

  const handleFinishMushaf = useCallback(() => {
    if (!session?.cardIds) return;
    const storeCards = useMemorizationStore.getState().cards;
    const unreviewedCardIds = session.cardIds.slice(session.cards.length);
    unreviewedCardIds.forEach((cardId) => {
      const card = storeCards[cardId];
      if (card) {
        const wordsCount = card.arabicText.trim().split(/\s+/).filter(Boolean).length;
        useMemorizationStore.getState().recordReview(cardId, 'easy', 0, wordsCount);
      }
    });
    const timeSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    const finished = completeSession();
    if (finished) {
      setCompletedStats({
        totalCards: finished.totalCards,
        correctCount: finished.correctCount,
        category: finished.category as SessionCategory,
        timeSpentSeconds: timeSpent,
      });
    }
  }, [session, completeSession]);

  const handleSwitchMode = useCallback((mode: SessionMode) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSessionMode(mode);
  }, []);

  const handleRetry = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startTimeRef.current = Date.now();
    setCompletedStats(null);
    setTrainingStage('listen');
    startSession(rawCategory, 25, parsedSurahId);
  }, [rawCategory, parsedSurahId, startSession]);

  const getCategoryTitle = useCallback(
    (cat: MemorizationCategory | 'review') => {
      switch (cat) {
        case 'sabaq':
          return t('hifz.sabaq', { defaultValue: 'Сабак' });
        case 'sabqi':
          return t('hifz.sabqi', { defaultValue: 'Сабки' });
        case 'manzil':
          return t('hifz.manzil', { defaultValue: 'Манзиль' });
        case 'review':
          return t('hifz.review', { defaultValue: 'Повторение' });
      }
    },
    [t]
  );

  // 1. Session Complete View
  if (completedStats) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <SessionComplete
          totalCards={completedStats.totalCards}
          correctCount={completedStats.correctCount}
          category={completedStats.category}
          timeSpentSeconds={completedStats.timeSpentSeconds}
          onContinue={() => router.back()}
          onRetry={handleRetry}
        />
      </SafeAreaView>
    );
  }

  // 2. Empty State View
  if (!session || (!currentCard && allSessionCards.length === 0)) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <SessionEmptyState onBack={() => router.back()} />
      </SafeAreaView>
    );
  }

  // 3. Active Interactive Training Screen
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar with Overall Session Progress */}
      <SessionTopBar
        onBack={() => router.back()}
        currentStep={Math.min(session.totalCards || allSessionCards.length, progress.current + 1)}
        totalSteps={session.totalCards || allSessionCards.length}
        categoryTitle={getCategoryTitle(session.category)}
      />

      {/* Mode Switch Tabs: Authentic Mushaf Page vs Word-by-Word Drill */}
      <View style={[styles.modeTabsRow, { paddingHorizontal: spacing.md, marginVertical: spacing.xs }]}>
        <AnimatedPressable
          onPress={() => handleSwitchMode('mushaf')}
          style={[
            styles.modeTab,
            sessionMode === 'mushaf'
              ? [styles.modeTabActive, { backgroundColor: colors.primary }]
              : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            { borderRadius: radius.full },
          ]}
        >
          <Ionicons
            name="book-outline"
            size={14}
            color={sessionMode === 'mushaf' ? '#FFFFFF' : colors.textSecondary}
          />
          <Text
            style={[
              styles.modeTabText,
              {
                color: sessionMode === 'mushaf' ? '#FFFFFF' : colors.textSecondary,
                marginStart: 6,
              },
            ]}
          >
            {t('hifz.mushafModeTab', { defaultValue: 'Мусхаф (Вслепую)' })}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => handleSwitchMode('drill')}
          style={[
            styles.modeTab,
            sessionMode === 'drill'
              ? [styles.modeTabActive, { backgroundColor: colors.primary }]
              : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            { borderRadius: radius.full },
          ]}
        >
          <Ionicons
            name="extension-puzzle-outline"
            size={14}
            color={sessionMode === 'drill' ? '#FFFFFF' : colors.textSecondary}
          />
          <Text
            style={[
              styles.modeTabText,
              {
                color: sessionMode === 'drill' ? '#FFFFFF' : colors.textSecondary,
                marginStart: 6,
              },
            ]}
          >
            {t('hifz.drillModeTab', { defaultValue: 'Тренажёр слов' })}
          </Text>
        </AnimatedPressable>
      </View>

      {sessionMode === 'drill' && (
        /* Mini Progress Bar of current Ayah Training (4 micro-steps) */
        <View style={[styles.microStepsRow, { paddingHorizontal: spacing.md, marginVertical: spacing.xs }]}>
          {(['listen', 'scramble', 'blanks', 'result'] as AyahTrainingStage[]).map((st, idx) => {
            const stepOrder: Record<AyahTrainingStage, number> = {
              listen: 0,
              scramble: 1,
              blanks: 2,
              result: 3,
            };
            const isDone = stepOrder[trainingStage] >= idx;
            const isCurrent = trainingStage === st;

            return (
              <View
                key={st}
                style={[
                  styles.microStepBar,
                  {
                    backgroundColor: isDone
                      ? colors.primary
                      : 'rgba(150, 150, 150, 0.25)',
                    opacity: isCurrent ? 1 : isDone ? 0.8 : 0.4,
                    borderRadius: radius.full,
                  },
                ]}
              />
            );
          })}
        </View>
      )}

      {/* Main Interactive Stage Area */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.modeContainer}>
          {sessionMode === 'mushaf' ? (
            <MushafBlindTrainer
              cards={allSessionCards}
              surahName={surahName}
              surahId={currentSurah?.id || allSessionCards[0]?.surahId || 1}
              onFinishSession={handleFinishMushaf}
              onSwitchToDrillMode={() => handleSwitchMode('drill')}
            />
          ) : (
            currentCard && (
              <Animated.View
                key={`${currentCard.id}_${trainingStage}`}
                entering={FadeInDown.duration(350)}
                style={styles.stageCardContainer}
              >
                {trainingStage === 'listen' && (
                  <AyahListenCard
                    arabicText={currentCard.arabicText}
                    surahId={currentCard.surahId}
                    ayahNumber={currentCard.ayahNumber}
                    surahName={surahName}
                    translation={translation}
                    onReadyToTrain={handleReadyToTrain}
                  />
                )}

                {trainingStage === 'scramble' && (
                  <AyahWordScramble
                    arabicText={currentCard.arabicText}
                    surahName={surahName}
                    ayahNumber={currentCard.ayahNumber}
                    onComplete={handleScrambleComplete}
                  />
                )}

                {trainingStage === 'blanks' && (
                  <AyahFillBlanks
                    arabicText={currentCard.arabicText}
                    surahName={surahName}
                    ayahNumber={currentCard.ayahNumber}
                    onComplete={handleBlanksComplete}
                  />
                )}

                {trainingStage === 'result' && (
                  <AyahStageResult
                    totalMistakes={totalMistakes}
                    surahName={surahName}
                    ayahNumber={currentCard.ayahNumber}
                    onNextAyah={handleNextAyah}
                  />
                )}
              </Animated.View>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  microStepsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    height: 6,
  },
  microStepBar: {
    flex: 1,
    height: 4,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  modeContainer: {
    width: '100%',
  },
  stageCardContainer: {
    width: '100%',
  },
  modeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modeTabActive: {
    shadowColor: '#0D6B4E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
