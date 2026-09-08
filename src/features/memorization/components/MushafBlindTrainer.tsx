import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components';
import { toArabicDigits } from '@/features/quran/utils/quranUtils';
import { playAyah, stopAudio } from '@/features/audio';
import { preloadMushafPages } from '@/features/quran';
import { SURAHS_DATA } from '@/features/quran/data/surahsData';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAudioStore } from '@/stores/audioStore';
import type { MemorizationCard } from '../types';
import { getAyahsPageMap } from '../services/ayahLoader';
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
        <Text
          numberOfLines={1}
          style={[
            styles.mushafWordText,
            {
              color: isRevealed
                ? isAyahPlaying
                  ? primaryColor
                  : isPeeked
                  ? secondaryColor
                  : textColor
                : pillBg,
              opacity: isRevealed ? 1 : 0,
              fontFamily,
            },
          ]}
        >
          {item.word}
        </Text>

        {!isRevealed && (
          <View
            style={[
              styles.maskedWordOverlay,
              {
                backgroundColor: pillBg,
                borderColor: pillBorder,
                borderBottomColor: dashBg,
                borderBottomWidth: 2,
              },
            ]}
            pointerEvents="none"
          />
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

interface MushafTrainerPageData {
  pageNumber: number;
  juzNumber: number;
  surahId: number;
  surahNameArabic?: string;
  hasSurahStart: boolean;
  showBismillah: boolean;
  cards: MemorizationCard[];
  ayahStreams: {
    card: MemorizationCard;
    words: MushafWordItem[];
    ayahNumber: number;
  }[];
}

export const MushafBlindTrainer: React.FC<MushafBlindTrainerProps> = ({
  cards,
  surahName,
  surahId = 1,
  onFinishSession,
  onSwitchToDrillMode,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const { colors, fontFamilies, spacing, radius, shadows, isDark } = useTheme();
  const { t } = useTranslation();
  const defaultReciter = useSettingsStore((s) => s.defaultReciter);

  const isStorePlaying = useAudioStore((s) => s.isPlaying);
  const currentTrack = useAudioStore((s) => s.currentTrack);

  const [maskMode, setMaskMode] = useState<MushafMaskMode>('all_hidden');
  const [peekedKeys, setPeekedKeys] = useState<Set<string>>(new Set());
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [renderAllPages, setRenderAllPages] = useState(false);

  const trainerPagerRef = useRef<PagerView>(null);

  // Group cards into authentic Medina pages
  const pages = useMemo<MushafTrainerPageData[]>(() => {
    if (!cards.length) return [];
    const metaMap = getAyahsPageMap(cards);

    const pageMap = new Map<number, MemorizationCard[]>();
    for (const card of cards) {
      const meta = metaMap.get(`${card.surahId}_${card.ayahNumber}`);
      const pageNum =
        card.page ??
        meta?.page ??
        (SURAHS_DATA.find((s) => s.id === card.surahId)?.pageStart ?? 1);
      if (!pageMap.has(pageNum)) {
        pageMap.set(pageNum, []);
      }
      pageMap.get(pageNum)!.push(card);
    }

    return Array.from(pageMap.entries())
      .sort(([p1], [p2]) => p1 - p2)
      .map(([pageNumber, pageCards]) => {
        const firstCard = pageCards[0];
        const cardSurahId = firstCard?.surahId || surahId || 1;
        const meta = metaMap.get(`${cardSurahId}_${firstCard?.ayahNumber}`);
        const juzNumber = firstCard?.juz ?? meta?.juz ?? 1;
        const surahObj = SURAHS_DATA.find((s) => s.id === cardSurahId);

        const ayahStreams = pageCards.map((card) => {
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

        const hasSurahStart = pageCards.some((c) => c.ayahNumber === 1);
        const showBismillah = hasSurahStart && cardSurahId !== 1 && cardSurahId !== 9;

        return {
          pageNumber,
          juzNumber,
          surahId: cardSurahId,
          surahNameArabic: surahObj?.nameArabic,
          hasSurahStart,
          showBismillah,
          cards: pageCards,
          ayahStreams,
        };
      });
  }, [cards, surahId]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      void stopAudio();
    };
  }, []);

  // Pre-warms in-memory Tajweed segments cache for current and nearby pages
  // Fully synchronous, in-memory string parsing (< 1ms), zero network/disk competition
  useEffect(() => {
    if (pages.length === 0) return;
    const currPage = pages[currentPageIndex];
    if (!currPage) return;

    const preloaderPages = pages.map((p) => ({
      pageNumber: p.pageNumber,
      ayahs: p.cards.map((c) => ({
        id: 0,
        surahId: c.surahId,
        ayahNumber: c.ayahNumber,
        textUthmani: c.arabicText,
        textTajweed: c.arabicText,
        juz: p.juzNumber,
        hizb: 1,
        page: p.pageNumber,
      })),
    }));

    preloadMushafPages(preloaderPages, currentPageIndex);
  }, [pages, currentPageIndex]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderAllPages(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-flip page as continuous audio plays through during self-check
  useEffect(() => {
    if (!isStorePlaying || !currentTrack) return;
    const pageIdx = pages.findIndex((p) =>
      p.cards.some(
        (c) =>
          c.surahId === currentTrack.surahId &&
          c.ayahNumber === currentTrack.ayahNumber
      )
    );
    if (pageIdx !== -1 && pageIdx !== currentPageIndex) {
      try {
        requestAnimationFrame(() => {
          trainerPagerRef.current?.setPage(pageIdx);
        });
        setCurrentPageIndex(pageIdx);
      } catch {}
    }
  }, [currentTrack?.ayahNumber, currentTrack?.surahId, isStorePlaying, pages, currentPageIndex]);

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

  const handleFlipPage = useCallback(
    (direction: 'prev' | 'next') => {
      const targetIdx =
        direction === 'next' ? currentPageIndex + 1 : currentPageIndex - 1;
      if (targetIdx >= 0 && targetIdx < pages.length) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        requestAnimationFrame(() => {
          trainerPagerRef.current?.setPage(targetIdx);
        });
      }
    },
    [currentPageIndex, pages.length]
  );

  const renderPageItem = useCallback(
    ({ item }: { item: MushafTrainerPageData }) => {
      const cardBgColor = isDark ? '#141C18' : '#FBF9F5';
      const cardBorderColor = isDark
        ? 'rgba(212, 167, 69, 0.26)'
        : 'rgba(212, 167, 69, 0.38)';

      return (
        <View style={{ width: windowWidth, paddingHorizontal: 12, flex: 1 }}>
          <View
            style={[
              styles.bookPageCard,
              shadows.medium,
              {
                backgroundColor: cardBgColor,
                borderColor: cardBorderColor,
                borderRadius: radius.xl,
              },
            ]}
          >
            {/* Top Medina Header */}
            <View style={styles.pageHeaderRow}>
              <Text
                style={[
                  styles.pageHeaderMeta,
                  { color: colors.secondary, fontFamily: fontFamilies.arabic },
                ]}
              >
                الجزء {toArabicDigits(item.juzNumber)}
              </Text>

              <View
                style={[
                  styles.headerDiamond,
                  { borderColor: colors.secondary + '60' },
                ]}
              />

              <Text
                style={[
                  styles.pageHeaderMeta,
                  { color: colors.secondary, fontFamily: fontFamilies.arabic },
                ]}
              >
                {item.surahNameArabic ? `سُورَةُ ${item.surahNameArabic}` : ''}
              </Text>
            </View>

            <View
              style={[
                styles.headerDividerLine,
                { backgroundColor: colors.secondary + '30' },
              ]}
            />

            {/* Scrollable Medina Page Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.pageScrollContent}
              nestedScrollEnabled={true}
              bounces={false}
            >
              {/* Surah Banner if Ayah 1 is on this page */}
              {item.hasSurahStart && item.surahNameArabic && (
                <View style={styles.surahBannerWrap}>
                  <View
                    style={[
                      styles.surahBannerFrame,
                      {
                        borderColor: colors.secondary,
                        backgroundColor: isDark
                          ? 'rgba(212, 167, 69, 0.12)'
                          : 'rgba(212, 167, 69, 0.10)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.surahBannerTitle,
                        {
                          fontFamily: fontFamilies.arabic,
                          color: colors.secondary,
                        },
                      ]}
                    >
                      سُورَةُ {item.surahNameArabic}
                    </Text>
                  </View>
                </View>
              )}

              {/* Bismillah if Ayah 1 */}
              {item.showBismillah && (
                <View style={styles.bismillahWrap}>
                  <Text
                    style={[
                      styles.bismillahText,
                      {
                        fontFamily: fontFamilies.arabic,
                        color: colors.secondary,
                      },
                    ]}
                  >
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </Text>
                </View>
              )}

              {/* Continuous Flow of Ayahs with Inset Verse Markers */}
              <View style={styles.continuousAyahFlow}>
                {item.ayahStreams.map(({ card, words, ayahNumber }) => {
                  const isAyahPlaying =
                    isStorePlaying &&
                    currentTrack?.surahId === card.surahId &&
                    currentTrack?.ayahNumber === ayahNumber;

                  return (
                    <React.Fragment key={card.id}>
                      {words.map((wItem) => {
                        const isPeeked = peekedKeys.has(wItem.key);
                        const isRevealed =
                          maskMode === 'all_revealed' ||
                          isPeeked ||
                          (maskMode === 'hints_only' && wItem.isFirstWordOfAyah);

                        return (
                          <MushafWordTile
                            key={wItem.key}
                            item={wItem}
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
            </ScrollView>

            {/* Bottom Medina Page Footer */}
            <View
              style={[
                styles.footerDividerLine,
                { backgroundColor: colors.secondary + '30' },
              ]}
            />

            <View style={styles.pageFooterRow}>
              <Text
                style={[
                  styles.pageNumberText,
                  { color: colors.secondary, fontFamily: fontFamilies.arabic },
                ]}
              >
                — {toArabicDigits(item.pageNumber)} —
              </Text>
            </View>
          </View>
        </View>
      );
    },
    [
      windowWidth,
      isDark,
      colors,
      fontFamilies,
      shadows,
      radius,
      isStorePlaying,
      currentTrack,
      peekedKeys,
      maskMode,
      handleWordTap,
      handlePlaySingleAyah,
    ]
  );

  const currentPageNumber = pages[currentPageIndex]?.pageNumber ?? 1;

  return (
    <View style={styles.container}>
      {/* 1. Symmetrical 3-Mode Segmented Control */}
      <View
        style={[
          styles.centeredSegmentContainer,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.05)',
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
                color:
                  maskMode === 'all_hidden' ? '#FFFFFF' : colors.textSecondary,
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
                color:
                  maskMode === 'hints_only' ? '#FFFFFF' : colors.textSecondary,
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
            color={
              maskMode === 'all_revealed' ? '#FFFFFF' : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.segmentTabText,
              {
                color:
                  maskMode === 'all_revealed'
                    ? '#FFFFFF'
                    : colors.textSecondary,
                marginStart: 4,
              },
            ]}
          >
            {t('hifz.showAll', { defaultValue: 'Весь текст' })}
          </Text>
        </AnimatedPressable>
      </View>

      {/* 2. Audio Self-Check Button */}
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
            size={15}
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
              : t('hifz.playAudioCheck', {
                  defaultValue: 'Слушать чтеца для проверки',
                })}
          </Text>
        </AnimatedPressable>
      </View>

      {/* 3. Horizontal Medina Book Pager (1 Page per screen, Authentic RTL, 60fps) */}
      <PagerView
        ref={trainerPagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        layoutDirection="rtl"
        offscreenPageLimit={2}
        overScrollMode="never"
        onPageSelected={(e) => {
          setCurrentPageIndex(e.nativeEvent.position);
        }}
      >
        {pages.map((item, index) => {
          const isRendered =
            renderAllPages || Math.abs(index - currentPageIndex) <= 2;
          return (
            <View
              key={`mushaf-trainer-page-${item.pageNumber}`}
              style={{ flex: 1, width: windowWidth }}
              collapsable={false}
            >
              {isRendered ? (
                renderPageItem({ item })
              ) : (
                <View style={{ width: windowWidth, paddingHorizontal: 12, flex: 1 }}>
                  <View
                    style={{
                      flex: 1,
                      borderWidth: 1.5,
                      borderColor: 'rgba(212, 167, 69, 0.26)',
                      borderRadius: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(212, 167, 69, 0.03)',
                    }}
                  />
                </View>
              )}
            </View>
          );
        })}
      </PagerView>

      {/* 4. Bottom Medina Book Navigation Bar (Authentic RTL: Left advances Next, Right goes Prev) */}
      <View style={styles.bottomNavRow}>
        {/* Left Button: Next Page (advances forward in Arabic reading order) */}
        <AnimatedPressable
          onPress={() => handleFlipPage('next')}
          disabled={currentPageIndex >= pages.length - 1}
          style={[
            styles.pageTurnBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: currentPageIndex >= pages.length - 1 ? 0.35 : 1,
            },
          ]}
          accessibilityLabel="Следующая страница"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </AnimatedPressable>

        <View
          style={[
            styles.pageCounterPill,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.pageCounterText, { color: colors.textSecondary }]}>
            {t('quran.page', 'Стр.')}{' '}
            <Text style={{ color: colors.secondary, fontWeight: '700' }}>
              {currentPageNumber}
            </Text>
            {'  •  '}
            {currentPageIndex + 1} / {Math.max(1, pages.length)}
          </Text>
        </View>

        {/* Right Button: Previous Page (goes backward toward the beginning) */}
        <AnimatedPressable
          onPress={() => handleFlipPage('prev')}
          disabled={currentPageIndex === 0}
          style={[
            styles.pageTurnBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: currentPageIndex === 0 ? 0.35 : 1,
            },
          ]}
          accessibilityLabel="Предыдущая страница"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </AnimatedPressable>
      </View>

      {/* 5. Finish & Review CTA Button */}
      <View style={[styles.bottomActions, { paddingHorizontal: 16 }]}>
        <AnimatedPressable
          onPress={() => {
            void stopAudio();
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
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
            style={styles.switchModeBtn}
          >
            <Ionicons
              name="construct-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Text
              style={[
                styles.switchModeText,
                { color: colors.textSecondary, marginStart: 6 },
              ]}
            >
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
    flex: 1,
    width: '100%',
  },
  centeredSegmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    marginBottom: 6,
    marginHorizontal: 16,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  segmentTabActive: {
    shadowColor: '#0D6B4E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  audioHintRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  audioHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  audioHintPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookPageCard: {
    flex: 1,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
    overflow: 'hidden',
  },
  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  pageHeaderMeta: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerDiamond: {
    width: 6,
    height: 6,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
  headerDividerLine: {
    height: StyleSheet.hairlineWidth * 1.5,
    marginVertical: 4,
  },
  pageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 6,
  },
  surahBannerWrap: {
    alignItems: 'center',
    marginVertical: 6,
  },
  surahBannerFrame: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  surahBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  bismillahWrap: {
    alignItems: 'center',
    marginVertical: 4,
  },
  bismillahText: {
    fontSize: 18,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  continuousAyahFlow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    rowGap: 6,
    columnGap: 4,
  },
  wordPressable: {
    height: 44,
    minWidth: 32,
    paddingHorizontal: 3,
    marginVertical: 1,
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
    fontSize: 22,
    lineHeight: 40,
    textAlign: 'center',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  maskedWordOverlay: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: 7,
    bottom: 7,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahRosette: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    marginVertical: 4,
  },
  rosetteNumber: {
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
  footerDividerLine: {
    height: StyleSheet.hairlineWidth * 1.5,
    marginVertical: 4,
  },
  pageFooterRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  pageTurnBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageCounterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageCounterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomActions: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 6,
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
    shadowColor: '#0D6B4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchModeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
