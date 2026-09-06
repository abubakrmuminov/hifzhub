import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable, GlassView } from '@/shared/components';

export interface AyahWordScrambleProps {
  arabicText: string;
  surahName?: string;
  ayahNumber?: number;
  onComplete: (mistakesCount: number) => void;
  onSkip?: () => void;
}

interface WordTile {
  id: string;
  word: string;
  originalIndex: number;
}

// Clean arabic text from end of ayah symbols (۝, numbers)
export const cleanArabicWords = (text: string): string[] => {
  return text
    .trim()
    .replace(/[\u06DD\u06DE\u06DF\u06E0\u06E1\u06E2\u06E3\u06E4\u06E5\u06E6\u06E7\u06E8\u06E9\u06EA\u06EB\u06EC\u06ED]/g, '')
    .replace(/[0-9\u0660-\u0669]/g, '')
    .split(/\s+/)
    .filter((w) => w.trim().length > 0);
};

export const AyahWordScramble: React.FC<AyahWordScrambleProps> = ({
  arabicText,
  surahName,
  ayahNumber,
  onComplete,
  onSkip,
}) => {
  const { colors, spacing, radius, isDark } = useTheme();
  const { t } = useTranslation();

  const originalWords = useMemo(() => cleanArabicWords(arabicText), [arabicText]);

  // Initial shuffled word tiles
  const initialTiles = useMemo<WordTile[]>(() => {
    const tiles: WordTile[] = originalWords.map((word, index) => ({
      id: `${word}_${index}`,
      word,
      originalIndex: index,
    }));
    // Fisher-Yates shuffle (ensuring it doesn't match original if length > 1)
    const shuffled = [...tiles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [originalWords]);

  const [assembled, setAssembled] = useState<WordTile[]>([]);
  const [available, setAvailable] = useState<WordTile[]>(initialTiles);
  const [mistakes, setMistakes] = useState(0);
  const [shakingTileId, setShakingTileId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

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

  const handleTilePress = useCallback(
    (tile: WordTile) => {
      const nextExpectedIndex = assembled.length;

      if (tile.originalIndex === nextExpectedIndex) {
        // Correct next word!
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const nextAssembled = [...assembled, tile];
        setAssembled(nextAssembled);
        setAvailable((prev) => prev.filter((t) => t.id !== tile.id));

        if (nextAssembled.length === originalWords.length) {
          // Completed the entire ayah!
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setIsCompleted(true);
        }
      } else {
        // Wrong tile tapped!
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setMistakes((prev) => prev + 1);
        setShakingTileId(tile.id);
        triggerShake();
        setTimeout(() => setShakingTileId(null), 400);
      }
    },
    [assembled, originalWords.length, triggerShake]
  );

  const handleUndo = useCallback(() => {
    if (assembled.length === 0 || isCompleted) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const lastTile = assembled[assembled.length - 1];
    setAssembled((prev) => prev.slice(0, prev.length - 1));
    setAvailable((prev) => [...prev, lastTile]);
  }, [assembled, isCompleted]);

  const handleReset = useCallback(() => {
    if (assembled.length === 0 || isCompleted) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAssembled([]);
    setAvailable(initialTiles);
  }, [assembled.length, initialTiles, isCompleted]);

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={[styles.headerRow, { marginBottom: spacing.sm }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.stepBadge, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="construct-outline" size={14} color={colors.primary} />
            <Text style={[styles.stepBadgeText, { color: colors.primary, marginStart: 4 }]}>
              {t('hifz.step2Title', { defaultValue: 'Шаг 2: Конструктор аята' })}
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
        {t('hifz.scrambleInstruction', { defaultValue: 'Соберите аят из слов по памяти:' })}
      </Text>

      {/* Target Assembled Area */}
      <GlassView
        borderRadius={radius.lg}
        style={[
          styles.assembledArea,
          {
            minHeight: 120,
            borderColor: isCompleted
              ? colors.success
              : isDark
              ? 'rgba(255, 255, 255, 0.12)'
              : 'rgba(0, 0, 0, 0.08)',
            backgroundColor: isCompleted
              ? isDark
                ? 'rgba(39, 174, 96, 0.15)'
                : 'rgba(39, 174, 96, 0.08)'
              : isDark
              ? 'rgba(255, 255, 255, 0.04)'
              : 'rgba(0, 0, 0, 0.02)',
          },
        ]}
      >
        <View style={styles.assembledWordsContainer}>
          {assembled.length === 0 ? (
            <Text style={[styles.emptyPlaceholder, { color: colors.textTertiary }]}>
              {t('hifz.tapWordsHint', { defaultValue: 'Нажимайте на слова внизу по порядку...' })}
            </Text>
          ) : (
            assembled.map((tile) => (
              <Animated.View
                key={tile.id}
                entering={FadeIn.duration(200)}
                style={[
                  styles.placedWordChip,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(255, 255, 255, 0.90)',
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text style={[styles.arabicWordText, { color: colors.text }]}>
                  {tile.word}
                </Text>
              </Animated.View>
            ))
          )}
        </View>

        {/* Action Controls for Assembled Area */}
        <View style={styles.assembledControls}>
          <View style={styles.mistakesIndicator}>
            {mistakes > 0 && (
              <Text style={[styles.mistakesText, { color: colors.error }]}>
                {mistakes} {t('hifz.mistakesCount', { defaultValue: 'ошибок' })}
              </Text>
            )}
          </View>

          {!isCompleted && assembled.length > 0 && (
            <View style={styles.buttonsRow}>
              <AnimatedPressable onPress={handleUndo} style={styles.actionIconBtn}>
                <Ionicons name="arrow-undo-outline" size={18} color={colors.textSecondary} />
              </AnimatedPressable>
              <AnimatedPressable onPress={handleReset} style={styles.actionIconBtn}>
                <Ionicons name="refresh-outline" size={18} color={colors.textSecondary} />
              </AnimatedPressable>
            </View>
          )}
        </View>
      </GlassView>

      {/* Available Word Tiles (Shuffled Bank) */}
      <View style={[styles.bankSection, { marginTop: spacing.lg }]}>
        <Text style={[styles.bankLabel, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
          {isCompleted
            ? t('hifz.ayahAssembledSuccess', { defaultValue: 'Аят успешно собран! 🎉' })
            : t('hifz.availableWords', { defaultValue: 'Слова для выбора:' })}
        </Text>

        {!isCompleted ? (
          <View style={styles.tilesBank}>
            {available.map((tile) => {
              const isShaking = shakingTileId === tile.id;
              return (
                <Animated.View
                  key={tile.id}
                  style={[
                    styles.tileWrapper,
                    isShaking && animatedShakeStyle,
                  ]}
                >
                  <AnimatedPressable
                    onPress={() => handleTilePress(tile)}
                    style={[
                      styles.wordTileBtn,
                      {
                        borderRadius: radius.md,
                        backgroundColor: isShaking
                          ? isDark
                            ? 'rgba(231, 76, 60, 0.3)'
                            : 'rgba(231, 76, 60, 0.15)'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(255, 255, 255, 0.85)',
                        borderColor: isShaking
                          ? colors.error
                          : isDark
                          ? 'rgba(255, 255, 255, 0.15)'
                          : 'rgba(0, 0, 0, 0.10)',
                      },
                    ]}
                  >
                    <Text style={[styles.tileArabicText, { color: colors.text }]}>
                      {tile.word}
                    </Text>
                  </AnimatedPressable>
                </Animated.View>
              );
            })}
          </View>
        ) : (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.successActionsRow}>
            <AnimatedPressable
              onPress={() => onComplete(mistakes)}
              style={[
                styles.continueBtn,
                { backgroundColor: colors.primary, borderRadius: radius.md },
              ]}
            >
              <Text style={styles.continueBtnText}>
                {t('hifz.nextStep', { defaultValue: 'Далее: проверка пропусков ➔' })}
              </Text>
            </AnimatedPressable>
          </Animated.View>
        )}
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
  assembledArea: {
    padding: 14,
    borderWidth: 1.5,
    justifyContent: 'space-between',
  },
  assembledWordsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
    minHeight: 60,
    alignItems: 'center',
  },
  emptyPlaceholder: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    width: '100%',
    marginTop: 18,
  },
  placedWordChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  arabicWordText: {
    fontSize: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  assembledControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  mistakesIndicator: {
    minHeight: 20,
    justifyContent: 'center',
  },
  mistakesText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  bankSection: {
    width: '100%',
  },
  bankLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  tilesBank: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  tileWrapper: {},
  wordTileBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileArabicText: {
    fontSize: 22,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  successActionsRow: {
    marginTop: 10,
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
