import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components';

export interface QuizMatchProps {
  question: string;
  pairs: { left: string; right: string }[];
  onAnswer: (correct: boolean) => void;
}

interface ColumnItem {
  id: string;
  pairIndex: number;
  text: string;
}

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const shuffleArray = <T,>(array: T[]): T[] => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const QuizMatch: React.FC<QuizMatchProps> = ({
  question,
  pairs,
  onAnswer,
}) => {
  const { colors, fontFamilies, isDark } = useTheme();

  const [leftItems, setLeftItems] = useState<ColumnItem[]>([]);
  const [rightItems, setRightItems] = useState<ColumnItem[]>([]);
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [selectedRightId, setSelectedRightId] = useState<string | null>(null);
  const [matchedPairIndices, setMatchedPairIndices] = useState<Set<number>>(
    new Set()
  );
  const [wrongPair, setWrongPair] = useState<{
    leftId: string;
    rightId: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const wrongAttemptsRef = useRef(0);
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const left: ColumnItem[] = pairs.map((pair, index) => ({
      id: `left-${index}-${pair.left}`,
      pairIndex: index,
      text: pair.left,
    }));
    const right: ColumnItem[] = pairs.map((pair, index) => ({
      id: `right-${index}-${pair.right}`,
      pairIndex: index,
      text: pair.right,
    }));

    setLeftItems(shuffleArray(left));
    setRightItems(shuffleArray(right));
    setSelectedLeftId(null);
    setSelectedRightId(null);
    setMatchedPairIndices(new Set());
    setWrongPair(null);
    setIsChecking(false);
    wrongAttemptsRef.current = 0;

    if (wrongTimerRef.current) {
      clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = null;
    }
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
  }, [pairs]);

  useEffect(() => {
    return () => {
      if (wrongTimerRef.current) {
        clearTimeout(wrongTimerRef.current);
      }
      if (finishTimerRef.current) {
        clearTimeout(finishTimerRef.current);
      }
    };
  }, []);

  const evaluateMatch = useCallback(
    (leftId: string, rightId: string) => {
      const leftItem = leftItems.find((it) => it.id === leftId);
      const rightItem = rightItems.find((it) => it.id === rightId);
      if (!leftItem || !rightItem) return;

      const isMatch = leftItem.pairIndex === rightItem.pairIndex;

      if (isMatch) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const nextMatched = new Set(matchedPairIndices);
        nextMatched.add(leftItem.pairIndex);
        setMatchedPairIndices(nextMatched);
        setSelectedLeftId(null);
        setSelectedRightId(null);

        if (nextMatched.size === pairs.length) {
          setIsChecking(true);
          finishTimerRef.current = setTimeout(() => {
            const passed = wrongAttemptsRef.current <= 3;
            onAnswer(passed);
          }, 500);
        }
      } else {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        wrongAttemptsRef.current += 1;
        setWrongPair({ leftId, rightId });
        setIsChecking(true);

        wrongTimerRef.current = setTimeout(() => {
          setWrongPair(null);
          setSelectedLeftId(null);
          setSelectedRightId(null);
          setIsChecking(false);
        }, 300);
      }
    },
    [leftItems, rightItems, matchedPairIndices, pairs.length, onAnswer]
  );

  const handleLeftPress = useCallback(
    (item: ColumnItem) => {
      if (matchedPairIndices.has(item.pairIndex) || isChecking || wrongPair) {
        return;
      }

      if (selectedRightId) {
        setSelectedLeftId(item.id);
        evaluateMatch(item.id, selectedRightId);
      } else {
        if (selectedLeftId === item.id) {
          setSelectedLeftId(null);
        } else {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedLeftId(item.id);
        }
      }
    },
    [matchedPairIndices, isChecking, wrongPair, selectedRightId, selectedLeftId, evaluateMatch]
  );

  const handleRightPress = useCallback(
    (item: ColumnItem) => {
      if (matchedPairIndices.has(item.pairIndex) || isChecking || wrongPair) {
        return;
      }

      if (selectedLeftId) {
        setSelectedRightId(item.id);
        evaluateMatch(selectedLeftId, item.id);
      } else {
        if (selectedRightId === item.id) {
          setSelectedRightId(null);
        } else {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedRightId(item.id);
        }
      }
    },
    [matchedPairIndices, isChecking, wrongPair, selectedLeftId, selectedRightId, evaluateMatch]
  );

  const renderLeftItem = (item: ColumnItem, index: number) => {
    const isMatched = matchedPairIndices.has(item.pairIndex);
    const isSelected = selectedLeftId === item.id;
    const isWrong = wrongPair?.leftId === item.id;
    const isArabic = ARABIC_REGEX.test(item.text);

    let cardStyle = isDark ? styles.cardNeutralDark : styles.cardNeutralLight;
    if (isMatched) {
      cardStyle = styles.cardMatched;
    } else if (isWrong) {
      cardStyle = styles.cardWrong;
    } else if (isSelected) {
      cardStyle = styles.cardSelected;
    }

    return (
      <Animated.View
        key={item.id}
        entering={FadeIn.delay(index * 60).duration(250)}
        style={styles.itemWrapper}
      >
        <AnimatedPressable
          onPress={() => handleLeftPress(item)}
          disabled={isMatched || isChecking}
          haptic="none"
          style={[
            styles.card,
            { backgroundColor: colors.surface },
            isDark && !isMatched && !isSelected && !isWrong
              ? { borderColor: colors.border }
              : null,
            cardStyle,
          ]}
        >
          <Text
            style={[
              isArabic ? styles.arabicText : styles.regularText,
              {
                fontFamily: isArabic ? fontFamilies.arabic : fontFamilies.ui,
                color: colors.text,
              },
            ]}
            numberOfLines={2}
          >
            {item.text}
          </Text>

          {isMatched && (
            <View style={styles.checkmarkOverlay}>
              <Ionicons name="checkmark-circle" size={18} color="#0D6B4E" />
            </View>
          )}
        </AnimatedPressable>
      </Animated.View>
    );
  };

  const renderRightItem = (item: ColumnItem, index: number) => {
    const isMatched = matchedPairIndices.has(item.pairIndex);
    const isSelected = selectedRightId === item.id;
    const isWrong = wrongPair?.rightId === item.id;
    const isArabic = ARABIC_REGEX.test(item.text);

    let cardStyle = isDark ? styles.cardNeutralDark : styles.cardNeutralLight;
    if (isMatched) {
      cardStyle = styles.cardMatched;
    } else if (isWrong) {
      cardStyle = styles.cardWrong;
    } else if (isSelected) {
      cardStyle = styles.cardSelected;
    }

    return (
      <Animated.View
        key={item.id}
        entering={FadeIn.delay(index * 60).duration(250)}
        style={styles.itemWrapper}
      >
        <AnimatedPressable
          onPress={() => handleRightPress(item)}
          disabled={isMatched || isChecking}
          haptic="none"
          style={[
            styles.card,
            { backgroundColor: colors.surface },
            isDark && !isMatched && !isSelected && !isWrong
              ? { borderColor: colors.border }
              : null,
            cardStyle,
          ]}
        >
          <Text
            style={[
              isArabic ? styles.arabicText : styles.regularText,
              {
                fontFamily: isArabic ? fontFamilies.arabic : fontFamilies.ui,
                color: colors.text,
              },
            ]}
            numberOfLines={2}
          >
            {item.text}
          </Text>

          {isMatched && (
            <View style={styles.checkmarkOverlay}>
              <Ionicons name="checkmark-circle" size={18} color="#0D6B4E" />
            </View>
          )}
        </AnimatedPressable>
      </Animated.View>
    );
  };

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

      <View style={styles.columnsContainer}>
        <View style={styles.column}>{leftItems.map(renderLeftItem)}</View>
        <View style={styles.column}>{rightItems.map(renderRightItem)}</View>
      </View>
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
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  itemWrapper: {
    width: '100%',
    marginBottom: 10,
  },
  card: {
    height: 72,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
  cardNeutralLight: {
    borderWidth: 0,
  },
  cardNeutralDark: {
    borderWidth: 1,
  },
  cardSelected: {
    backgroundColor: 'rgba(13, 107, 78, 0.12)',
    borderColor: '#0D6B4E',
    borderWidth: 2,
  },
  cardWrong: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderColor: '#E74C3C',
    borderWidth: 2,
  },
  cardMatched: {
    backgroundColor: 'rgba(13, 107, 78, 0.12)',
    borderColor: '#0D6B4E',
    borderWidth: 1.5,
    opacity: 0.45,
  },
  regularText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  arabicText: {
    fontSize: 32,
    textAlign: 'center',
    lineHeight: 40,
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
    }),
  },
  checkmarkOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
});
