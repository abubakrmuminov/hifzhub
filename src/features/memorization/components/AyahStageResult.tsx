import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable, GlassView } from '@/shared/components';
import type { ReviewRating } from '../types';

export interface AyahStageResultProps {
  totalMistakes: number;
  surahName?: string;
  ayahNumber?: number;
  onNextAyah: (rating: ReviewRating) => void;
}

export const AyahStageResult: React.FC<AyahStageResultProps> = ({
  totalMistakes,
  surahName,
  ayahNumber,
  onNextAyah,
}) => {
  const { colors, spacing, radius, isDark } = useTheme();
  const { t } = useTranslation();

  // Determine feedback tier based on actual performance
  let rating: ReviewRating = 'easy';
  let title = t('hifz.resultPerfect', { defaultValue: 'Идеально! Без единой ошибки 🌟' });
  let subtitle = t('hifz.resultPerfectDesc', {
    defaultValue: 'Аят прочно закрепился в памяти! Зачислен в выученные.',
  });
  let xp = 15;
  let iconName: keyof typeof Ionicons.glyphMap = 'sparkles';
  let badgeColor = colors.success;

  if (totalMistakes === 1) {
    rating = 'good';
    title = t('hifz.resultGood', { defaultValue: 'Хорошо! Почти без запинки 👍' });
    subtitle = t('hifz.resultGoodDesc', {
      defaultValue: 'Была всего 1 неточность. Отличный результат!',
    });
    xp = 10;
    iconName = 'checkmark-circle';
    badgeColor = colors.primary;
  } else if (totalMistakes === 2) {
    rating = 'hard';
    title = t('hifz.resultHard', { defaultValue: 'Трудно! Нужно закрепить ⚠️' });
    subtitle = t('hifz.resultHardDesc', {
      defaultValue: 'Было 2 ошибки. Система запланирует повторение на завтра.',
    });
    xp = 5;
    iconName = 'alert-circle';
    badgeColor = colors.warning;
  } else if (totalMistakes >= 3) {
    rating = 'again';
    title = t('hifz.resultAgain', { defaultValue: 'Нужно повторить ещё раз 🔄' });
    subtitle = t('hifz.resultAgainDesc', {
      defaultValue: 'Память пока не зафиксировала аят. Потренируемся ещё.',
    });
    xp = 2;
    iconName = 'refresh-circle';
    badgeColor = colors.error;
  }

  const handleNext = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNextAyah(rating);
  };

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.container}>
      <GlassView
        borderRadius={radius.xl}
        style={[
          styles.card,
          {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)',
            padding: spacing.xl,
          },
        ]}
      >
        {/* Status Icon */}
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: `${badgeColor}20`,
              borderColor: badgeColor,
            },
          ]}
        >
          <Ionicons name={iconName} size={48} color={badgeColor} />
        </View>

        {/* Title & Subtitle */}
        <Text style={[styles.title, { color: colors.text, marginTop: spacing.md }]}>
          {title}
        </Text>

        <Text
          style={[
            styles.subtitle,
            { color: colors.textSecondary, marginTop: spacing.xs },
          ]}
        >
          {subtitle}
        </Text>

        {/* XP Badge */}
        <View
          style={[
            styles.xpBadge,
            {
              backgroundColor: isDark
                ? 'rgba(212, 167, 69, 0.20)'
                : 'rgba(212, 167, 69, 0.15)',
              borderColor: colors.secondary,
              marginTop: spacing.lg,
            },
          ]}
        >
          <Ionicons name="flash" size={16} color={colors.secondary} />
          <Text style={[styles.xpText, { color: colors.secondary, marginStart: 4 }]}>
            +{xp} XP
          </Text>
        </View>

        {/* Ayah Reference */}
        {Boolean(surahName) && (
          <Text
            style={[
              styles.referenceText,
              { color: colors.textTertiary, marginTop: spacing.sm },
            ]}
          >
            {surahName} • {ayahNumber}
          </Text>
        )}
      </GlassView>

      {/* Continue Button */}
      <View style={[styles.buttonContainer, { marginTop: spacing.xl }]}>
        <AnimatedPressable
          onPress={handleNext}
          style={[
            styles.continueBtn,
            { backgroundColor: colors.primary, borderRadius: radius.md },
          ]}
        >
          <Text style={styles.continueBtnText}>
            {t('hifz.nextAyah', { defaultValue: 'Следующий аят ➔' })}
          </Text>
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '700',
  },
  referenceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
  },
  continueBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D6B4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
