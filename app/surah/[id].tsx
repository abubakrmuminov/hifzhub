import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  FlatList,
  Platform,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type ViewToken,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PagerView from 'react-native-pager-view';
import { useTheme } from '@/shared/theme';
import { AyahSkeleton } from '@/shared/components/Skeleton';
import { GlassView } from '@/shared/components/GlassView';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import {
  SurahHeader,
  ReadingModeToggle,
  AyahText,
  TranslationText,
  MushafView,
  PageDivider,
  FloatingAudioPlayer,
  AyahActionBar,
  TajweedInfoModal,
  TajweedLegendModal,
  type TajweedRuleInfo,
  useAyahs,
  getSurahName,
  preloadMushafPages,
} from '@/features/quran';
import { playAyah, pauseAudio } from '@/features/audio';
import { useAudioStore } from '@/stores/audioStore';
import { useDownload } from '@/features/audio/hooks/useDownload';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProgressStore } from '@/stores/progressStore';
import { SURAHS_DATA } from '@/features/quran/data/surahsData';
import type { Ayah } from '@/db/schema';

interface MushafPageData {
  pageNumber: number;
  ayahs: Ayah[];
}

const mushafPageFlexStyle = { flex: 1 } as const;

interface MushafPageItemProps {
  item: MushafPageData;
  isRendered: boolean;
  windowWidth: number;
  mushafPageHeight: number;
  quranFontSize: number;
  showTajweed: boolean;
  selectedAyahId?: number | null;
  activeAyahNumber?: number | null;
  playingAyahNumber?: number | null;
  onSelectAyah: (ayah: Ayah | null) => void;
  onPressRule: (rule: TajweedRuleInfo, matchedText: string) => void;
}

const MushafPageItem = React.memo<MushafPageItemProps>(
  ({
    item,
    isRendered,
    windowWidth,
    mushafPageHeight,
    quranFontSize,
    showTajweed,
    selectedAyahId,
    activeAyahNumber,
    playingAyahNumber,
    onSelectAyah,
    onPressRule,
  }) => {
    return (
      <View
        style={{ flex: 1, width: windowWidth }}
        collapsable={false}
      >
        {isRendered ? (
          <MushafView
            ayahs={item.ayahs}
            pageNumber={item.pageNumber}
            width={windowWidth}
            height={mushafPageHeight}
            style={mushafPageFlexStyle}
            fontSize={quranFontSize}
            showTajweed={showTajweed}
            selectedAyahId={selectedAyahId}
            activeAyahNumber={activeAyahNumber}
            playingAyahNumber={playingAyahNumber}
            onSelectAyah={onSelectAyah}
            onPressRule={onPressRule}
          />
        ) : null}
      </View>
    );
  }
);

interface TranslationAyahCardProps {
  item: Ayah;
  translation?: { text: string; translator: string };
  isLastOnPage: boolean;
  isCurrentPlaying: boolean;
  isHighlighted?: boolean;
  quranFontSize: number;
  showTajweed: boolean;
  showTranslation: boolean;
  surfaceColor: string;
  borderColor: string;
  secondaryColor: string;
  primaryColor: string;
  isDark: boolean;
  borderRadius: number;
  shadowSoft: any;
  paddingMd: number;
  marginBottomSm: number;
  paddingHorizontalMd: number;
  onPlayAyah: (ayahNumber: number) => void;
  onSelectAyah?: (ayah: Ayah) => void;
  onPressRule?: (rule: TajweedRuleInfo, matchedText: string) => void;
  onLayout?: (e: any) => void;
}

