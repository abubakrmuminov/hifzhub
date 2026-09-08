import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/shared/theme';
import { toArabicDigits } from '@/features/quran/utils/quranUtils';
import { SURAHS_DATA } from '@/features/quran/data/surahsData';
import type { Ayah } from '@/db/schema';
import {
  getAyahTajweedSegments,
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

    const handleRulePress = (rule: TajweedRuleInfo, matchedText: string) => {
      if (!onPressRule) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPressRule(rule, matchedText);
    };

    // Check if this page contains the start of a Surah
    const startAyah = ayahs.find((a) => a.ayahNumber === 1);
    const hasSurahStart = Boolean(startAyah);
    const showBismillah = hasSurahStart && surahId !== 9 && surahId !== 1;

    // Separate ayahs before Surah start (if page spans across two surahs)
    const ayahsBeforeStart = hasSurahStart
      ? ayahs.filter((a) => a.surahId < startAyah!.surahId)
      : [];
    const ayahsFromStart = hasSurahStart
      ? ayahs.filter((a) => a.surahId >= startAyah!.surahId)
      : ayahs;

    // Precompute and memoize Tajweed segments for all ayahs on this page
    const ayahSegmentsMap = useMemo(() => {
      const map = new Map<number, TajweedSegment[]>();
      for (const a of ayahs) {
        map.set(
          a.id,
          showTajweed
            ? getAyahTajweedSegments(a.surahId, a.ayahNumber, a.textUthmani)
            : [{ text: a.textUthmani }]
        );
      }
      return map;
    }, [ayahs, showTajweed]);

    const renderAyahText = (ayah: Ayah) => {
      const isSelected = selectedAyahId === ayah.id;
      const isPlaying =
        playingAyahNumber != null && playingAyahNumber === ayah.ayahNumber;
      const isActive = isPlaying || activeAyahNumber === ayah.ayahNumber;

      const segments = ayahSegmentsMap.get(ayah.id) || [{ text: ayah.textUthmani }];

      return (
        <Text
          key={ayah.id}
          onPress={() => {
            if (selectedAyahId != null) {
              void Haptics.selectionAsync();
              onSelectAyah?.(isSelected ? (null as any) : ayah);
            }
          }}
          onLongPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSelectAyah?.(ayah);
          }}
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
            const ruleColor = isRule
              ? isDark
                ? seg.rule!.darkColor
                : seg.rule!.lightColor
              : colors.quranText;

            return (
              <Text
                key={sIdx}
                suppressHighlighting={true}
                style={{
                  color: ruleColor,
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
              {
                color: colors.secondary,
                fontFamily: fontFamilies.arabic,
                fontSize: Math.round(textFontSize * 0.76),
              },
            ]}
          >
            {` ﴿${toArabicDigits(ayah.ayahNumber)}﴾ `}
          </Text>
        </Text>
      );
    };

    const cardBgColor = isDark ? '#141C18' : '#FBF9F5';
    const cardBorderColor = isDark
      ? 'rgba(212, 167, 69, 0.26)'
      : 'rgba(212, 167, 69, 0.38)';

    return (
      <View style={[{ width, paddingHorizontal: 12 }, style]}>
        <View
          style={[
            styles.bookPageCard,
            shadows.medium,
            {
              backgroundColor: cardBgColor,
              borderColor: cardBorderColor,
              borderRadius: radius.xl,
              height: height ? height - 12 : undefined,
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
          <View style={styles.scrollContent}>
            {/* Any ayahs before new Surah starts */}
            {ayahsBeforeStart.length > 0 ? (
              <Text
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
                {ayahsBeforeStart.map(renderAyahText)}
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
              {ayahsFromStart.map(renderAyahText)}
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
  }
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
    textAlign: Platform.OS === 'ios' ? 'justify' : 'right',
    writingDirection: 'rtl',
  },
  ayahSpan: {},
  ayahSelected: {
    borderRadius: 6,
  },
  ayahBadge: {
    fontWeight: '600',
    includeFontPadding: false,
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

