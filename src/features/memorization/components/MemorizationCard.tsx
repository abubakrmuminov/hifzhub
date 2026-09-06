import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { GlassView, AnimatedPressable } from '@/shared/components';
import { WordByWordDisplay } from './WordByWordDisplay';

export interface MemorizationCardProps {
  arabicText: string;
  transliteration?: string;
  translation?: string;
  surahName?: string;
  ayahNumber?: number;
  revealedWordCount: number;
  totalWords: number;
  onRevealNext: () => void;
  onRevealAll: () => void;
  showTranslation?: boolean;
}

export const MemorizationCard: React.FC<MemorizationCardProps> = ({
  arabicText,
  transliteration,
  translation,
  surahName,
  ayahNumber,
  revealedWordCount,
  totalWords,
  onRevealNext,
  onRevealAll,
  showTranslation = false,
}) => {
  const { colors, spacing, radius, isDark } = useTheme();
  const { t } = useTranslation();

  const isAllRevealed = totalWords > 0 && revealedWordCount >= totalWords;
  const progressRatio = totalWords > 0 ? Math.min(revealedWordCount / totalWords, 1) : 0;
  const progressPercent = Math.round(progressRatio * 100);

  const hasHeaderInfo = Boolean(surahName || ayahNumber);
  const showTranslationSection = Boolean(showTranslation && (translation || transliteration));

  return (
    <Animated.View entering={FadeInDown.duration(350)} style={styles.cardOuter}>
      <GlassView borderRadius={radius.lg} style={styles.glassContainer}>
        <View style={[styles.content, { padding: spacing.md }]}>
          {/* Top: Surah name + Ayah number badge */}
          {hasHeaderInfo && (
            <View style={styles.headerRow}>
              <View
                style={[
                  styles.badge,
                  {
                    borderRadius: radius.full,
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              >
                <Ionicons
                  name="book-outline"
                  size={14}
                  color={colors.secondary}
                  style={styles.badgeIcon}
                />
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                  {surahName}
                  {surahName && ayahNumber ? ' • ' : ''}
                  {ayahNumber !== undefined
                    ? t('hifz.ayahBadge', {
                        defaultValue: `Аят ${ayahNumber}`,
                        number: ayahNumber,
                      })
                    : ''}
                </Text>
              </View>
            </View>
          )}

          {/* Center: Word-by-Word Arabic text */}
          <View style={[styles.arabicSection, { marginVertical: spacing.sm }]}>
            <WordByWordDisplay
              arabicText={arabicText}
              revealedCount={revealedWordCount}
              totalRevealed={isAllRevealed}
              onWordTap={onRevealNext}
            />
          </View>

          {/* Word counter and thin progress bar */}
          <View style={[styles.progressSection, { marginVertical: spacing.xs }]}>
            <View style={styles.counterRow}>
              <Text style={[styles.counterText, { color: colors.textSecondary }]}>
                {t('hifz.wordCountProgress', {
                  defaultValue: `${revealedWordCount}/${totalWords} слов`,
                  current: revealedWordCount,
                  total: totalWords,
                })}
              </Text>
              <Text style={[styles.percentText, { color: colors.textTertiary }]}>
                {`${progressPercent}%`}
              </Text>
            </View>

            <View
              style={[
                styles.progressBarTrack,
                {
                  borderRadius: radius.full,
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPercent}%`,
                    borderRadius: radius.full,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
          </View>

          {/* Bottom row: Action buttons */}
          <View style={[styles.buttonRow, { marginTop: spacing.md }]}>
            <AnimatedPressable
              onPress={onRevealNext}
              disabled={isAllRevealed}
              accessibilityRole="button"
              accessibilityLabel={t('hifz.revealWord', {
                defaultValue: 'Показать слово',
              })}
              style={[
                styles.actionButton,
                styles.revealWordButton,
                {
                  borderRadius: radius.md,
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.14)'
                    : 'rgba(0, 0, 0, 0.10)',
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(255, 255, 255, 0.85)',
                  opacity: isAllRevealed ? 0.45 : 1,
                  marginEnd: spacing.xs,
                },
              ]}
            >
              <Ionicons
                name="eye-outline"
                size={18}
                color={colors.text}
                style={styles.buttonIcon}
              />
              <Text
                numberOfLines={1}
                style={[styles.buttonText, { color: colors.text }]}
              >
                {t('hifz.revealWord', { defaultValue: 'Показать слово' })}
              </Text>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={onRevealAll}
              disabled={isAllRevealed}
              accessibilityRole="button"
              accessibilityLabel={t('hifz.revealAll', {
                defaultValue: 'Показать всё',
              })}
              style={[
                styles.actionButton,
                styles.revealAllButton,
                {
                  borderRadius: radius.md,
                  backgroundColor: colors.primary,
                  opacity: isAllRevealed ? 0.45 : 1,
                  marginStart: spacing.xs,
                },
              ]}
            >
              <Ionicons
                name="sparkles-outline"
                size={18}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
              <Text
                numberOfLines={1}
                style={[styles.buttonText, styles.primaryButtonText]}
              >
                {t('hifz.revealAll', { defaultValue: 'Показать всё' })}
              </Text>
            </AnimatedPressable>
          </View>

          {/* Optional: Collapsible/toggled translation section */}
          {showTranslationSection && (
            <View
              style={[
                styles.translationSection,
                {
                  marginTop: spacing.md,
                  paddingTop: spacing.sm,
                  borderTopColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              {Boolean(transliteration) && (
                <Text
                  style={[
                    styles.transliterationText,
                    {
                      color: colors.textTertiary,
                      marginBottom: translation ? spacing.xs : 0,
                    },
                  ]}
                >
                  {transliteration}
                </Text>
              )}

              {Boolean(translation) && (
                <Text style={[styles.translationText, { color: colors.textSecondary }]}>
                  {translation}
                </Text>
              )}
            </View>
          )}
        </View>
      </GlassView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    width: '100%',
  },
  glassContainer: {
    width: '100%',
  },
  content: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeIcon: {
    marginEnd: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  arabicSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  progressSection: {
    width: '100%',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  percentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBarTrack: {
    height: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  revealWordButton: {
    borderWidth: 1,
  },
  revealAllButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonIcon: {
    marginEnd: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  translationSection: {
    width: '100%',
    borderTopWidth: 1,
  },
  transliterationText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'center',
  },
  translationText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
