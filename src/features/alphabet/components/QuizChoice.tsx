import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components';

export interface QuizChoiceProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  onAnswer: (correct: boolean) => void;
}

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export const QuizChoice: React.FC<QuizChoiceProps> = ({
  question,
  options,
  correctIndex,
  explanation,
  onAnswer,
}) => {
  const { colors, fontFamilies, isDark } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSelectedIndex(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [question, options, correctIndex]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleSelect = (index: number) => {
    if (selectedIndex !== null) return;

    setSelectedIndex(index);
    const isCorrect = index === correctIndex;

    if (isCorrect) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    timerRef.current = setTimeout(() => {
      onAnswer(isCorrect);
    }, 1500);
  };

  const isAnswered = selectedIndex !== null;

  // If options are short (e.g. single letters or <= 4 chars), display as 2-column grid
  const isShortOptions = useMemo(() => {
    return options.length >= 2 && options.every((opt) => opt.trim().length <= 4);
  }, [options]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
    >
      <Text style={[styles.questionText, { color: colors.text }]}>
        {question}
      </Text>

      <View style={isShortOptions ? styles.optionsGrid : styles.optionsList}>
        {options.map((option, index) => {
          const isArabic = ARABIC_REGEX.test(option);
          const isSelected = selectedIndex === index;
          const isCorrect = index === correctIndex;

          let cardStateStyle = isDark ? styles.cardNeutralDark : styles.cardNeutralLight;
          let showCheck = false;
          let showCross = false;

          if (isAnswered) {
            if (isSelected) {
              if (isCorrect) {
                cardStateStyle = styles.cardCorrect;
                showCheck = true;
              } else {
                cardStateStyle = styles.cardWrong;
                showCross = true;
              }
            } else if (isCorrect) {
              // Highlight correct option in green when wrong answer was selected
              cardStateStyle = styles.cardCorrect;
              showCheck = true;
            } else {
              cardStateStyle = styles.cardDimmed;
            }
          }

          return (
            <Animated.View
              key={`${index}-${option}`}
              entering={FadeInRight.delay(index * 80).duration(300)}
              style={isShortOptions ? styles.optionWrapperGrid : styles.optionWrapper}
            >
              <AnimatedPressable
                onPress={() => handleSelect(index)}
                disabled={isAnswered}
                haptic="none"
                style={[
                  isShortOptions ? styles.optionCardGrid : styles.optionCard,
                  { backgroundColor: colors.surface },
                  isDark && !isAnswered ? { borderColor: colors.border } : null,
                  cardStateStyle,
                ]}
              >
                <Text
                  style={[
                    isArabic
                      ? isShortOptions
                        ? styles.arabicTextGrid
                        : styles.arabicText
                      : isShortOptions
                      ? styles.regularTextGrid
                      : styles.regularText,
                    {
                      fontFamily: isArabic ? fontFamilies.arabic : fontFamilies.ui,
                      color: colors.text,
                    },
                  ]}
                >
                  {option}
                </Text>

                {showCheck && (
                  <View style={isShortOptions ? styles.iconContainerGrid : styles.iconContainer}>
                    <Text style={styles.statusEmoji}>✅</Text>
                  </View>
                )}

                {showCross && (
                  <View style={isShortOptions ? styles.iconContainerGrid : styles.iconContainer}>
                    <Text style={styles.statusEmoji}>❌</Text>
                  </View>
                )}
              </AnimatedPressable>
            </Animated.View>
          );
        })}
      </View>

      {isAnswered && explanation ? (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[
            styles.explanationContainer,
            {
              backgroundColor: isDark ? colors.surface : 'rgba(13, 107, 78, 0.08)',
              borderColor: isDark ? colors.border : 'rgba(13, 107, 78, 0.2)',
            },
          ]}
        >
          <View style={styles.explanationHeader}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
              style={styles.explanationIcon}
            />
            <Text style={[styles.explanationText, { color: colors.text }]}>
              {explanation}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 24,
    letterSpacing: 0.1,
  },
  optionsList: {
    width: '100%',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  optionWrapper: {
    width: '100%',
    marginBottom: 12,
  },
  optionWrapperGrid: {
    width: '48%',
    marginBottom: 14,
  },
  optionCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    minHeight: 58,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  optionCardGrid: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 20,
    minHeight: 110,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  cardNeutralLight: {
    borderWidth: 0,
  },
  cardNeutralDark: {
    borderWidth: 1,
  },
  cardCorrect: {
    backgroundColor: 'rgba(13, 107, 78, 0.15)',
    borderColor: '#0D6B4E',
    borderWidth: 2,
  },
  cardWrong: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderColor: '#E74C3C',
    borderWidth: 2,
  },
  cardDimmed: {
    opacity: 0.5,
    borderWidth: 0,
  },
  regularText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  regularTextGrid: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  arabicText: {
    fontSize: 34,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  arabicTextGrid: {
    fontSize: 52,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 64,
  },
  iconContainer: {
    position: 'absolute',
    right: 16,
  },
  iconContainerGrid: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  statusEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  explanationContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 18,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  explanationIcon: {
    marginTop: 1,
  },
  explanationText: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 22,
    writingDirection: 'ltr',
    textAlign: 'left',
  },
});
