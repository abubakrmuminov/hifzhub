import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme, getQuranLineHeight } from '@/shared/theme';
import { toArabicDigits } from '@/features/quran/utils/quranUtils';
import type { Ayah } from '@/db/schema';
import { PageDivider } from './PageDivider';
import {
  getAyahTajweedSegments,
  type TajweedRuleInfo,
  type TajweedSegment,
} from '../services/tajweedParser';

export interface MushafViewProps {
  ayahs: Ayah[];
  fontSize?: number;
  pageNumber?: number;
  showDivider?: boolean;
  showTajweed?: boolean;
  selectedAyahId?: number | null;
  activeAyahNumber?: number | null;
  playingAyahNumber?: number | null;
  onSelectAyah?: (ayah: Ayah) => void;
  onPressRule?: (rule: TajweedRuleInfo, matchedText: string) => void;
}

export const MushafView = React.memo<MushafViewProps>(({
  ayahs,
  fontSize = 28,
  pageNumber,
  showDivider = true,
  showTajweed = true,
  selectedAyahId,
  activeAyahNumber,
  playingAyahNumber,
  onSelectAyah,
  onPressRule,
}) => {
  const { colors, fontFamilies, shadows, radius, spacing, isDark } = useTheme();
  const lineHeight = getQuranLineHeight(fontSize);

  const handleRulePress = (rule: TajweedRuleInfo, matchedText: string) => {
    if (!onPressRule) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressRule(rule, matchedText);
  };

  return (
    <View style={{ marginBottom: spacing.md }}>
      <View
        style={[
          styles.pageContainer,
          shadows.soft,
          {
            backgroundColor: colors.surface,
            borderWidth: isDark ? 1 : 0,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            borderRadius: radius.xl,
            marginHorizontal: spacing.md,
            padding: spacing.lg,
          },
        ]}
      >
        <Text
          style={[
            styles.continuousText,
            {
              fontFamily: fontFamilies.quran,
              fontSize,
              lineHeight,
              color: colors.quranText,
            },
          ]}
        >
          {ayahs.map((ayah) => {
            const isSelected = selectedAyahId === ayah.id;
            const isPlaying =
              playingAyahNumber != null && playingAyahNumber === ayah.ayahNumber;
            const isActive = isPlaying || activeAyahNumber === ayah.ayahNumber;

            const segments: TajweedSegment[] = showTajweed
              ? getAyahTajweedSegments(ayah.surahId, ayah.ayahNumber, ayah.textUthmani)
              : [{ text: ayah.textUthmani }];

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
                          ? 'rgba(212, 167, 69, 0.22)'
                          : 'rgba(212, 167, 69, 0.16)'
                        : isDark
                        ? 'rgba(212, 167, 69, 0.22)'
                        : 'rgba(212, 167, 69, 0.14)',
                    },
                  ],
                  isPlaying && [
                    styles.ayahPlaying,
                    {
                      textDecorationLine: 'underline',
                      textDecorationColor: colors.secondary,
                    },
                  ],
                ]}
              >
                {segments.map((seg, sIdx) => {
                  const isRule = showTajweed && seg.rule != null;
                  const ruleColor = isRule
                    ? (isDark ? seg.rule!.darkColor : seg.rule!.lightColor)
                    : colors.quranText;

                  return (
                    <Text
                      key={sIdx}
                      onPress={isRule && onPressRule ? () => handleRulePress(seg.rule!, seg.text) : undefined}
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
                      color:
                        isSelected || isPlaying
                          ? colors.secondary
                          : colors.secondary,
                      fontFamily: fontFamilies.arabic,
                      fontSize: Math.round(fontSize * 0.75),
                    },
                  ]}
                >
                  {` ﴿${toArabicDigits(ayah.ayahNumber)}﴾ `}
                </Text>
              </Text>
            );
          })}
        </Text>
      </View>

      {showDivider && pageNumber != null ? (
        <PageDivider pageNumber={pageNumber} />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  pageContainer: {},
  continuousText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  ayahSpan: {},
  ayahSelected: {
    borderRadius: 8,
  },
  ayahPlaying: {
    borderRadius: 8,
  },
  ayahBadge: {
    fontWeight: '600',
    includeFontPadding: false,
  },
});
