import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components';

export interface WordByWordDisplayProps {
  arabicText: string;
  revealedCount: number;
  totalRevealed?: boolean;
  onWordTap?: (index: number) => void;
  fontSize?: number;
}

export const WordByWordDisplay: React.FC<WordByWordDisplayProps> = ({
  arabicText,
  revealedCount,
  totalRevealed = false,
  onWordTap,
  fontSize = 28,
}) => {
  const { colors, radius, isDark } = useTheme();
  const { t } = useTranslation();

  const lineHeight = Math.round(fontSize * 2.2);

  const words = useMemo(() => {
    if (!arabicText) return [];
    return arabicText.trim().split(/\s+/).filter(Boolean);
  }, [arabicText]);

  return (
    <View style={styles.container}>
      {words.map((word, index) => {
        const isVisible = totalRevealed || index < revealedCount;

        if (isVisible) {
          return (
            <Animated.View
              key={`word-${index}-${word}`}
              entering={FadeIn.duration(250)}
              style={styles.wordWrapper}
            >
              <Text
                style={[
                  styles.arabicText,
                  {
                    fontSize,
                    lineHeight,
                    color: colors.text,
                    fontFamily: undefined,
                  },
                ]}
              >
                {word}
              </Text>
            </Animated.View>
          );
        }

        return (
          <AnimatedPressable
            key={`word-${index}-hidden`}
            onPress={() => onWordTap?.(index)}
            accessibilityRole="button"
            accessibilityLabel={t('hifz.hiddenWordIndex', {
              defaultValue: `Скрытое слово ${index + 1}`,
              index: index + 1,
            })}
            style={[
              styles.wordWrapper,
              styles.hiddenWordButton,
              {
                borderRadius: radius.sm,
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(0, 0, 0, 0.08)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.16)'
                  : 'rgba(0, 0, 0, 0.10)',
              },
            ]}
          >
            {/* Invisible text preserving exact Arabic word dimensions */}
            <Text
              aria-hidden
              style={[
                styles.arabicText,
                styles.invisiblePlaceholder,
                {
                  fontSize,
                  lineHeight,
                  fontFamily: undefined,
                },
              ]}
            >
              {word}
            </Text>

            {/* Hidden block mask */}
            <View
              style={[
                StyleSheet.absoluteFill,
                styles.hiddenMask,
                { borderRadius: radius.sm },
              ]}
            >
              <Text
                style={[
                  styles.dotsPlaceholder,
                  {
                    color: isDark
                      ? 'rgba(255, 255, 255, 0.35)'
                      : 'rgba(0, 0, 0, 0.30)',
                    fontSize: Math.round(fontSize * 0.55),
                  },
                ]}
              >
                ••••
              </Text>
            </View>
          </AnimatedPressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  wordWrapper: {
    marginStart: 4,
    marginEnd: 4,
    marginVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arabicText: {
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  hiddenWordButton: {
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  invisiblePlaceholder: {
    opacity: 0,
  },
  hiddenMask: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsPlaceholder: {
    letterSpacing: 2,
    fontWeight: '700',
  },
});