const TranslationAyahCard = React.memo<TranslationAyahCardProps>(
  ({
    item,
    translation,
    isLastOnPage,
    isCurrentPlaying,
    isHighlighted = false,
    quranFontSize,
    showTajweed,
    showTranslation,
    surfaceColor,
    borderColor,
    secondaryColor,
    primaryColor,
    isDark,
    borderRadius,
    shadowSoft,
    paddingMd,
    marginBottomSm,
    paddingHorizontalMd,
    onPlayAyah,
    onSelectAyah,
    onPressRule,
    onLayout,
  }) => {
    const pulseAnim = useSharedValue(1);

    useEffect(() => {
      if (isCurrentPlaying) {
        pulseAnim.value = withRepeat(
          withSequence(
            withTiming(1.14, { duration: 650 }),
            withTiming(1, { duration: 650 })
          ),
          -1,
          true
        );
      } else {
        pulseAnim.value = withTiming(1, { duration: 200 });
      }
    }, [isCurrentPlaying, pulseAnim]);

    const animatedBadgeStyle = useAnimatedStyle(() => ({
      transform: [{ scale: pulseAnim.value }],
    }));

    const cardBgColor = isCurrentPlaying
      ? isDark
        ? 'rgba(212, 167, 69, 0.10)'
        : 'rgba(255, 248, 230, 0.95)'
      : isHighlighted
      ? isDark
        ? 'rgba(212, 167, 69, 0.14)'
        : 'rgba(255, 248, 225, 0.95)'
      : surfaceColor;

    const cardBorderColor = isCurrentPlaying
      ? secondaryColor
      : isHighlighted
      ? secondaryColor
      : borderColor;
    const cardBorderWidth = isCurrentPlaying || isHighlighted ? 2 : 1;

    const cardShadow = isCurrentPlaying || isHighlighted
      ? {
          shadowColor: secondaryColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.35 : 0.25,
          shadowRadius: 10,
          elevation: 6,
        }
      : shadowSoft;

    return (
      <View onLayout={onLayout} style={{ paddingHorizontal: paddingHorizontalMd }}>
        <View
          style={[
            styles.ayahCard,
            cardShadow,
            {
              backgroundColor: cardBgColor,
              borderColor: cardBorderColor,
              borderWidth: cardBorderWidth,
              borderRadius: borderRadius,
              padding: paddingMd,
              marginBottom: marginBottomSm,
            },
          ]}
        >
          {/* Card Header with Ayah Number Circle & Quick Play */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              {/* Pulsing Gold Ayah Number Circle */}
              <AnimatedPressable
                onPress={() => onPlayAyah(item.ayahNumber)}
                haptic="light"
                accessibilityLabel={`Аят ${item.ayahNumber}`}
                accessibilityRole="button"
              >
                <Animated.View
                  style={[
                    styles.ayahBadgeCircle,
                    {
                      backgroundColor: isCurrentPlaying
                        ? secondaryColor
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                      borderColor: isCurrentPlaying
                        ? secondaryColor
                        : isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : 'rgba(0, 0, 0, 0.08)',
                    },
                    isCurrentPlaying && styles.ayahBadgeCircleGlow,
                    animatedBadgeStyle,
                  ]}
                >
                  <Text
                    style={[
                      styles.ayahBadgeNumberText,
                      {
                        color: isCurrentPlaying
                          ? '#FFFFFF'
                          : isDark
                          ? '#D4A745'
                          : primaryColor,
                      },
                    ]}
                  >
                    {item.ayahNumber}
                  </Text>
                </Animated.View>
              </AnimatedPressable>

              {/* Quick Play Button */}
              <AnimatedPressable
                onPress={() => onPlayAyah(item.ayahNumber)}
                haptic="light"
                style={[
                  styles.cardPlayBtn,
                  {
                    backgroundColor: isCurrentPlaying
                      ? secondaryColor + '25'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.07)'
                      : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isCurrentPlaying
                      ? secondaryColor
                      : 'transparent',
                  },
                ]}
                accessibilityLabel={isCurrentPlaying ? 'Пауза' : 'Слушать'}
                accessibilityRole="button"
              >
                <Ionicons
                  name={isCurrentPlaying ? 'pause' : 'play'}
                  size={13}
                  color={
                    isCurrentPlaying
                      ? secondaryColor
                      : isDark
                      ? 'rgba(255, 255, 255, 0.65)'
                      : 'rgba(0, 0, 0, 0.55)'
                  }
                  style={!isCurrentPlaying ? { marginStart: 1 } : undefined}
                />
              </AnimatedPressable>
            </View>

            {/* Ayah Actions / Context Menu Opener */}
            <AnimatedPressable
              onPress={() => onSelectAyah?.(item)}
              haptic="light"
              style={styles.cardOptionsBtn}
              accessibilityLabel="Действия"
              accessibilityRole="button"
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={16}
                color={
                  isDark
                    ? 'rgba(255, 255, 255, 0.4)'
                    : 'rgba(0, 0, 0, 0.35)'
                }
              />
            </AnimatedPressable>
          </View>

          <AyahText
            textUthmani={item.textUthmani}
            ayahNumber={item.ayahNumber}
            surahId={item.surahId}
            textTajweed={item.textTajweed}
            fontSize={quranFontSize}
            showTajweed={showTajweed}
            onPressRule={onPressRule}
          />
          {showTranslation && translation ? (
            <TranslationText
              text={translation.text}
              translator={translation.translator}
            />
          ) : null}
        </View>

        {isLastOnPage && item.page ? (
          <PageDivider pageNumber={item.page} />
        ) : null}
      </View>
    );
  }
);

