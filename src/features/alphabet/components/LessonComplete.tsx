import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { ProgressRing, GlassView, AnimatedPressable } from '@/shared/components';

export interface LessonCompleteProps {
  lessonTitle: string;
  score: number; // 0-100
  xpEarned: number;
  isPassed: boolean;
  totalCorrect: number;
  totalQuestions: number;
  onContinue: () => void;
  onRetry: () => void;
}

export const LessonComplete: React.FC<LessonCompleteProps> = ({
  lessonTitle,
  score,
  xpEarned,
  isPassed,
  totalCorrect,
  totalQuestions,
  onContinue,
  onRetry,
}) => {
  const { t } = useTranslation();
  const { isDark, colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (isPassed) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [isPassed]);

  const clampedScore = Math.min(Math.max(score, 0), 100);
  const progressRatio = clampedScore / 100;
  const ringColor = isPassed ? colors.primary : colors.error || '#E74C3C';
  const totalErrors = Math.max(0, totalQuestions - totalCorrect);
  const statLabel = isPassed
    ? `${t('learn.correctAnswers', { defaultValue: 'Правильно' })}:`
    : `${t('learn.errors', { defaultValue: 'Ошибки' })}:`;
  const statValue = isPassed
    ? `${totalCorrect}/${totalQuestions}`
    : `${totalErrors}/${totalQuestions}`;
  const statColor = isPassed ? colors.text : (colors.error || '#E74C3C');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20) + spacing.lg,
            paddingBottom: Math.max(insets.bottom, 20) + spacing.md,
            paddingHorizontal: spacing.lg,
          },
        ]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerContent}>
          {/* 1. Emoji */}
          <Animated.View entering={FadeInUp.delay(80).duration(400)}>
            <Text style={styles.emoji}>{isPassed ? '🎉' : '📚'}</Text>
          </Animated.View>

          {/* 2. Title & Lesson Name */}
          <Animated.View
            entering={FadeInUp.delay(160).duration(400)}
            style={styles.headerTextContainer}
          >
            <Text style={[styles.title, { color: colors.text }]}>
              {isPassed
                ? t('learn.lessonComplete', { defaultValue: 'Урок пройден!' })
                : t('learn.tryAgain', { defaultValue: 'Попробуй ещё раз' })}
            </Text>
            {lessonTitle ? (
              <Text
                style={[
                  styles.subtitle,
                  { color: colors.textSecondary, marginTop: spacing.xxs },
                ]}
              >
                {lessonTitle}
              </Text>
            ) : null}
          </Animated.View>

          {/* 3. Score Circle Ring */}
          <Animated.View
            entering={FadeInUp.delay(240).duration(400)}
            style={styles.scoreContainer}
          >
            <ProgressRing
              progress={progressRatio}
              size={120}
              strokeWidth={10}
              color={ringColor}
              backgroundColor={
                isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
              }
              textColor={colors.text}
              showPercentage={true}
              centerText={`${Math.round(clampedScore)}%`}
            />
          </Animated.View>

          {/* 4. Stats Row */}
          <Animated.View
            entering={FadeInUp.delay(320).duration(400)}
            style={styles.statsContainer}
          >
            <GlassView style={styles.statsGlass} borderRadius={18}>
              <View style={styles.statItem}>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  {statLabel}{' '}
                  <Text style={[styles.statValue, { color: statColor }]}>
                    {statValue}
                  </Text>
                </Text>
              </View>

              <View
                style={[
                  styles.statDivider,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              />

              <View style={styles.statItem}>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  XP:{' '}
                  <Text
                    style={[styles.xpValue, { color: colors.secondary }]}
                  >
                    +{xpEarned}
                  </Text>
                </Text>
              </View>
            </GlassView>
          </Animated.View>
        </View>

        {/* 5. Buttons */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(400)}
          style={[styles.buttonsContainer, { marginTop: spacing.xl }]}
        >
          {!isPassed && (
            <AnimatedPressable
              onPress={onRetry}
              haptic="medium"
              style={[
                styles.button,
                styles.outlineButton,
                {
                  borderColor: colors.primary,
                  backgroundColor: isDark
                    ? 'rgba(13, 107, 78, 0.12)'
                    : 'rgba(13, 107, 78, 0.05)',
                  marginBottom: spacing.sm,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('learn.retry', { defaultValue: 'Повторить урок' })}
            >
              <Text style={[styles.buttonText, { color: colors.primary }]}>
                {t('learn.retry', { defaultValue: 'Повторить урок' })}
              </Text>
            </AnimatedPressable>
          )}

          <AnimatedPressable
            onPress={onContinue}
            haptic="medium"
            style={[
              styles.button,
              styles.filledButton,
              { backgroundColor: colors.primary },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('learn.continue', { defaultValue: 'Продолжить' })}
          >
            <Text style={[styles.buttonText, styles.filledButtonText]}>
              {t('learn.continue', { defaultValue: 'Продолжить' })}
            </Text>
          </AnimatedPressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emoji: {
    fontSize: 72,
    lineHeight: 84,
    textAlign: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  scoreContainer: {
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    marginTop: 28,
    width: '100%',
    maxWidth: 360,
  },
  statsGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  statValue: {
    fontWeight: '700',
  },
  xpValue: {
    fontWeight: '800',
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledButton: {
    elevation: 0,
  },
  outlineButton: {
    borderWidth: 1.5,
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  filledButtonText: {
    color: '#FFFFFF',
  },
});
