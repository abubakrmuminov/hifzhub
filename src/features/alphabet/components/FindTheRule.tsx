import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';

export interface FindTheRuleProps {
  instruction: string;
  items: string[];
  correctIndices: number[];
  targetRule: string;
  explanation: string;
  onAnswer: (correct: boolean) => void;
}

export const FindTheRule: React.FC<FindTheRuleProps> = ({
  instruction,
  items,
  correctIndices,
  targetRule,
  explanation,
  onAnswer,
}) => {
  const { t } = useTranslation();
  const { isDark, colors, spacing, radius, fontFamilies } = useTheme();

  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Determine if items are single Arabic letters (with or without diacritics)
  const isSingleLetterGrid = useMemo(() => {
    if (items.length === 0) return false;
    return items.every((item) => {
      // Strip Arabic harakat/diacritics, tatweel, and whitespace
      const stripped = item.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640\s]/g, '');
      return stripped.length <= 1;
    });
  }, [items]);

  const handleToggleSelect = (index: number) => {
    if (isAnswered) return;

    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleCheck = () => {
    if (isAnswered || selectedIndices.length === 0) return;

    // Check: all correct items selected AND no extra incorrect items selected
    const selectedSorted = [...selectedIndices].sort((a, b) => a - b);
    const correctSorted = [...correctIndices].sort((a, b) => a - b);

    const isSuccess =
      selectedSorted.length === correctSorted.length &&
      selectedSorted.every((val, idx) => val === correctSorted[idx]);

    setIsAnswered(true);
    setIsCorrect(isSuccess);

    if (isSuccess) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      timerRef.current = setTimeout(() => {
        onAnswer(true);
      }, 1500);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      timerRef.current = setTimeout(() => {
        onAnswer(false);
      }, 2000);
    }
  };

  const containerBgColor = isDark ? '#0F0F1A' : '#F5F7F6';

  return (
    <View style={[styles.container, { backgroundColor: containerBgColor }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Section: Instruction & Target Rule */}
        <View style={styles.header}>
        <Text style={[styles.instruction, { color: colors.text }]}>
          {instruction}
        </Text>

        <View
          style={[
            styles.rulePill,
            {
              backgroundColor: isDark
                ? 'rgba(212, 167, 69, 0.2)'
                : 'rgba(212, 167, 69, 0.15)',
              borderColor: colors.secondary,
              borderRadius: radius.full,
            },
          ]}
        >
          <Text
            style={[
              styles.rulePillText,
              { color: isDark ? '#E4BF6A' : '#9A6B0A' },
            ]}
          >
            {targetRule}
          </Text>
        </View>
      </View>

      {/* Grid of Items */}
      <View style={styles.grid}>
        {items.map((item, index) => {
          const isSelected = selectedIndices.includes(index);
          const isCorrectIndex = correctIndices.includes(index);
          const isArabic = /[\u0600-\u06FF]/.test(item);

          let borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent';
          let backgroundColor = isDark ? '#1A1A2E' : '#FFFFFF';
          let badgeIcon: 'check' | 'x' | null = null;
          let badgeColor = colors.success;

          if (isAnswered) {
            if (isCorrectIndex) {
              // Highlight correct ones in green
              borderColor = colors.success;
              backgroundColor = isDark
                ? 'rgba(39, 174, 96, 0.25)'
                : 'rgba(39, 174, 96, 0.12)';
              badgeIcon = 'check';
              badgeColor = colors.success;
            } else if (isSelected) {
              // Highlight wrong selected ones in red
              borderColor = colors.error;
              backgroundColor = isDark
                ? 'rgba(231, 76, 60, 0.25)'
                : 'rgba(231, 76, 60, 0.12)';
              badgeIcon = 'x';
              badgeColor = colors.error;
            }
          } else if (isSelected) {
            // Selected state before answer
            borderColor = colors.primary;
            backgroundColor = isDark
              ? 'rgba(13, 107, 78, 0.25)'
              : 'rgba(13, 107, 78, 0.08)';
          }

          const cardWidthStyle = isSingleLetterGrid
            ? styles.cardSingleLetter
            : styles.cardWord;

          return (
            <AnimatedPressable
              key={`${item}-${index}`}
              onPress={() => handleToggleSelect(index)}
              disabled={isAnswered}
              haptic="light"
              style={[
                styles.cardBase,
                cardWidthStyle,
                {
                  backgroundColor,
                  borderColor,
                  borderRadius: radius.md,
                },
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ selected: isSelected, disabled: isAnswered }}
              accessibilityLabel={item}
            >
              {/* Optional Status Badge when answered */}
              {badgeIcon && (
                <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                  <Feather name={badgeIcon} size={11} color="#FFFFFF" />
                </View>
              )}

              <Text
                style={[
                  styles.cardText,
                  isArabic && {
                    fontFamily: fontFamilies.arabic,
                    fontSize: isSingleLetterGrid ? 28 : 24,
                    lineHeight: isSingleLetterGrid ? 48 : 40,
                    writingDirection: 'rtl',
                    textAlign: 'center',
                    ...Platform.select({
                      android: {
                        includeFontPadding: true,
                      },
                    }),
                  },
                  { color: colors.text },
                ]}
              >
                {item}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      {/* Explanation Banner */}
      {isAnswered && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[
            styles.explanationCard,
            {
              backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF',
              borderLeftColor: isCorrect ? colors.success : colors.error,
              borderRadius: radius.md,
            },
          ]}
        >
          <View style={styles.explanationHeader}>
            <Feather
              name={isCorrect ? 'check-circle' : 'alert-circle'}
              size={18}
              color={isCorrect ? colors.success : colors.error}
            />
            <Text
              style={[
                styles.explanationTitle,
                { color: isCorrect ? colors.success : colors.error },
              ]}
            >
              {isCorrect
                ? t('learn.correct', { defaultValue: 'Правильно!' })
                : t('learn.attention', { defaultValue: 'Обратите внимание' })}
            </Text>
          </View>
          <Text style={[styles.explanationBody, { color: colors.textSecondary }]}>
            {explanation}
          </Text>
        </Animated.View>
      )}
      </ScrollView>

      {/* Check Button Footer */}
      <View style={[styles.footer, { backgroundColor: containerBgColor }]}>
        <AnimatedPressable
          onPress={handleCheck}
          disabled={isAnswered || selectedIndices.length === 0}
          haptic="medium"
          style={[
            styles.checkButton,
            {
              backgroundColor: colors.primary,
              borderRadius: radius.md ?? 16,
              opacity: isAnswered || selectedIndices.length === 0 ? 0.5 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('learn.checkAnswer', { defaultValue: 'Проверить' })}
        >
          <Text style={styles.checkButtonText}>{t('learn.checkAnswer', { defaultValue: 'Проверить' })}</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  instruction: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
  },
  rulePill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
  },
  rulePillText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 24,
  },
  cardBase: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardSingleLetter: {
    width: '22%',
    aspectRatio: 1,
    minHeight: 74,
    paddingVertical: 4,
  },
  cardWord: {
    width: '47.5%',
    minHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  cardText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  explanationCard: {
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 24,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  explanationTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  explanationBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  checkButton: {
    width: '100%',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
