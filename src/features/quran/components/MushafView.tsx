import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/shared/theme';
import { toArabicDigits } from '@/features/quran/utils/quranUtils';
import { SURAHS_DATA } from '@/features/quran/data/surahsData';
import type { Ayah } from '@/db/schema';
import {
  getPageTajweedSegments,
  type TajweedRuleInfo,
  type TajweedSegment,
} from '../services/tajweedParser';

export interface MushafViewProps {
  ayahs: Ayah[];
  pageNumber: number;
  width: number;
  height?: number;
  fontSize?: number;
  showTajweed?: boolean;
  selectedAyahId?: number | null;
  activeAyahNumber?: number | null;
  playingAyahNumber?: number | null;
  onSelectAyah?: (ayah: Ayah) => void;
  onPressRule?: (rule: TajweedRuleInfo, matchedText: string) => void;
  style?: StyleProp<ViewStyle>;
}

export const MushafView = React.memo<MushafViewProps>(
  ({
    ayahs,
    pageNumber,
    width,
    height,
    fontSize = 24,
    showTajweed = true,
    selectedAyahId,
    activeAyahNumber,
    playingAyahNumber,
    onSelectAyah,
    onPressRule,
    style,
  }) => {
    const { colors, fontFamilies, shadows, radius, isDark } = useTheme();

    const firstAyah = ayahs[0];
    const surahId = firstAyah?.surahId ?? 1;
    const juzNumber = firstAyah?.juz ?? 1;

    const surah = useMemo(
      () => SURAHS_DATA.find((s) => s.id === surahId) ?? null,
      [surahId]
    );

    // Calculate adaptive font size and line height so all 15 Medina lines fit cleanly
    const availableHeight = height ? height - 90 : 540;
    const targetLineHeight = Math.max(26, Math.min(Math.floor(availableHeight / 15.5), 44));
    const textFontSize = Math.min(fontSize, Math.round(targetLineHeight / 1.75));
    const lineHeight = targetLineHeight;

    // Check if this page contains the start of a Surah (memoized)
    const { hasSurahStart, showBismillah, ayahsBeforeStart, ayahsFromStart } =
      useMemo(() => {
        const start = ayahs.find((a) => a.ayahNumber === 1);
        const hasStart = Boolean(start);
        const bismillah = hasStart && surahId !== 9 && surahId !== 1;
        const before = hasStart
          ? ayahs.filter((a) => a.surahId < start!.surahId)
          : [];
        const from = hasStart
          ? ayahs.filter((a) => a.surahId >= start!.surahId)
          : ayahs;
        return {
          hasSurahStart: hasStart,
          showBismillah: bismillah,
          ayahsBeforeStart: before,
          ayahsFromStart: from,
        };
      }, [ayahs, surahId]);

    // Page-level cache lives in tajweedParser — this is a Map hit after preload.
    const ayahSegmentsMap = useMemo(
      () => getPageTajweedSegments(pageNumber, ayahs, showTajweed),
      [ayahs, pageNumber, showTajweed]
    );

    const plainPageText = useCallback(
      (list: Ayah[]) =>
        list
          .map((a) => `${a.textUthmani} ﴿${toArabicDigits(a.ayahNumber)}﴾ `)
          .join(''),
      []
    );

    const renderAyahText = useCallback(
      (ayah: Ayah) => {
        const isSelected = selectedAyahId === ayah.id;
        const isPlaying =
          playingAyahNumber != null && playingAyahNumber === ayah.ayahNumber;
        const isActive = isPlaying || activeAyahNumber === ayah.ayahNumber;

        const segments = ayahSegmentsMap.get(ayah.id) || [{ text: ayah.textUthmani }];

        return (
          <Text
            key={ayah.id}
            maxFontSizeMultiplier={1}
            style={[
              styles.ayahSpan,
              (isSelected || isActive) && [
                styles.ayahSelected,
                {
                  backgroundColor: isSelected
                    ? isDark
                      ? 'rgba(212, 167, 69, 0.38)'
                      : 'rgba(212, 167, 69, 0.28)'
                    : isPlaying
                    ? isDark
                      ? 'rgba(212, 167, 69, 0.25)'
                      : 'rgba(212, 167, 69, 0.18)'
                    : isDark
                    ? 'rgba(212, 167, 69, 0.22)'
                    : 'rgba(212, 167, 69, 0.14)',
                },
              ],
            ]}
          >
            {segments.map((seg, sIdx) => {
              const isRule = showTajweed && seg.rule != null;
              if (!isRule) {
                return seg.text;
              }
              return (
                <Text
                  key={sIdx}
                  suppressHighlighting={true}
                  style={{
                    color: isDark ? seg.rule!.darkColor : seg.rule!.lightColor,
                    fontFamily: fontFamilies.quran,
                  }}
                >
                  {seg.text}
                </Text>
              );
            })}
            <Text
              style={[
                styles.ayahBadge,
                isSelected && styles.ayahBadgeSelected,
                {
                  color: isSelected ? colors.primary : colors.secondary,
                  fontFamily: fontFamilies.arabic,
                  fontSize: Math.round(textFontSize * 0.82),
                },
              ]}
            >
              {` ﴿${toArabicDigits(ayah.ayahNumber)}﴾ `}
            </Text>
          </Text>
        );
      },
      [
        selectedAyahId,
        playingAyahNumber,
        activeAyahNumber,
        ayahSegmentsMap,
        onSelectAyah,
        isDark,
        showTajweed,
        colors.quranText,
        colors.secondary,
        fontFamilies.quran,
        fontFamilies.arabic,
        textFontSize,
      ]
    );

    const cardBgColor = isDark ? '#141C18' : '#FBF9F5';
    const cardBorderColor = isDark
      ? 'rgba(212, 167, 69, 0.26)'
      : 'rgba(212, 167, 69, 0.38)';

    return (
      <View style={[{ width, flex: 1, paddingHorizontal: 12 }, style]}>
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
          {/* Top Medina Page Header: Juz on Left, Surah on Right */}
          <View style={styles.pageHeaderRow}>
            <Text
              style={[
                styles.pageHeaderMeta,
                { color: colors.secondary, fontFamily: fontFamilies.arabic },
              ]}
            >
              الجزء {toArabicDigits(juzNumber)}
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
              {surah?.nameArabic ? `سُورَةُ ${surah.nameArabic}` : ''}
            </Text>
          </View>

          <View
            style={[
              styles.headerDividerLine,
              { backgroundColor: colors.secondary + '30' },
            ]}
          />

          {/* Main Book Page Content */}
          <View style={styles.scrollContent} pointerEvents="none">
            {/* Any ayahs before new Surah starts */}
            {ayahsBeforeStart.length > 0 ? (
              <Text
                maxFontSizeMultiplier={1}
                style={[
                  styles.continuousText,
                  {
                    fontFamily: fontFamilies.quran,
                    fontSize: textFontSize,
                    lineHeight,
                    color: colors.quranText,
                  },
                ]}
              >
                {showTajweed
                  ? ayahsBeforeStart.map(renderAyahText)
                  : plainPageText(ayahsBeforeStart)}
              </Text>
            ) : null}

            {/* Decorative Surah Banner if Ayah 1 is on this page */}
            {hasSurahStart && surah ? (
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
                        color: colors.secondary,
                        fontFamily: fontFamilies.arabic,
                      },
                    ]}
                  >
                    سُورَةُ {surah.nameArabic}
                  </Text>
                </View>

                {showBismillah ? (
                  <Text
                    style={[
                      styles.bismillahText,
                      {
                        color: colors.quranText,
                        fontFamily: fontFamilies.quran,
                        fontSize: Math.round(textFontSize * 1.05),
                      },
                    ]}
                  >
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* Main continuous text of the page */}
            <Text
              maxFontSizeMultiplier={1}
              style={[
                styles.continuousText,
                {
                  fontFamily: fontFamilies.quran,
                  fontSize: textFontSize,
                  lineHeight,
                  color: colors.quranText,
                },
              ]}
            >
              {showTajweed
                ? ayahsFromStart.map(renderAyahText)
                : plainPageText(ayahsFromStart)}
            </Text>
          </View>

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
              — {toArabicDigits(pageNumber)} —
            </Text>
          </View>
        </View>
      </View>
    );
  },
  (prev, next) =>
    prev.pageNumber === next.pageNumber &&
    prev.width === next.width &&
    prev.height === next.height &&
    prev.fontSize === next.fontSize &&
    prev.showTajweed === next.showTajweed &&
    prev.selectedAyahId === next.selectedAyahId &&
    prev.activeAyahNumber === next.activeAyahNumber &&
    prev.playingAyahNumber === next.playingAyahNumber &&
    prev.onSelectAyah === next.onSelectAyah &&
    prev.onPressRule === next.onPressRule &&
    prev.ayahs === next.ayahs
);

const styles = StyleSheet.create({
  bookPageCard: {
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    flex: 1,
    overflow: 'hidden',
  },
  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  pageHeaderMeta: {
    fontSize: 14,
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
  scrollContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  continuousText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  ayahSpan: {},
  ayahSelected: {
    borderRadius: 6,
  },
  ayahBadge: {
    fontWeight: '700',
    includeFontPadding: false,
    paddingHorizontal: 2,
  },
  ayahBadgeSelected: {
    textDecorationLine: 'underline',
  },
  surahBannerWrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
  surahBannerFrame: {
    width: '100%',
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  bismillahText: {
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 8,
    marginBottom: 4,
  },
  footerDividerLine: {
    height: StyleSheet.hairlineWidth * 1.5,
    marginVertical: 4,
  },
  pageFooterRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  pageNumberText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

