import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import type { Ayah } from '@/db/schema';
import { MushafView } from './MushafView';
import {
  MushafRollingPager,
  type MushafRollingPagerRef,
} from './MushafRollingPager';
import type { TajweedRuleInfo } from '../services/tajweedParser';
import { preloadMushafPagesDeferred } from '../services/pagePreloader';

export interface MushafPageData {
  pageNumber: number;
  ayahs: Ayah[];
}

const mushafPageFlexStyle = { flex: 1 } as const;

interface MushafPageItemProps {
  item: MushafPageData;
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
      <View style={{ flex: 1, width: windowWidth }} collapsable={false}>
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
      </View>
    );
  },
  (prev, next) =>
    prev.item.pageNumber === next.item.pageNumber &&
    prev.windowWidth === next.windowWidth &&
    prev.mushafPageHeight === next.mushafPageHeight &&
    prev.quranFontSize === next.quranFontSize &&
    prev.showTajweed === next.showTajweed &&
    prev.selectedAyahId === next.selectedAyahId &&
    prev.activeAyahNumber === next.activeAyahNumber &&
    prev.playingAyahNumber === next.playingAyahNumber &&
    prev.onSelectAyah === next.onSelectAyah &&
    prev.onPressRule === next.onPressRule &&
    prev.item.ayahs === next.item.ayahs
);

export interface MushafBookViewProps {
  pages: MushafPageData[];
  windowWidth: number;
  mushafPageHeight: number;
  quranFontSize: number;
  showTajweed: boolean;
  selectedAyahId?: number | null;
  highlightedAyahNumber?: number | null;
  playingAyahNumber?: number | null;
  onSelectAyah: (ayah: Ayah | null) => void;
  onPressRule: (rule: TajweedRuleInfo, matchedText: string) => void;
  initialPageIndex: number;
  pagerRef: React.Ref<MushafRollingPagerRef>;
  onPageIdle?: (index: number) => void;
  surahPageStart?: number;
}

/**
 * Owns mushaf page HUD state so SurahDetailScreen does not re-render on every swipe.
 * Neighbors drop colored tajweed while the user is flicking; current page stays colored.
 */
export const MushafBookView = React.memo<MushafBookViewProps>(
  function MushafBookView({
    pages,
    windowWidth,
    mushafPageHeight,
    quranFontSize,
    showTajweed,
    selectedAyahId,
    highlightedAyahNumber,
    playingAyahNumber,
    onSelectAyah,
    onPressRule,
    initialPageIndex,
    pagerRef,
    onPageIdle,
    surahPageStart,
  }) {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { t } = useTranslation();

    const [hudPageIndex, setHudPageIndex] = useState(initialPageIndex);
    const [plainNeighbors, setPlainNeighbors] = useState(true);
    const hudRef = useRef(hudPageIndex);
    hudRef.current = hudPageIndex;
    const pagesRef = useRef(pages);
    pagesRef.current = pages;
    const onPageIdleRef = useRef(onPageIdle);
    onPageIdleRef.current = onPageIdle;

    useEffect(() => {
      setHudPageIndex(initialPageIndex);
    }, [initialPageIndex]);

    useEffect(() => {
      setPlainNeighbors(true);
      const timer = setTimeout(() => setPlainNeighbors(false), 90);
      return () => clearTimeout(timer);
    }, [pages]);

    const pageLookup = useMemo(
      () =>
        pages.map((page) => ({
          ayahNumbers: new Set(page.ayahs.map((a) => a.ayahNumber)),
          ayahIds: new Set(page.ayahs.map((a) => a.id)),
        })),
      [pages]
    );

    const handlePageChange = useCallback((pageIdx: number) => {
      hudRef.current = pageIdx;
      setHudPageIndex(pageIdx);
      onPageIdleRef.current?.(pageIdx);
    }, []);

    const handleRapidPaging = useCallback((rapid: boolean) => {
      setPlainNeighbors(rapid);
    }, []);

    const handleFlip = useCallback((direction: 'prev' | 'next') => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      requestAnimationFrame(() => {
        const ref = pagerRef as React.RefObject<MushafRollingPagerRef | null>;
        ref.current?.flipPage(direction);
      });
    }, [pagerRef]);

    const renderPage = useCallback(
      (index: number) => {
        const item = pages[index];
        if (!item) return null;

        const isCurrent = index === hudRef.current;
        const lookup = pageLookup[index];
        const pageSelectedAyahId =
          selectedAyahId != null && lookup?.ayahIds.has(selectedAyahId)
            ? selectedAyahId
            : null;
        const pageActiveAyahNumber =
          highlightedAyahNumber != null &&
          lookup?.ayahNumbers.has(highlightedAyahNumber)
            ? highlightedAyahNumber
            : null;
        const pagePlayingAyahNumber =
          playingAyahNumber != null && lookup?.ayahNumbers.has(playingAyahNumber)
            ? playingAyahNumber
            : null;

        return (
          <MushafPageItem
            item={item}
            windowWidth={windowWidth}
            mushafPageHeight={mushafPageHeight}
            quranFontSize={quranFontSize}
            showTajweed={showTajweed && (!plainNeighbors || isCurrent)}
            selectedAyahId={pageSelectedAyahId}
            activeAyahNumber={pageActiveAyahNumber}
            playingAyahNumber={pagePlayingAyahNumber}
            onSelectAyah={onSelectAyah}
            onPressRule={onPressRule}
          />
        );
      },
      [
        pages,
        pageLookup,
        selectedAyahId,
        highlightedAyahNumber,
        playingAyahNumber,
        windowWidth,
        mushafPageHeight,
        quranFontSize,
        showTajweed,
        plainNeighbors,
        onSelectAyah,
        onPressRule,
      ]
    );

    if (pages.length === 0) {
      return <View style={styles.fill} />;
    }

    return (
      <View style={styles.fill}>
        <MushafRollingPager
          ref={pagerRef}
          pageCount={pages.length}
          pageIndex={initialPageIndex}
          onPageChange={handlePageChange}
          onPageScrollIdle={(idx) => {
            preloadMushafPagesDeferred(pagesRef.current, idx);
          }}
          onRapidPagingChange={handleRapidPaging}
          renderPage={renderPage}
          layoutDirection="rtl"
        />

        <View
          style={[
            styles.mushafBottomNav,
            { paddingBottom: Math.max(insets.bottom, 12) + 84 },
          ]}
        >
          <AnimatedPressable
            onPress={() => handleFlip('next')}
            disabled={hudPageIndex >= pages.length - 1}
            style={[
              styles.mushafPageBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: hudPageIndex >= pages.length - 1 ? 0.35 : 1,
              },
            ]}
            accessibilityLabel="Следующая страница"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
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
                {pages[hudPageIndex]?.pageNumber ?? surahPageStart ?? 1}
              </Text>
              {'  •  '}
              {hudPageIndex + 1} / {Math.max(1, pages.length)}
            </Text>
          </View>

          <AnimatedPressable
            onPress={() => handleFlip('prev')}
            disabled={hudPageIndex === 0}
            style={[
              styles.mushafPageBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: hudPageIndex === 0 ? 0.35 : 1,
              },
            ]}
            accessibilityLabel="Предыдущая страница"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </AnimatedPressable>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  fill: {
    flex: 1,
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