export interface SurahDetailScreenProps {}

export const SurahDetailScreen: React.FC<SurahDetailScreenProps> = () => {
  const { id, ayah: initialAyahParam } = useLocalSearchParams<{ id: string; ayah?: string }>();
  const surahId = parseInt(id ?? '1', 10);
  const targetAyahNumber = initialAyahParam ? parseInt(initialAyahParam, 10) : null;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, shadows, fontFamilies, isDark } = useTheme();
  const { t } = useTranslation();

  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [headerHeight, setHeaderHeight] = useState<number>(insets.top + 348);

  const readingMode = useSettingsStore((s) => s.readingMode);
  const setReadingMode = useSettingsStore((s) => s.setReadingMode);
  const language = useSettingsStore((s) => s.language);
  const quranFontSize = useSettingsStore((s) => s.quranFontSize);
  const showTajweed = useSettingsStore((s) => s.showTajweed);
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const defaultReciter = useSettingsStore((s) => s.defaultReciter);
  const setLastRead = useSettingsStore((s) => s.setLastRead);

  const recordAyahRead = useProgressStore((s) => s.recordAyahRead);
  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);

  const isCurrentSurah = currentTrack?.surahId === surahId;
  const playingAyahNumber = isCurrentSurah ? currentTrack?.ayahNumber : undefined;

  const translationListRef = useRef<FlatList<Ayah>>(null);
  const mushafPagerRef = useRef<PagerView>(null);

  const isUserScrollingRef = useRef(false);
  const scrollOverrideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScrollBeginDrag = useCallback(() => {
    isUserScrollingRef.current = true;
    if (scrollOverrideTimeoutRef.current) {
      clearTimeout(scrollOverrideTimeoutRef.current);
    }
    scrollOverrideTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollOverrideTimeoutRef.current) {
        clearTimeout(scrollOverrideTimeoutRef.current);
      }
    };
  }, []);

  const [selectedAyah, setSelectedAyah] = useState<Ayah | null>(null);
  const [highlightedAyahNumber, setHighlightedAyahNumber] = useState<number | null>(
    targetAyahNumber ?? null
  );
  const [activeTajweedRule, setActiveTajweedRule] = useState<{
    rule: TajweedRuleInfo;
    matchedText: string;
  } | null>(null);
  const [tajweedLegendVisible, setTajweedLegendVisible] = useState(false);

  const handleRulePress = useCallback(
    (rule: TajweedRuleInfo, matchedText: string) => {
      setActiveTajweedRule({ rule, matchedText });
    },
    []
  );

  React.useEffect(() => {
    if (surahId) {
      const initialAyah = targetAyahNumber || 1;
      setLastRead(surahId, initialAyah);
      recordAyahRead(1);
    }
  }, [surahId, targetAyahNumber, setLastRead, recordAyahRead]);

  const handleSelectAyah = useCallback(
    (ayah: Ayah | null) => {
      setSelectedAyah(ayah);
      if (ayah) {
        setLastRead(surahId, ayah.ayahNumber);
        recordAyahRead(1);
      }
    },
    [surahId, setLastRead, recordAyahRead]
  );

  const handlePlayAyah = useCallback(
    (ayahNumber: number) => {
      if (isPlaying && isCurrentSurah && playingAyahNumber === ayahNumber) {
        void pauseAudio();
      } else {
        void playAyah(surahId, ayahNumber, defaultReciter);
        recordAyahRead(1);
      }
    },
    [isPlaying, isCurrentSurah, playingAyahNumber, surahId, defaultReciter, recordAyahRead]
  );

  const surah = useMemo(
    () => SURAHS_DATA.find((s) => s.id === surahId) ?? null,
    [surahId]
  );

  const { ayahs, translationsMap, isLoading } = useAyahs({
    surahId,
    language,
  });

  const mushafPages = useMemo<MushafPageData[]>(() => {
    const map = new Map<number, Ayah[]>();
    for (const ayah of ayahs) {
      const p = ayah.page;
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(ayah);
    }
    return Array.from(map.entries()).map(([pageNumber, pageAyahs]) => ({
      pageNumber,
      ayahs: pageAyahs,
    }));
  }, [ayahs]);

  // Precomputed layout metrics for FlatList instant O(1) jump
  const { itemHeights, itemOffsets } = useMemo(() => {
    const heights: number[] = [];
    const offsets: number[] = [];
    let currentY = headerHeight;

    const arabicLineHeight = Math.round(quranFontSize * 2.5);
    const contentWidth = Math.max(280, windowHeight > 0 ? windowWidth - 64 : 328);
    const arCharsPerLine = Math.max(18, Math.floor(contentWidth / (quranFontSize * 0.44)));
    const trCharsPerLine = Math.max(24, Math.floor(contentWidth / 7.6));

    for (let i = 0; i < ayahs.length; i++) {
      const a = ayahs[i];
      const t = translationsMap[a.id]?.text;

      const arTextLen = a.textUthmani?.length || 40;
      const arLines = Math.max(1, Math.ceil(arTextLen / arCharsPerLine));
      const trLines = t ? Math.max(1, Math.ceil(t.length / trCharsPerLine)) : 0;

      const ayahTextHeight = arLines * arabicLineHeight + 8;
      const transHeight = t ? trLines * 22 + 30 : 0;
      const cardHeight = 84 + ayahTextHeight + transHeight;

      heights.push(cardHeight);
      offsets.push(currentY);
      currentY += cardHeight;
    }

    return { itemHeights: heights, itemOffsets: offsets };
  }, [ayahs, translationsMap, headerHeight, windowWidth, windowHeight, quranFontSize]);

  const getTranslationItemLayout = useCallback(
    (_: any, index: number) => ({
      length: itemHeights[index] ?? 250,
      offset: itemOffsets[index] ?? headerHeight + index * 250,
      index,
    }),
    [itemHeights, itemOffsets, headerHeight]
  );



  const initialTranslationIndex = useMemo(() => {
    if (!targetAyahNumber || ayahs.length === 0) return undefined;
    const idx = ayahs.findIndex((a) => a.ayahNumber === targetAyahNumber);
    return idx >= 0 ? idx : undefined;
  }, [targetAyahNumber, ayahs]);

  const initialMushafIndex = useMemo(() => {
    if (!targetAyahNumber || mushafPages.length === 0) return undefined;
    const idx = mushafPages.findIndex((p) =>
      p.ayahs.some((a) => a.ayahNumber === targetAyahNumber)
    );
    return idx >= 0 ? idx : undefined;
  }, [targetAyahNumber, mushafPages]);

  const [currentMushafPageIndex, setCurrentMushafPageIndex] = useState<number>(
    () =>
      initialMushafIndex != null && initialMushafIndex < mushafPages.length
        ? initialMushafIndex
        : 0
  );

  // Set of page indices that have been rendered.
  // Mounts current and adjacent pages on demand, keeping previously rendered pages in memory.
  const [renderedPages, setRenderedPages] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    const start =
      initialMushafIndex != null && initialMushafIndex < mushafPages.length
        ? initialMushafIndex
        : 0;
    for (let i = Math.max(0, start - 1); i <= start + 1; i++) {
      initial.add(i);
    }
    return initial;
  });

  useEffect(() => {
    if (initialMushafIndex != null) {
      setCurrentMushafPageIndex(initialMushafIndex);
      setRenderedPages((prev) => {
        let changed = false;
        const next = new Set(prev);
        const start = Math.max(0, initialMushafIndex - 1);
        const end = initialMushafIndex + 1;
        for (let i = start; i <= end; i++) {
          if (!next.has(i)) {
            next.add(i);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [initialMushafIndex]);

  useEffect(() => {
    setRenderedPages((prev) => {
      let changed = false;
      const next = new Set(prev);
      const start = Math.max(0, currentMushafPageIndex - 1);
      const end = currentMushafPageIndex + 1;
      for (let i = start; i <= end; i++) {
        if (!next.has(i)) {
          next.add(i);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [currentMushafPageIndex]);

  const mushafPageHeight = useMemo(() => {
    const topOccupied = insets.top + 54 + 44;
    const bottomOccupied = Math.max(insets.bottom, 12) + (currentTrack ? 84 : 8) + 48;
    return Math.max(360, windowHeight - topOccupied - bottomOccupied);
  }, [windowHeight, insets.top, insets.bottom, currentTrack]);

  const handleFlipMushafPage = useCallback(
    (direction: 'prev' | 'next') => {
      const targetIdx =
        direction === 'next'
          ? currentMushafPageIndex + 1
          : currentMushafPageIndex - 1;
      if (targetIdx >= 0 && targetIdx < mushafPages.length) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        requestAnimationFrame(() => {
          mushafPagerRef.current?.setPage(targetIdx);
        });
      }
    },
    [currentMushafPageIndex, mushafPages.length]
  );

  const mushafPagesRef = useRef(mushafPages);
  mushafPagesRef.current = mushafPages;
  const surahIdRef = useRef(surahId);
  surahIdRef.current = surahId;
  const setLastReadRef = useRef(setLastRead);
  setLastReadRef.current = setLastRead;

  const lastReadDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (lastReadDebounceRef.current) {
        clearTimeout(lastReadDebounceRef.current);
      }
    };
  }, []);

  // Pre-warms in-memory Tajweed segments cache for current and nearby pages
  // Fully synchronous, in-memory string parsing (< 1ms), zero network/disk competition
  useEffect(() => {
    if (mushafPages.length === 0) return;
    preloadMushafPages(mushafPages, currentMushafPageIndex);
  }, [mushafPages, currentMushafPageIndex]);

  // Sub-pixel ground-truth alignment once target ayah layout measures
  const hasFineAdjustedRef = useRef(false);

  useEffect(() => {
    hasFineAdjustedRef.current = false;
  }, [targetAyahNumber, surahId]);

  const handleTargetAyahLayout = useCallback(
    (e: any) => {
      if (hasFineAdjustedRef.current || !targetAyahNumber) return;
      hasFineAdjustedRef.current = true;

      const { y: targetTop, height: targetHeight } = e.nativeEvent.layout;
      const topBarHeight = insets.top + 60;
      const bottomBarHeight = insets.bottom + 90;
      const effectiveViewport = windowHeight - topBarHeight - bottomBarHeight;

      let desiredOffset: number;
      if (targetHeight >= effectiveViewport * 0.75) {
        // Tall ayah (e.g. Ayat an-Nur 24:35 or Ayat al-Kursi 2:255):
        // Position top of ayah cleanly below the top glass bar with 14px breathing room
        desiredOffset = Math.max(0, targetTop - topBarHeight - 14);
      } else {
        // Normal ayah: place perfectly in vertical center of visible viewport
        desiredOffset = Math.max(
          0,
          targetTop + targetHeight / 2 - effectiveViewport / 2 - topBarHeight
        );
      }

      translationListRef.current?.scrollToOffset({
        offset: desiredOffset,
        animated: false,
      });
    },
    [targetAyahNumber, insets.top, insets.bottom, windowHeight]
  );

  // Gold highlight for target ayah
  useEffect(() => {
    if (!targetAyahNumber) {
      setHighlightedAyahNumber(null);
      return;
    }
    setHighlightedAyahNumber(targetAyahNumber);
    const timer = setTimeout(() => {
      setHighlightedAyahNumber(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [targetAyahNumber]);

  // Intelligent Autoscroll to active playing ayah with user drag override
  useEffect(() => {
    if (!isPlaying || !isCurrentSurah || playingAyahNumber == null) {
      return;
    }
    if (isUserScrollingRef.current) {
      return;
    }

    if (readingMode === 'translation' && translationListRef.current) {
      const index = ayahs.findIndex((a) => a.ayahNumber === playingAyahNumber);
      if (index !== -1) {
        try {
          translationListRef.current.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.35,
          });
        } catch {}
      }
    } else if (readingMode === 'mushaf' && mushafPagerRef.current) {
      const pageIndex = mushafPages.findIndex((p) =>
        p.ayahs.some((a) => a.ayahNumber === playingAyahNumber)
      );
      if (pageIndex !== -1 && pageIndex !== currentMushafPageIndex) {
        try {
          requestAnimationFrame(() => {
            mushafPagerRef.current?.setPage(pageIndex);
          });
          setCurrentMushafPageIndex(pageIndex);
        } catch {}
      }
    }
  }, [
    playingAyahNumber,
    isPlaying,
    isCurrentSurah,
    readingMode,
    ayahs,
    mushafPages,
    currentMushafPageIndex,
  ]);

  const localizedName = surah
    ? getSurahName(surah.nameTranslation, language)
    : `Surah ${surahId}`;

  // 1 = fully visible, 0 = hidden off-screen
  const controlsVisible = useSharedValue(1);
  const headerScrolledPast = useSharedValue(0);
  const prevScrollY = useRef(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const diff = currentY - prevScrollY.current;

      if (currentY <= 20) {
        // At the very top: show back button, hide center title
        controlsVisible.value = withSpring(1, { damping: 18, stiffness: 160 });
        headerScrolledPast.value = withTiming(0, { duration: 150 });
      } else if (diff > 6) {
        // Scrolling DOWN -> smoothly hide controls; do NOT flash center title
        if (controlsVisible.value !== 0) {
          controlsVisible.value = withTiming(0, { duration: 200 });
        }
        if (headerScrolledPast.value !== 0) {
          headerScrolledPast.value = withTiming(0, { duration: 100 });
        }
      } else if (diff < -6) {
        // Scrolling UP -> reveal controls
        if (controlsVisible.value !== 1) {
          controlsVisible.value = withTiming(1, { duration: 200 });
        }
        // Only show center surah title if big green card has passed (~200px)
        if (currentY > 200) {
          if (headerScrolledPast.value !== 1) {
            headerScrolledPast.value = withTiming(1, { duration: 200 });
          }
        } else {
          if (headerScrolledPast.value !== 0) {
            headerScrolledPast.value = withTiming(0, { duration: 150 });
          }
        }
      }

      prevScrollY.current = currentY;
    },
    [controlsVisible, headerScrolledPast]
  );

  const centerTitleStyle = useAnimatedStyle(() => {
    const isMushaf = readingMode === 'mushaf';
    const showHeader = isMushaf ? 1 : headerScrolledPast.value;
    return {
      opacity: showHeader * controlsVisible.value,
      transform: [
        {
          translateY: interpolate(
            showHeader,
            [0, 1],
            [-8, 0],
            Extrapolation.CLAMP
          ),
        },
        {
          scale: interpolate(
            showHeader,
            [0, 1],
            [0.9, 1],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  }, [readingMode]);

  const backButtonStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          controlsVisible.value,
          [0, 1],
          [-70, 0],
          Extrapolation.CLAMP
        ),
      },
      {
        scale: interpolate(
          controlsVisible.value,
          [0, 1],
          [0.85, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
    opacity: interpolate(
      controlsVisible.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const bottomPlayerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          controlsVisible.value,
          [0, 1],
          [100, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
    opacity: interpolate(
      controlsVisible.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const renderHeader = useCallback(
    () => (
      <View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - headerHeight) > 10) {
            setHeaderHeight(h);
          }
        }}
        style={{ paddingTop: insets.top + 52 }}
      >
        {surah ? <SurahHeader surah={surah} /> : null}
        <ReadingModeToggle
          mode={readingMode}
          onModeChange={setReadingMode}
        />
      </View>
    ),
    [insets.top, surah, readingMode, setReadingMode, headerHeight]
  );

  const renderFooter = useCallback(
    () => <View style={{ height: spacing.xxxl + spacing.xl }} />,
    [spacing]
  );

  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      setTimeout(() => {
        if (readingMode === 'translation' && translationListRef.current) {
          try {
            translationListRef.current.scrollToIndex({
              index: info.index,
              animated: false,
              viewPosition: 0.35,
            });
          } catch {}
        }
      }, 50);
    },
    [readingMode]
  );

  const renderTranslationItem = useCallback(
    ({ item, index }: { item: Ayah; index: number }) => {
      const translation = translationsMap[item.id];
      const isLastOnPage =
        index === ayahs.length - 1 || ayahs[index + 1]?.page !== item.page;
      const isCurrentPlaying =
        isPlaying && isCurrentSurah && item.ayahNumber === playingAyahNumber;
      const isHighlighted = item.ayahNumber === highlightedAyahNumber;
      const isTarget = item.ayahNumber === targetAyahNumber;

      return (
        <TranslationAyahCard
          item={item}
          translation={translation}
          isLastOnPage={isLastOnPage}
          isCurrentPlaying={Boolean(isCurrentPlaying)}
          isHighlighted={isHighlighted}
          quranFontSize={quranFontSize}
          showTajweed={showTajweed}
          showTranslation={showTranslation}
          surfaceColor={colors.surface}
          borderColor={colors.border}
          secondaryColor={colors.secondary}
          primaryColor={colors.primary}
          isDark={isDark}
          borderRadius={radius.lg}
          shadowSoft={shadows.soft}
          paddingMd={spacing.md}
          marginBottomSm={spacing.sm}
          paddingHorizontalMd={spacing.md}
          onPlayAyah={handlePlayAyah}
          onSelectAyah={handleSelectAyah}
          onPressRule={handleRulePress}
          onLayout={isTarget ? handleTargetAyahLayout : undefined}
        />
      );
    },
    [
      ayahs,
      translationsMap,
      isPlaying,
      isCurrentSurah,
      playingAyahNumber,
      highlightedAyahNumber,
      targetAyahNumber,
      quranFontSize,
      showTajweed,
      showTranslation,
      colors.surface,
      colors.border,
      colors.secondary,
      colors.primary,
      isDark,
      radius.lg,
      shadows.soft,
      spacing.md,
      spacing.sm,
      handlePlayAyah,
      handleSelectAyah,
      handleRulePress,
      handleTargetAyahLayout,
    ]
  );



  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floating Glass Navigation Bar (Back Button + Center Surah Title) */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.floatingTopBar,
          { top: Math.max(insets.top, 16) + 4 },
          backButtonStyle,
        ]}
      >
        <AnimatedPressable
          onPress={() => router.back()}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <GlassView borderRadius={22} style={styles.backButtonGlass}>
            <Ionicons
              name="chevron-back"
              size={22}
              color={colors.primary}
              style={{ marginStart: -1 }}
            />
          </GlassView>
        </AnimatedPressable>

        {/* Center Surah Name (Appears when big green card is scrolled away) */}
        <Animated.View
          pointerEvents="none"
          style={[styles.centerTitleWrapper, centerTitleStyle]}
        >
          <GlassView borderRadius={20} style={styles.centerTitleGlass}>
            <Text
              style={[styles.centerTitleText, { color: colors.text }]}
              numberOfLines={1}
            >
              {localizedName}
            </Text>
            {surah?.nameArabic ? (
              <Text
                style={[
                  styles.centerArabicText,
                  { color: colors.primary, fontFamily: fontFamilies.arabic },
                ]}
                numberOfLines={1}
              >
                {surah.nameArabic}
              </Text>
            ) : null}
          </GlassView>
        </Animated.View>

        {/* Right Action: Tajweed Guide & Palette Toggle */}
        <AnimatedPressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTajweedLegendVisible(true);
          }}
          haptic="light"
          accessibilityLabel="Таджвид"
          accessibilityRole="button"
        >
          <GlassView borderRadius={22} style={styles.tajweedButtonGlass}>
            <Ionicons
              name="color-palette-outline"
              size={20}
              color={showTajweed ? colors.secondary : colors.textSecondary}
            />
          </GlassView>
        </AnimatedPressable>
      </Animated.View>

      {isLoading ? (
        <View style={{ paddingTop: insets.top + 64, paddingHorizontal: spacing.md }}>
          <AyahSkeleton />
          <AyahSkeleton />
        </View>
      ) : readingMode === 'mushaf' ? (
        <View style={{ flex: 1 }}>
          {/* Top Reading Mode Toggle */}
          <View
            style={{
              paddingTop: insets.top + 54,
              paddingBottom: 6,
              paddingHorizontal: 16,
            }}
          >
            <ReadingModeToggle
              mode={readingMode}
              onModeChange={setReadingMode}
            />
          </View>

          {/* Native High-Performance Medina Book Pager (60-120fps hardware accelerated) */}
          <PagerView
            ref={mushafPagerRef}
            style={{ flex: 1 }}
            initialPage={
              initialMushafIndex != null && initialMushafIndex < mushafPages.length
                ? initialMushafIndex
                : 0
            }
            layoutDirection="rtl"
            offscreenPageLimit={1}
            overScrollMode="never"
            onPageSelected={(e) => {
              const pageIdx = e.nativeEvent.position;
              setCurrentMushafPageIndex(pageIdx);
              if (lastReadDebounceRef.current) {
                clearTimeout(lastReadDebounceRef.current);
              }
              lastReadDebounceRef.current = setTimeout(() => {
                const pages = mushafPagesRef.current;
                const firstAyahOfPage = pages[pageIdx]?.ayahs[0];
                if (firstAyahOfPage && surahIdRef.current) {
                  setLastReadRef.current(surahIdRef.current, firstAyahOfPage.ayahNumber);
                }
              }, 800);
            }}
          >
            {mushafPages.map((item, index) => (
              <MushafPageItem
                key={`mushaf-page-${item.pageNumber}`}
                item={item}
                isRendered={renderedPages.has(index)}
                windowWidth={windowWidth}
                mushafPageHeight={mushafPageHeight}
                quranFontSize={quranFontSize}
                showTajweed={showTajweed}
                selectedAyahId={selectedAyah?.id}
                activeAyahNumber={highlightedAyahNumber}
                playingAyahNumber={
                  isPlaying && isCurrentSurah ? playingAyahNumber : null
                }
                onSelectAyah={handleSelectAyah}
                onPressRule={handleRulePress}
              />
            ))}
          </PagerView>

          {/* Bottom Medina Book Navigation Bar (Authentic RTL: Left advances Next, Right goes Prev) */}
          <View
            style={[
              styles.mushafBottomNav,
              {
                paddingBottom:
                  Math.max(insets.bottom, 12) + (currentTrack ? 84 : 8),
              },
            ]}
          >
            {/* Left Button: Next Page (advances forward in Arabic reading order) */}
            <AnimatedPressable
              onPress={() => handleFlipMushafPage('next')}
              disabled={currentMushafPageIndex >= mushafPages.length - 1}
              style={[
                styles.mushafPageBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity:
                    currentMushafPageIndex >= mushafPages.length - 1
                      ? 0.35
                      : 1,
                },
              ]}
              accessibilityLabel="Следующая страница"
              accessibilityRole="button"
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={colors.primary}
              />
            </AnimatedPressable>

            <View
              style={[
                styles.mushafPageCounter,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.mushafPageCounterText,
                  { color: colors.textSecondary },
                ]}
              >
                {t('quran.page', 'Стр.')}{' '}
                <Text style={{ color: colors.secondary, fontWeight: '700' }}>
                  {mushafPages[currentMushafPageIndex]?.pageNumber ??
                    surah?.pageStart ??
                    1}
                </Text>
                {'  •  '}
                {currentMushafPageIndex + 1} / {Math.max(1, mushafPages.length)}
              </Text>
            </View>

            {/* Right Button: Previous Page (goes backward toward the beginning) */}
            <AnimatedPressable
              onPress={() => handleFlipMushafPage('prev')}
              disabled={currentMushafPageIndex === 0}
              style={[
                styles.mushafPageBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: currentMushafPageIndex === 0 ? 0.35 : 1,
                },
              ]}
              accessibilityLabel="Предыдущая страница"
              accessibilityRole="button"
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary}
              />
            </AnimatedPressable>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList<Ayah>
            ref={translationListRef}
            data={ayahs}
            renderItem={renderTranslationItem}
            keyExtractor={(item) => `ayah-${item.id}`}
            getItemLayout={getTranslationItemLayout}
            initialScrollIndex={initialTranslationIndex}
            initialNumToRender={
              initialTranslationIndex != null
                ? Math.min(ayahs.length, initialTranslationIndex + 4)
                : 8
            }
            maxToRenderPerBatch={8}
            windowSize={7}
            removeClippedSubviews={Platform.OS === 'android'}
            onScrollToIndexFailed={handleScrollToIndexFailed}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            onScroll={handleScroll}
            onScrollBeginDrag={handleScrollBeginDrag}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
          />
        </View>
      )}

      {/* Contextual Ayah Action Bar (Copy, Bookmark, Play) */}
      {selectedAyah ? (
        <AyahActionBar
          ayah={selectedAyah}
          surahName={localizedName}
          surahArabic={surah?.nameArabic}
          translationText={translationsMap[selectedAyah.id]?.text}
          onClose={() => setSelectedAyah(null)}
          onPlay={() => {
            void playAyah(surahId, selectedAyah.ayahNumber, defaultReciter);
            recordAyahRead(1);
          }}
        />
      ) : null}

      {/* Collapsible Floating Audio Player */}
      {!selectedAyah && currentTrack && (
        <Animated.View style={bottomPlayerStyle}>
          <FloatingAudioPlayer
            surahId={surahId}
            surahName={localizedName}
            totalAyahs={surah?.ayahCount}
          />
        </Animated.View>
      )}

      {/* Interactive Tajweed Info Modal (Tap on colored rule in text) */}
      <TajweedInfoModal
        visible={activeTajweedRule != null}
        rule={activeTajweedRule?.rule ?? null}
        matchedText={activeTajweedRule?.matchedText}
        onClose={() => setActiveTajweedRule(null)}
      />

      {/* Tajweed Color Legend & Quick Toggle Modal */}
      <TajweedLegendModal
        visible={tajweedLegendVisible}
        onClose={() => setTajweedLegendVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingTopBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButtonGlass: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTitleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTitleGlass: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  centerTitleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  centerArabicText: {
    fontSize: 17,
    fontWeight: '600',
  },
  topBarSpacer: {
    width: 44,
    height: 44,
  },
  tajweedButtonGlass: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahCard: {},
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ayahBadgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  ayahBadgeCircleGlow: {
    shadowColor: '#D4A745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },
  ayahBadgeNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardOptionsBtn: {
    padding: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mushafBottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 6,
  },
  mushafPageBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mushafPageCounter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mushafPageCounterText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default SurahDetailScreen;
