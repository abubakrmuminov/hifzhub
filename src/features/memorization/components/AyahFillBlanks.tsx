import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable, GlassView } from '@/shared/components';
import { cleanArabicWords } from './AyahWordScramble';

export interface AyahFillBlanksProps {
  arabicText: string;
  surahName?: string;
  ayahNumber?: number;
  onComplete: (mistakesCount: number) => void;
}

const COMMON_QURAN_DISTRACTORS = [
  'ٱللَّهِ',
  'ٱلرَّحْمَٰنِ',
  'ٱلرَّحِيمِ',
  'عَلِيمٌ',
  'حَكِيمٌ',
  'غَفُورٌ',
  'قَدِيرٌ',
  'ٱلصَّلَوٰةَ',
  'ءَامَنُوا۟',
  'رَّبِّهِمْ',
  'ٱلْأَرْضِ',
  'ٱلسَّمَٰوَٰتِ',
];

export const AyahFillBlanks: React.FC<AyahFillBlanksProps> = ({
  arabicText,
  surahName,
  ayahNumber,
  onComplete,
}) => {
  const { colors, spacing, radius, isDark } = useTheme();
  const { t } = useTranslation();

  const words = useMemo(() => cleanArabicWords(arabicText), [arabicText]);

  // Choose 1 or 2 indices to hide
  const blankIndices = useMemo<number[]>(() => {
    if (words.length <= 2) return [words.length - 1];
    if (words.length <= 4) return [Math.floor(words.length / 2)];
    // For longer ayahs, choose 2 blanks
    const first = 1;
    const second = Math.min(words.length - 1, Math.floor(words.length * 0.7));
    return [first, second];
  }, [words]);

  const [currentBlankStep, setCurrentBlankStep] = useState(0);
  const [filledIndices, setFilledIndices] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [shakingOption, setShakingOption] = useState<string | null>(null);

  const activeTargetIndex = blankIndices[currentBlankStep];
  const targetWord = words[activeTargetIndex] || '';

  // Generate 4 options (1 correct + 3 distractors)
  const options = useMemo(() => {
    if (!targetWord) return [];

    const otherWordsInAyah = words.filter((_, idx) => idx !== activeTargetIndex);
    const pool = [...otherWordsInAyah, ...COMMON_QURAN_DISTRACTORS].filter(
      (w) => w !== targetWord
    );

    // Shuffle pool and pick 3 unique distractors
    const shuffledPool = [...new Set(pool)].sort(() => Math.random() - 0.5);
    const distractors = shuffledPool.slice(0, 3);

    // Combine correct word + distractors and shuffle
    return [targetWord, ...distractors].sort(() => Math.random() - 0.5);
  }, [targetWord, words, activeTargetIndex]);

  const shakeTranslateX = useSharedValue(0);

  const triggerShake = useCallback(() => {
    shakeTranslateX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, [shakeTranslateX]);

  const animatedShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeTranslateX.value }],
  }));

  const handleOptionPress = useCallback(
    (option: string) => {
      if (option === targetWord) {
        // Correct option!
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const nextFilled = [...filledIndices, activeTargetIndex];
        setFilledIndices(nextFilled);

        if (currentBlankStep + 1 < blankIndices.length) {
          // Move to next blank
          setCurrentBlankStep((prev) => prev + 1);
        } else {
          // Finished all blanks in this ayah!
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => {
            onComplete(mistakes);
          }, 600);
        }
      } else {
        // Wrong option!
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setMistakes((prev) => prev + 1);
        setShakingOption(option);
        triggerShake();
        setTimeout(() => setShakingOption(null), 400);
      }
    },
    [targetWord, filledIndices, activeTargetIndex, currentBlankStep, blankIndices.length, mistakes, triggerShake, onComplete]
  );

  const isAllFilled = filledIndices.length === blankIndices.length;

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={[styles.headerRow, { marginBottom: spacing.sm }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.stepBadge, { backgroundColor: `${colors.secondary}25` }]}>
            <Ionicons name="help-circle-outline" size={14} color={colors.secondary} />
            <Text style={[styles.stepBadgeText, { color: colors.secondary, marginStart: 4 }]}>
              {t('hifz.step3Title', { defaultValue: 'Шаг 3: Заполни пропуск' })}
            </Text>
          </View>
        </View>

        {Boolean(surahName) && (
          <Text style={[styles.surahBadge, { color: colors.textSecondary }]}>
            {surahName} {ayahNumber ? `• ${ayahNumber}` : ''}
          </Text>
        )}
      </View>

      <Text style={[styles.instruction, { color: colors.text, marginBottom: spacing.md }]}>
        {t('hifz.blanksInstruction', { defaultValue: 'Какое слово пропущено в аяте?' })}
      </Text>

      {/* Ayah Display with Blank Slot */}
      <GlassView
        borderRadius={radius.lg}
        style={[
          styles.cardContainer,
          {
            borderColor: isAllFilled
              ? colors.success
              : isDark
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(0, 0, 0, 0.08)',
            backgroundColor: isAllFilled
              ? isDark
                ? 'rgba(39, 174, 96, 0.15)'
                : 'rgba(39, 174, 96, 0.08)'
              : isDark
              ? 'rgba(255, 255, 255, 0.04)'
              : 'rgba(255, 255, 255, 0.90)',
          },
        ]}
      >
        <View style={styles.ayahTextRow}>
          {words.map((word, idx) => {
            const isBlank = blankIndices.includes(idx);
            const isFilled = filledIndices.includes(idx);
            const isCurrent = idx === activeTargetIndex;

            if (!isBlank) {
              return (
                <Text key={idx} style={[styles.arabicText, { color: colors.text }]}>
                  {word}{' '}
                </Text>
              );
            }

            if (isFilled) {
              return (
                <Animated.View
                  key={idx}
                  entering={FadeIn.duration(250)}
                  style={[
                    styles.filledChip,
                    {
                      backgroundColor: isDark
                        ? 'rgba(39, 174, 96, 0.25)'
                        : 'rgba(39, 174, 96, 0.15)',
                      borderColor: colors.success,
                    },
                  ]}
                >
                  <Text style={[styles.arabicText, { color: colors.success, fontWeight: '700' }]}>
                    {word}
                  </Text>
                </Animated.View>
              );
            }

            // Empty Slot [ ? ]
            return (
              <View
                key={idx}
                style={[
                  styles.slotChip,
                  {
                    borderColor: isCurrent ? colors.secondary : colors.textTertiary,
                    backgroundColor: isCurrent
                      ? isDark
                        ? 'rgba(212, 167, 69, 0.20)'
                        : 'rgba(212, 167, 69, 0.15)'
                      : 'rgba(150, 150, 150, 0.1)',
                  },
                ]}
              >
                <Text style={[styles.slotQuestionMark, { color: colors.secondary }]}>
                  ؟
                </Text>
              </View>
            );
          })}
        </View>

        {/* Mistakes indicator */}
        {mistakes > 0 && (
          <View style={styles.mistakesIndicator}>
            <Text style={[styles.mistakesText, { color: colors.error }]}>
              {mistakes} {t('hifz.mistakesCount', { defaultValue: 'ошибок' })}
            </Text>
          </View>
        )}
      </GlassView>

      {/* Options Bank */}
      <View style={[styles.optionsSection, { marginTop: spacing.xl }]}>
        <Text style={[styles.optionsLabel, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
          {t('hifz.chooseCorrectWord', { defaultValue: 'Выберите правильное слово:' })}
        </Text>

        <View style={styles.optionsGrid}>
          {options.map((option, index) => {
            const isShaking = shakingOption === option;

            return (
              <Animated.View
                key={`${option}_${index}`}
                style={[styles.optionWrapper, isShaking && animatedShakeStyle]}
              >
                <AnimatedPressable
                  onPress={() => handleOptionPress(option)}
                  disabled={isAllFilled}
                  style={[
                    styles.optionBtn,
                    {
                      borderRadius: radius.md,
                      backgroundColor: isShaking
                        ? isDark
                          ? 'rgba(231, 76, 60, 0.3)'
                          : 'rgba(231, 76, 60, 0.15)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(255, 255, 255, 0.90)',
                      borderColor: isShaking
                        ? colors.error
                        : isDark
                        ? 'rgba(255, 255, 255, 0.15)'
                        : 'rgba(0, 0, 0, 0.10)',
                    },
                  ]}
                >
                  <Text style={[styles.optionArabicText, { color: colors.text }]}>
                    {option}
                  </Text>
                </AnimatedPressable>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  surahBadge: {
    fontSize: 13,
    fontWeight: '600',
  },
  instruction: {
    fontSize: 15,
    fontWeight: '500',
  },
  cardContainer: {
    padding: 18,
    borderWidth: 1.5,
    minHeight: 120,
    justifyContent: 'center',
  },
  ayahTextRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 6,
  },
  arabicText: {
    fontSize: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 40,
  },
  filledChip: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  slotChip: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    minWidth: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotQuestionMark: {
    fontSize: 20,
    fontWeight: '800',
  },
  mistakesIndicator: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  mistakesText: {
    fontSize: 12,
    fontWeight: '600',
  },
  optionsSection: {
    width: '100%',
  },
  optionsLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  optionWrapper: {
    width: '48%',
  },
  optionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionArabicText: {
    fontSize: 22,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
