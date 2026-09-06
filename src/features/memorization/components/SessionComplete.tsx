import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { GlassView, AnimatedPressable } from '@/shared/components';

export type SessionCategory = 'sabaq' | 'sabqi' | 'manzil' | 'review';

export interface SessionCompleteProps {
  totalCards: number;
  correctCount: number;
  category: SessionCategory;
  timeSpentSeconds: number;
  onContinue: () => void;
  onRetry: () => void;
}

export const SessionComplete: React.FC<SessionCompleteProps> = ({
  totalCards,
  correctCount,
  category,
  timeSpentSeconds,
  onContinue,
  onRetry,
}) => {
  const { colors, spacing, radius, isDark } = useTheme();
  const { t } = useTranslation();

  const accuracy = totalCards > 0 ? Math.round((correctCount / totalCards) * 100) : 100;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} ${t('hifz.minutesShort', { defaultValue: 'мин' })} ${secs} ${t('hifz.secondsShort', { defaultValue: 'сек' })}`;
    }
    return `${secs} ${t('hifz.secondsShort', { defaultValue: 'сек' })}`;
  };

  const getCategoryLabel = (cat: SessionCategory): string => {
    switch (cat) {
      case 'sabaq':
        return t('hifz.categorySabaqBadge', { defaultValue: 'Сабак' });
      case 'sabqi':
        return t('hifz.categorySabqiBadge', { defaultValue: 'Сабки' });
      case 'manzil':
        return t('hifz.categoryManzilBadge', { defaultValue: 'Манзиль' });
      case 'review':
        return t('hifz.review', { defaultValue: 'Повторение' });
    }
  };

  return (
    <Animated.View entering={FadeInDown.duration(450)} style={styles.container}>
      {/* Big Animated Checkmark Icon */}
      <View
        style={[
          styles.iconCircle,
          {
            borderRadius: radius.full,
            backgroundColor: isDark
              ? 'rgba(13, 107, 78, 0.20)'
              : 'rgba(13, 107, 78, 0.12)',
            borderColor: isDark
              ? 'rgba(13, 107, 78, 0.40)'
              : 'rgba(13, 107, 78, 0.25)',
          },
        ]}
      >
        <Ionicons
          name="checkmark-circle"
          size={76}
          color={colors.primary}
        />
      </View>

      {/* Category Badge */}
      <View
        style={[
          styles.categoryBadge,
          {
            borderRadius: radius.full,
            backgroundColor: isDark
              ? 'rgba(212, 167, 69, 0.18)'
              : 'rgba(212, 167, 69, 0.12)',
            borderColor: isDark
              ? 'rgba(212, 167, 69, 0.35)'
              : 'rgba(212, 167, 69, 0.25)',
            marginTop: spacing.md,
          },
        ]}
      >
        <Ionicons
          name="ribbon-outline"
          size={14}
          color={colors.secondary}
          style={styles.badgeIcon}
        />
        <Text style={[styles.categoryBadgeText, { color: colors.secondary }]}>
          {getCategoryLabel(category)}
        </Text>
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.text, marginTop: spacing.sm }]}>
        {t('hifz.sessionComplete', { defaultValue: 'Сессия завершена!' })}
      </Text>

      {/* Subtitle congratulation */}
      <Text
        style={[
          styles.subtitle,
          { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
        ]}
      >
        {t('hifz.sessionCompleteSubtitle', {
          defaultValue: 'Отличная работа, продолжайте закреплять знания!',
        })}
      </Text>

      {/* Stats Summary GlassView */}
      <GlassView borderRadius={radius.lg} style={styles.statsCard}>
        <View style={[styles.statsContent, { paddingVertical: spacing.md, paddingHorizontal: spacing.sm }]}>
          {/* Cards count */}
          <View style={styles.statColumn}>
            <Ionicons
              name="layers-outline"
              size={20}
              color={colors.primary}
              style={styles.statIcon}
            />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {totalCards}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.statLabel, { color: colors.textSecondary }]}
            >
              {t('hifz.reviewedCards', { defaultValue: 'Карточек' })}
            </Text>
          </View>

          {/* Vertical divider */}
          <View
            style={[
              styles.verticalDivider,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          />

          {/* Accuracy */}
          <View style={styles.statColumn}>
            <Ionicons
              name="trending-up-outline"
              size={20}
              color={colors.success}
              style={styles.statIcon}
            />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {`${accuracy}%`}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.statLabel, { color: colors.textSecondary }]}
            >
              {t('hifz.accuracy', { defaultValue: 'Точность' })}
            </Text>
          </View>

          {/* Vertical divider */}
          <View
            style={[
              styles.verticalDivider,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          />

          {/* Time spent */}
          <View style={styles.statColumn}>
            <Ionicons
              name="time-outline"
              size={20}
              color={colors.secondary}
              style={styles.statIcon}
            />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatTime(timeSpentSeconds)}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.statLabel, { color: colors.textSecondary }]}
            >
              {t('hifz.timeSpent', { defaultValue: 'Время' })}
            </Text>
          </View>
        </View>
      </GlassView>

      {/* Buttons */}
      <View style={[styles.buttonContainer, { marginTop: spacing.xl }]}>
        <AnimatedPressable
          onPress={onContinue}
          haptic="medium"
          accessibilityRole="button"
          accessibilityLabel={t('hifz.continue', { defaultValue: 'Продолжить' })}
          style={[
            styles.continueButton,
            {
              borderRadius: radius.md,
              backgroundColor: colors.primary,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <Ionicons
            name="checkmark-outline"
            size={20}
            color="#FFFFFF"
            style={styles.btnIcon}
          />
          <Text style={[styles.btnText, styles.primaryBtnText]}>
            {t('hifz.continue', { defaultValue: 'Продолжить' })}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={onRetry}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel={t('hifz.retry', { defaultValue: 'Повторить' })}
          style={[
            styles.retryButton,
            {
              borderRadius: radius.md,
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.16)'
                : 'rgba(0, 0, 0, 0.12)',
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(255, 255, 255, 0.85)',
            },
          ]}
        >
          <Ionicons
            name="refresh-outline"
            size={18}
            color={colors.text}
            style={styles.btnIcon}
          />
          <Text style={[styles.btnText, { color: colors.text }]}>
            {t('hifz.retry', { defaultValue: 'Повторить' })}
          </Text>
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  iconCircle: {
    padding: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  badgeIcon: {
    marginEnd: 6,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  statsCard: {
    width: '100%',
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statIcon: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 40,
  },
  buttonContainer: {
    width: '100%',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  btnIcon: {
    marginEnd: 8,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryBtnText: {
    color: '#FFFFFF',
  },
});
