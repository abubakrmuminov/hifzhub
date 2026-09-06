import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, StatusBar, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/shared/theme';
import { useLessonStore } from '@/stores/lessonStore';
import type { Lesson, LessonStep } from '@/features/alphabet/types';

import { TheoryCard } from '@/features/alphabet/components/TheoryCard';
import { LetterIntroCard } from '@/features/alphabet/components/LetterIntroCard';
import { QuizChoice } from '@/features/alphabet/components/QuizChoice';
import { QuizMatch } from '@/features/alphabet/components/QuizMatch';
import { FindTheRule } from '@/features/alphabet/components/FindTheRule';
import { ListenRepeat } from '@/features/alphabet/components/ListenRepeat';
import { ReadingCheck } from '@/features/alphabet/components/ReadingCheck';
import { StepProgressBar } from '@/features/alphabet/components/StepProgressBar';
import { XPPopup } from '@/features/alphabet/components/XPPopup';
import { LessonComplete } from '@/features/alphabet/components/LessonComplete';
import { useLessonDetail } from '@/features/alphabet/hooks/useLessonContent';

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { lesson, isLoading, error, retry } = useLessonDetail(lessonId ?? '');
  const { t } = useTranslation();
  const { colors } = useTheme();
  if (!lesson) {
    return <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.text }}>{t(isLoading ? 'common.loading' : 'common.error')}</Text>
      {error && <Button title={t('common.retry')} onPress={() => { void retry(); }} />}
      <Button title={t('common.back')} onPress={() => router.back()} />
    </SafeAreaView>;
  }
  return <LessonRunner key={lesson.lessonId} lesson={lesson} />;
}

interface LessonRunnerProps { lesson: Lesson }

function LessonRunner({ lesson }: LessonRunnerProps) {
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [xpPopupVisible, setXpPopupVisible] = useState(false);

  const xpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const completeLesson = useLessonStore((state) => state.completeLesson);

  useEffect(() => {
    return () => {
      if (xpTimerRef.current) {
        clearTimeout(xpTimerRef.current);
      }
    };
  }, []);

  const totalQuizSteps = useMemo(() => {
    return lesson.steps.filter(
      (s) =>
        s.type === 'quiz_choice' ||
        s.type === 'quiz_match' ||
        s.type === 'find_the_rule'
    ).length;
  }, [lesson.steps]);

  const totalQuestions = totalQuizSteps > 0 ? totalQuizSteps : totalAnswered;
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 100;
  const passingScore = lesson.passingScore ?? 70;
  const isPassed = score >= passingScore;
  const xpEarned = isPassed ? lesson.xpReward : Math.round((score / 100) * lesson.xpReward);

  const handleContinue = useCallback(() => {
    if (currentStepIndex + 1 < lesson.steps.length) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setShowComplete(true);
    }
  }, [currentStepIndex, lesson.steps.length]);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      setTotalAnswered((prev) => prev + 1);
      if (correct) {
        setCorrectAnswers((prev) => prev + 1);
        setXpPopupVisible(true);
        if (xpTimerRef.current) {
          clearTimeout(xpTimerRef.current);
        }
        xpTimerRef.current = setTimeout(() => {
          setXpPopupVisible(false);
        }, 1800);
      }
      handleContinue();
    },
    [handleContinue]
  );

  const handleClose = useCallback(() => {
    Alert.alert(
      t('learn.exitLesson', { defaultValue: 'Выйти из урока?' }),
      t('learn.exitLessonMessage', { defaultValue: 'Ваш прогресс в этом уроке не сохранится.' }),
      [
        { text: t('common.cancel', { defaultValue: 'Отмена' }), style: 'cancel' },
        {
          text: t('learn.exit', { defaultValue: 'Выйти' }),
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  }, [t]);

  const handleCompleteContinue = useCallback(() => {
    completeLesson({
      lessonId: lesson.lessonId,
      moduleId: lesson.moduleId,
      score,
      xpEarned,
      completedAt: Date.now(),
      passed: isPassed,
    });
    router.back();
  }, [completeLesson, lesson.lessonId, lesson.moduleId, score, xpEarned, isPassed]);

  const handleRetry = useCallback(() => {
    setCurrentStepIndex(0);
    setCorrectAnswers(0);
    setTotalAnswered(0);
    setShowComplete(false);
    setXpPopupVisible(false);
  }, []);

  const currentStep: LessonStep | undefined = lesson.steps[currentStepIndex];

  const renderStep = (step: LessonStep) => {
    switch (step.type) {
      case 'theory':
        return (
          <TheoryCard
            title={step.title}
            content={step.content}
            mnemonic={step.mnemonic}
            example={step.example}
            onContinue={handleContinue}
          />
        );

      case 'letter_intro':
        return (
          <LetterIntroCard
            arabic={step.arabic}
            name={step.name}
            transliteration={step.transliteration}
            makhraj={step.makhraj}
            isHeavy={step.isHeavy}
            forms={step.forms}
            note={step.note}
            weightRule={step.weightRule}
            onContinue={handleContinue}
          />
        );

      case 'listen_and_repeat':
        return (
          <ListenRepeat
            instruction={step.instruction}
            items={step.items}
            recordingEnabled={step.recordingEnabled}
            cameraHintEnabled={step.cameraHintEnabled}
            onContinue={handleContinue}
          />
        );

      case 'reading_check':
        return (
          <ReadingCheck
            instruction={step.instruction}
            arabic={step.arabic}
            transliteration={step.transliteration}
            audioFile={step.audioFile}
            recordingEnabled={step.recordingEnabled}
            passScore={step.passScore}
            transliterationInitiallyHidden={step.transliterationInitiallyHidden}
            onContinue={handleContinue}
          />
        );

      case 'quiz_choice':
        return (
          <QuizChoice
            question={step.question}
            options={step.options}
            correctIndex={step.correctIndex}
            explanation={step.explanation}
            onAnswer={handleAnswer}
          />
        );

      case 'quiz_match':
        return (
          <QuizMatch
            question={step.question}
            pairs={step.pairs}
            onAnswer={handleAnswer}
          />
        );

      case 'find_the_rule':
        return (
          <FindTheRule
            instruction={step.instruction}
            items={step.items}
            correctIndices={step.correctIndices}
            targetRule={step.targetRule}
            explanation={step.explanation}
            onAnswer={handleAnswer}
          />
        );

      default:
        return (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              {t('learn.unknownStep', { defaultValue: 'Неизвестный тип шага' })}: {(step as any).type}
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <XPPopup xp={5} visible={xpPopupVisible} />

      {showComplete ? (
        <LessonComplete
          lessonTitle={lesson.title}
          score={score}
          xpEarned={xpEarned}
          isPassed={isPassed}
          totalCorrect={correctAnswers}
          totalQuestions={totalQuestions}
          onContinue={handleCompleteContinue}
          onRetry={handleRetry}
        />
      ) : (
        <>
          <StepProgressBar
            currentStep={currentStepIndex}
            totalSteps={lesson.steps.length}
            onClose={handleClose}
          />
          <View style={styles.stepContainer} key={currentStepIndex}>
            {currentStep ? renderStep(currentStep) : null}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
