import React, { useMemo } from 'react';
import { Text, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { useTheme, getQuranLineHeight } from '@/shared/theme';
import { toArabicDigits } from '@/features/quran/utils/quranUtils';
import {
  getAyahTajweedSegments,
  type TajweedRuleInfo,
  type TajweedSegment,
} from '../services/tajweedParser';

export interface AyahTextProps {
  textUthmani: string;
  ayahNumber: number;
  surahId?: number;
  textTajweed?: string | null;
  showTajweed?: boolean;
  fontSize?: number;
  style?: StyleProp<TextStyle>;
  onPressRule?: (rule: TajweedRuleInfo, matchedText: string) => void;
}

export const AyahText = React.memo<AyahTextProps>(({
  textUthmani,
  ayahNumber,
  surahId,
  textTajweed,
  showTajweed = true,
  fontSize = 28,
  style,
  onPressRule,
}) => {
  const { colors, fontFamilies, isDark } = useTheme();
  const lineHeight = getQuranLineHeight(fontSize);

  // Parse letter-level Tajweed segments
  const segments: TajweedSegment[] | null = useMemo(() => {
    if (!showTajweed || !surahId) return null;
    const parsed = getAyahTajweedSegments(surahId, ayahNumber, textUthmani);
    return parsed.length > 0 ? parsed : null;
  }, [showTajweed, surahId, ayahNumber, textUthmani]);

  return (
    <Text
      style={[
        styles.text,
        {
          fontFamily: fontFamilies.quran,
          fontSize,
          lineHeight,
          color: colors.quranText,
        },
        style,
      ]}
    >
      {segments && segments.length > 0
        ? segments.map((seg, idx) => {
            const isRule = seg.rule != null;
            const ruleColor = isRule
              ? (isDark ? seg.rule!.darkColor : seg.rule!.lightColor)
              : colors.quranText;

            return (
              <Text
                key={idx}
                style={{
                  color: ruleColor,
                  fontFamily: fontFamilies.quran,
                }}
              >
                {seg.text}
              </Text>
            );
          })
        : textUthmani}
      <Text
        style={[
          styles.ayahBadge,
          {
            color: colors.secondary,
            fontFamily: fontFamilies.arabic,
            fontSize: Math.round(fontSize * 0.75),
          },
        ]}
      >
        {` ﴿${toArabicDigits(ayahNumber)}﴾ `}
      </Text>
    </Text>
  );
});

const styles = StyleSheet.create({
  text: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  ayahBadge: {
    fontWeight: '600',
    includeFontPadding: false,
  },
});
