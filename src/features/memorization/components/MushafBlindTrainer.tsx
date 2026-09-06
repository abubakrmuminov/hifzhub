import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components';
import { toArabicDigits } from '@/features/quran/utils/quranUtils';
import { playAyah, stopAudio, preloadAyahAudio } from '@/features/audio/services/trackPlayer';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAudioStore } from '@/stores/audioStore';
import type { MemorizationCard } from '../types';
import { cleanArabicWords } from './AyahWordScramble';

export type MushafMaskMode = 'all_hidden' | 'hints_only' | 'all_revealed';

export interface MushafBlindTrainerProps {
  cards: MemorizationCard[];
  surahName?: string;
  surahId?: number;
  onFinishSession: () => void;
  onSwitchToDrillMode?: () => void;
}

interface MushafWordItem {
  key: string;
  word: string;
  ayahNumber: number;
  wordIndexInAyah: number;
  isFirstWordOfAyah: boolean;
}

interface MushafWordTileProps {
  item: MushafWordItem;
  isRevealed: boolean;
  isPeeked: boolean;
  isAyahPlaying: boolean;
  onPress: (key: string) => void;
  fontFamily?: string;
  textColor: string;
  primaryColor: string;
  secondaryColor: string;
  isDark: boolean;
}

const MushafWordTile = React.memo<MushafWordTileProps>(
  ({
    item,
    isRevealed,
    isPeeked,
    isAyahPlaying,
    onPress,
    fontFamily,
    textColor,
    primaryColor,
    secondaryColor,
    isDark,
  }) => {
    const pillBg = isDark ? '#28283D' : '#EDE8DC';
    const pillBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
    const dashBg = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.22)';

    return (
      <Pressable
        onPress={() => onPress(item.key)}
        hitSlop={4}
        style={[
          styles.wordPressable,
          isPeeked && [
            styles.peekedHighlight,
            {
              backgroundColor: isDark
                ? 'rgba(212, 167, 69, 0.14)'
                : 'rgba(212, 167, 69, 0.10)',
            },
          ],
        ]}
      >
        {/*
          Real Arabic text: Always present in the layout tree.
          This guarantees the word container has the EXACT natural footprint of the Arabic word.
          When masked, it has opacity: 0 and color matching the pill background (triple-masked).
        */}
        <Text
          numberOfLines={1}
          style={[
            styles.mushafWordText,
            {
              color: isRevealed
                ? (isAyahPlaying
                    ? primaryColor
                    : isPeeked
                    ? secondaryColor
                    : textColor)
                : pillBg,
              opacity: isRevealed ? 1 : 0,
              fontFamily,
            },
          ]}
        >
          {item.word}
        </Text>

        {/*
          Opaque mask overlay: Sits precisely over the exact word bounds when hidden.
          The pill takes the exact dimensions of this specific word, preventing ANY layout shift on reveal.
        */}
        {!isRevealed && (
          <View
            style={[
              styles.maskedWordOverlay,
              {
                backgroundColor: pillBg,
                borderColor: pillBorder,
              },
            ]}
            pointerEvents="none"
          >
            <View style={[styles.maskedWordInnerDash, { backgroundColor: dashBg }]} />
          </View>
        )}
      </Pressable>
    );
  },
  (prev, next) =>
    prev.isRevealed === next.isRevealed &&
    prev.isPeeked === next.isPeeked &&
    prev.isAyahPlaying === next.isAyahPlaying &&
    prev.isDark === next.isDark &&
    prev.textColor === next.textColor &&
    prev.primaryColor === next.primaryColor &&
    prev.secondaryColor === next.secondaryColor
);

interface AyahRosetteProps {
  surahId: number;
  ayahNumber: number;
  isAyahPlaying: boolean;
  onPress: (surahId: number, ayahNumber: number) => void;
  primaryColor: string;
  secondaryColor: string;
}

const AyahRosette = React.memo<AyahRosetteProps>(
  ({ surahId, ayahNumber, isAyahPlaying, onPress, primaryColor, secondaryColor }) => {
    return (
      <Pressable
        onPress={() => onPress(surahId, ayahNumber)}
        hitSlop={4}
        style={[
          styles.ayahRosette,
          {
            backgroundColor: isAyahPlaying ? `${primaryColor}25` : `${secondaryColor}15`,
            borderColor: isAyahPlaying ? primaryColor : secondaryColor,
          },
        ]}
      >
        {isAyahPlaying ? (
          <Ionicons name="volume-high" size={14} color={primaryColor} />
        ) : (
          <Text style={[styles.rosetteNumber, { color: secondaryColor }]}>
            {toArabicDigits(ayahNumber)}
          </Text>
        )}
      </Pressable>
    );
  },
  (prev, next) =>
    prev.ayahNumber === next.ayahNumber &&
    prev.isAyahPlaying === next.isAyahPlaying &&
    prev.primaryColor === next.primaryColor &&
    prev.secondaryColor === next.secondaryColor
);

