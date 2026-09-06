import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
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
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
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

interface TranslationAyahCardProps {
  item: Ayah;
  translation?: { text: string; translator: string };
  isLastOnPage: boolean;
  isCurrentPlaying: boolean;
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
}

const TranslationAyahCard = React.memo<TranslationAyahCardProps>(
  ({
    item,
    translation,
    isLastOnPage,
    isCurrentPlaying,
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
      : surfaceColor;

    const cardBorderColor = isCurrentPlaying ? secondaryColor : borderColor;
    const cardBorderWidth = isCurrentPlaying ? 2 : 1;

    const cardShadow = isCurrentPlaying
      ? {
          shadowColor: secondaryColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.35 : 0.25,
          shadowRadius: 10,
          elevation: 6,
        }
      : shadowSoft;

    return (
      <View style={{ paddingHorizontal: paddingHorizontalMd }}>
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const surahId = parseInt(id ?? '1', 10);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius, shadows, fontFamilies, isDark } = useTheme();

  const {
    readingMode,
    setReadingMode,
    language,
    quranFontSize,
    showTajweed,
    showTranslation,
    defaultReciter,
    setLastRead,
  } = useSettingsStore();

  const recordAyahRead = useProgressStore((s) => s.recordAyahRead);
  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);

  const isCurrentSurah = currentTrack?.surahId === surahId;
  const playingAyahNumber = isCurrentSurah ? currentTrack?.ayahNumber : undefined;

  const translationListRef = useRef<FlashListRef<Ayah>>(null);
  const mushafListRef = useRef<FlashListRef<MushafPageData>>(null);

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
      setLastRead(surahId, 1);
      recordAyahRead(1);
    }
  }, [surahId, setLastRead, recordAyahRead]);

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
            viewPosition: 0.25,
          });
        } catch {}
      }
    } else if (readingMode === 'mushaf' && mushafListRef.current) {
      const pageIndex = mushafPages.findIndex((p) =>
        p.ayahs.some((a) => a.ayahNumber === playingAyahNumber)
      );
      if (pageIndex !== -1) {
        try {
          mushafListRef.current.scrollToIndex({
            index: pageIndex,
            animated: true,
            viewPosition: 0.25,
          });
        } catch {}
      }
    }
  }, [playingAyahNumber, isPlaying, isCurrentSurah, readingMode, ayahs, mushafPages]);

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

  const centerTitleStyle = useAnimatedStyle(() => ({
    opacity: headerScrolledPast.value * controlsVisible.value,
    transform: [
      {
        translateY: interpolate(
          headerScrolledPast.value,
          [0, 1],
          [-8, 0],
          Extrapolation.CLAMP
        ),
      },
      {
        scale: interpolate(
          headerScrolledPast.value,
          [0, 1],
          [0.9, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

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
      <View style={{ paddingTop: insets.top + 52 }}>
        {surah ? <SurahHeader surah={surah} /> : null}
        <ReadingModeToggle
          mode={readingMode}
          onModeChange={setReadingMode}
        />
      </View>
    ),
    [insets.top, surah, readingMode, setReadingMode]
  );

  const renderFooter = useCallback(
    () => <View style={{ height: spacing.xxxl + spacing.xl }} />,
    [spacing]
  );

  const renderTranslationItem = useCallback(
    ({ item, index }: { item: Ayah; index: number }) => {
      const translation = translationsMap[item.id];
      const isLastOnPage =
        index === ayahs.length - 1 || ayahs[index + 1]?.page !== item.page;
      const isCurrentPlaying =
        isPlaying && isCurrentSurah && item.ayahNumber === playingAyahNumber;

      return (
        <TranslationAyahCard
          item={item}
          translation={translation}
          isLastOnPage={isLastOnPage}
          isCurrentPlaying={Boolean(isCurrentPlaying)}
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
        />
      );
    },
    [
      ayahs,
      translationsMap,
      isPlaying,
      isCurrentSurah,
      playingAyahNumber,
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
    ]
  );

  const renderMushafItem = useCallback(
    ({ item }: { item: MushafPageData }) => {
      return (
        <MushafView
          ayahs={item.ayahs}
          fontSize={quranFontSize}
          pageNumber={item.pageNumber}
          showDivider={true}
          showTajweed={showTajweed}
          selectedAyahId={selectedAyah?.id}
          playingAyahNumber={
            isPlaying && isCurrentSurah ? playingAyahNumber : null
          }
          onSelectAyah={handleSelectAyah}
          onPressRule={handleRulePress}
        />
      );
    },
    [
      quranFontSize,
      showTajweed,
      selectedAyah?.id,
      handleSelectAyah,
      isPlaying,
      isCurrentSurah,
      playingAyahNumber,
      handleRulePress,
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
        <Animated.View
          key="mushaf-list"
          style={{ flex: 1 }}
          entering={FadeIn.duration(240)}
          exiting={FadeOut.duration(160)}
        >
          <FlashList<MushafPageData>
            ref={mushafListRef}
            data={mushafPages}
            renderItem={renderMushafItem}
            keyExtractor={(item) => `mushaf-page-${item.pageNumber}`}
            drawDistance={800}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            onScroll={handleScroll}
            onScrollBeginDrag={handleScrollBeginDrag}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
          />
        </Animated.View>
      ) : (
        <Animated.View
          key="translation-list"
          style={{ flex: 1 }}
          entering={FadeIn.duration(240)}
          exiting={FadeOut.duration(160)}
        >
          <FlashList<Ayah>
            ref={translationListRef}
            data={ayahs}
            renderItem={renderTranslationItem}
            keyExtractor={(item) => `ayah-${item.id}`}
            drawDistance={800}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            onScroll={handleScroll}
            onScrollBeginDrag={handleScrollBeginDrag}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            overScrollMode="never"
          />
        </Animated.View>
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
      {!selectedAyah && (
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
});

export default SurahDetailScreen;