export const MushafBlindTrainer: React.FC<MushafBlindTrainerProps> = ({
  cards,
  surahName,
  surahId = 1,
  onFinishSession,
  onSwitchToDrillMode,
}) => {
  const { colors, fontFamilies, spacing, radius, isDark } = useTheme();
  const { t } = useTranslation();
  const defaultReciter = useSettingsStore((s) => s.defaultReciter);

  const isStorePlaying = useAudioStore((s) => s.isPlaying);
  const currentTrack = useAudioStore((s) => s.currentTrack);

  // Masking mode:
  // - 'all_hidden': 100% blind recall (all words masked)
  // - 'hints_only': first word of each ayah visible (shows linking anchors!)
  // - 'all_revealed': full text visible for verification
  const [maskMode, setMaskMode] = useState<MushafMaskMode>('all_hidden');

  // Set of specific word keys that user has tapped to peek/reveal
  const [peekedKeys, setPeekedKeys] = useState<Set<string>>(new Set());

  // Currently playing ayah index in the continuous audio chain
  const [playingAyahNum, setPlayingAyahNum] = useState<number | null>(null);

  // Preload audio for all cards in this Mushaf page
  useEffect(() => {
    cards.forEach((c) => {
      void preloadAyahAudio(c.surahId, c.ayahNumber, defaultReciter);
    });
    return () => {
      void stopAudio();
    };
  }, [cards, defaultReciter]);

  // Breakdown all cards into a continuous stream of words and ayah markers
  const ayahStreams = useMemo(() => {
    return cards.map((card) => {
      const words = cleanArabicWords(card.arabicText);
      const wordItems: MushafWordItem[] = words.map((word, idx) => ({
        key: `${card.id}_w_${idx}`,
        word,
        ayahNumber: card.ayahNumber,
        wordIndexInAyah: idx,
        isFirstWordOfAyah: idx === 0,
      }));

      return {
        card,
        words: wordItems,
        ayahNumber: card.ayahNumber,
      };
    });
  }, [cards]);

  const handleModeChange = useCallback((newMode: MushafMaskMode) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMaskMode(newMode);
  }, []);

  const handleWordTap = useCallback((key: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPeekedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Tap Rosette to hear single Ayah hint
  const handlePlaySingleAyah = useCallback(
    async (cardSurahId: number, ayahNumber: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const isThisAyahPlaying =
        isStorePlaying &&
        currentTrack?.surahId === cardSurahId &&
        currentTrack?.ayahNumber === ayahNumber;

      if (isThisAyahPlaying) {
        await stopAudio();
        return;
      }

      await playAyah(cardSurahId, ayahNumber, defaultReciter, { autoPlayNext: false });
    },
    [isStorePlaying, currentTrack, defaultReciter]
  );

  // Play whole page recitation for self-check
  const handlePlayFullPageAudio = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isStorePlaying) {
      await stopAudio();
      return;
    }

    if (cards.length === 0) return;
    const firstCard = cards[0];
    await playAyah(firstCard.surahId, firstCard.ayahNumber, defaultReciter, {
      autoPlayNext: true,
      ayahCount: cards[cards.length - 1].ayahNumber,
    });
  }, [isStorePlaying, cards, defaultReciter]);

  const isBismillahVisible =
    cards.length > 0 &&
    cards[0].ayahNumber === 1 &&
    surahId !== 1 &&
    surahId !== 9;

  return (
    <View style={styles.container}>
      {/* 1. Symmetrical, Centered 3-Mode Segmented Control */}
      <View
        style={[
          styles.centeredSegmentContainer,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            borderRadius: radius.full,
          },
        ]}
      >
        <AnimatedPressable
          onPress={() => handleModeChange('all_hidden')}
          style={[
            styles.segmentTab,
            maskMode === 'all_hidden' && [
              styles.segmentTabActive,
              { backgroundColor: colors.primary },
            ],
            { borderRadius: radius.full },
          ]}
        >
          <Ionicons
            name="eye-off-outline"
            size={14}
            color={maskMode === 'all_hidden' ? '#FFFFFF' : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentTabText,
              {
                color: maskMode === 'all_hidden' ? '#FFFFFF' : colors.textSecondary,
                marginStart: 4,
              },
            ]}
          >
            {t('hifz.blindMode', { defaultValue: 'Вслепую' })}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => handleModeChange('hints_only')}
          style={[
            styles.segmentTab,
            maskMode === 'hints_only' && [
              styles.segmentTabActive,
              { backgroundColor: colors.primary },
            ],
            { borderRadius: radius.full },
          ]}
        >
          <Ionicons
            name="git-commit-outline"
            size={14}
            color={maskMode === 'hints_only' ? '#FFFFFF' : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentTabText,
              {
                color: maskMode === 'hints_only' ? '#FFFFFF' : colors.textSecondary,
                marginStart: 4,
              },
            ]}
          >
            {t('hifz.linksMode', { defaultValue: 'Связки' })}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => handleModeChange('all_revealed')}
          style={[
            styles.segmentTab,
            maskMode === 'all_revealed' && [
              styles.segmentTabActive,
              { backgroundColor: colors.primary },
            ],
            { borderRadius: radius.full },
          ]}
        >
          <Ionicons
            name="eye-outline"
            size={14}
            color={maskMode === 'all_revealed' ? '#FFFFFF' : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentTabText,
              {
                color: maskMode === 'all_revealed' ? '#FFFFFF' : colors.textSecondary,
                marginStart: 4,
              },
            ]}
          >
            {t('hifz.showAll', { defaultValue: 'Весь текст' })}
          </Text>
        </AnimatedPressable>
      </View>

      {/* 2. Audio Self-Check Bar (Clearly defined purpose for Hifz) */}
      <View style={styles.audioHintRow}>
        <AnimatedPressable
          onPress={handlePlayFullPageAudio}
          style={[
            styles.audioHintPill,
            {
              backgroundColor: isStorePlaying
                ? `${colors.secondary}22`
                : isDark
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(13, 107, 78, 0.08)',
              borderColor: isStorePlaying ? colors.secondary : 'transparent',
              borderRadius: radius.full,
            },
          ]}
        >
          <Ionicons
            name={isStorePlaying ? 'stop-circle' : 'volume-high-outline'}
            size={16}
            color={isStorePlaying ? colors.secondary : colors.primary}
          />
          <Text
            style={[
              styles.audioHintPillText,
              {
                color: isStorePlaying ? colors.secondary : colors.primary,
                marginStart: 6,
              },
            ]}
          >
            {isStorePlaying
              ? t('hifz.stopAudioCheck', { defaultValue: 'Остановить проверку' })
              : t('hifz.playAudioCheck', { defaultValue: 'Слушать чтеца для проверки' })}
          </Text>
        </AnimatedPressable>
      </View>

      {/* 3. Hint Explanation Bar */}
      <View style={styles.hintBar}>
        <Ionicons name="information-circle-outline" size={14} color={colors.textTertiary} />
        <Text style={[styles.hintBarText, { color: colors.textTertiary, marginStart: 6 }]}>
          {maskMode === 'all_hidden'
            ? t('hifz.tapToPeekHintWithAudio', {
                defaultValue:
                  'Читайте наизусть. Нажмите на слово — чтобы подсмотреть, или на ﴿номер﴾ — для аудио-подсказки.',
              })
            : maskMode === 'hints_only'
            ? t('hifz.hintsOnlyExplanation', {
                defaultValue: 'Первые слова аятов открыты, чтобы помочь связывать стихи.',
              })
            : t('hifz.checkYourselfHint', {
                defaultValue: 'Проверьте чтение всей страницы перед завершением.',
              })}
        </Text>
      </View>

      {/* 4. Authentic Quran Mushaf Page Container */}
      <View
        style={[
          styles.mushafPaper,
          {
            backgroundColor: isDark ? '#1C1C2E' : '#FCF9F2',
            borderColor: isDark ? 'rgba(212, 167, 69, 0.35)' : 'rgba(212, 167, 69, 0.40)',
            borderRadius: radius.lg,
            padding: spacing.lg,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.4 : 0.08,
            shadowRadius: 10,
            elevation: 4,
          },
        ]}
      >
        {/* Surah Header Ornament */}
        {Boolean(surahName) && (
          <View style={[styles.surahOrnamentHeader, { borderColor: colors.secondary }]}>
            <View style={styles.ornamentLine} />
            <Text style={[styles.surahHeaderText, { color: colors.text }]}>
              {surahName}
            </Text>
            <View style={styles.ornamentLine} />
          </View>
        )}

        {/* Bismillah if applicable */}
        {isBismillahVisible && (
          <Text
            style={[
              styles.bismillahText,
              { color: colors.text, fontFamily: fontFamilies.arabic },
            ]}
          >
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </Text>
        )}

        {/* Continuous Flow of Ayahs with Inset Verse Markers */}
        <View style={styles.continuousAyahFlow}>
          {ayahStreams.map(({ card, words, ayahNumber }) => {
            const isAyahPlaying =
              isStorePlaying &&
              currentTrack?.surahId === card.surahId &&
              currentTrack?.ayahNumber === ayahNumber;

            return (
              <React.Fragment key={card.id}>
                {words.map((item) => {
                  const isPeeked = peekedKeys.has(item.key);
                  const isRevealed =
                    maskMode === 'all_revealed' ||
                    isPeeked ||
                    (maskMode === 'hints_only' && item.isFirstWordOfAyah);

                  return (
                    <MushafWordTile
                      key={item.key}
                      item={item}
                      isRevealed={isRevealed}
                      isPeeked={isPeeked}
                      isAyahPlaying={isAyahPlaying}
                      onPress={handleWordTap}
                      fontFamily={fontFamilies.arabic}
                      textColor={colors.text}
                      primaryColor={colors.primary}
                      secondaryColor={colors.secondary}
                      isDark={isDark}
                    />
                  );
                })}

                {/* Ayah End Rosette ﴿١﴾ - Interactive! Tap to hear this ayah as hint */}
                <AyahRosette
                  surahId={card.surahId}
                  ayahNumber={ayahNumber}
                  isAyahPlaying={isAyahPlaying}
                  onPress={handlePlaySingleAyah}
                  primaryColor={colors.primary}
                  secondaryColor={colors.secondary}
                />
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* 5. Bottom CTA: Finish & Return */}
      <View style={[styles.bottomActions, { marginTop: spacing.xl }]}>
        <AnimatedPressable
          onPress={() => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onFinishSession();
          }}
          style={[
            styles.finishBtn,
            { backgroundColor: colors.primary, borderRadius: radius.md },
          ]}
        >
          <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
          <Text style={[styles.finishBtnText, { marginStart: 8 }]}>
            {t('hifz.recitedFromMemorySuccess', {
              defaultValue: 'Прочитано наизусть! Завершить 🎉',
            })}
          </Text>
        </AnimatedPressable>

        {Boolean(onSwitchToDrillMode) && (
          <AnimatedPressable
            onPress={onSwitchToDrillMode}
            style={[styles.switchModeBtn, { marginTop: spacing.sm }]}
          >
            <Ionicons name="construct-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.switchModeText, { color: colors.textSecondary, marginStart: 6 }]}>
              {t('hifz.switchToDrill', {
                defaultValue: 'Перейти в конструктор слов',
              })}
            </Text>
          </AnimatedPressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  centeredSegmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    marginBottom: 10,
    width: '100%',
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  segmentTabActive: {
    shadowColor: '#0D6B4E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  audioHintRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  audioHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
  },
  audioHintPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 6,
  },
  hintBarText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  mushafPaper: {
    borderWidth: 1.5,
    width: '100%',
    minHeight: 300,
  },
  surahOrnamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 6,
    marginBottom: 14,
  },
  ornamentLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 167, 69, 0.4)',
  },
  surahHeaderText: {
    fontSize: 16,
    fontWeight: '800',
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },
  bismillahText: {
    fontSize: 22,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 14,
  },
  continuousAyahFlow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    rowGap: 8,
    columnGap: 4,
  },
  wordPressable: {
    height: 48,
    minWidth: 34,
    paddingHorizontal: 4,
    marginVertical: 2,
    marginHorizontal: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  peekedHighlight: {
    borderBottomWidth: 2,
    borderBottomColor: '#D4A745',
    borderRadius: 6,
  },
  mushafWordText: {
    fontSize: 24,
    lineHeight: 44,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  maskedWordOverlay: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: 9,
    bottom: 9,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskedWordInnerDash: {
    width: '50%',
    minWidth: 14,
    height: 3,
    borderRadius: 2,
  },
  ayahRosette: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    marginVertical: 8,
  },
  rosetteNumber: {
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },
  bottomActions: {
    width: '100%',
    alignItems: 'center',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    shadowColor: '#0D6B4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchModeText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
