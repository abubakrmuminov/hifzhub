import React, { useMemo } from 'react';
import { Text, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme, getQuranLineHeight } from '@/shared/theme';
import { toArabicDigits } from '@/features/quran/utils/quranUtils';
import {
  getTajweedForAyah,
  parseTajweedText,
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
    if (!showTajweed) return null;

    let rawTagged = textTajweed;
    if (!rawTagged && surahId) {
      rawTagged = getTajweedForAyah(surahId, ayahNumber);
    }

    if (!rawTagged) return null;
    return parseTajweedText(rawTagged);
  }, [showTajweed, textTajweed, surahId, ayahNumber]);

  const handleRulePress = (rule: TajweedRuleInfo, matchedText: string) => {
    if (!onPressRule) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressRule(rule, matchedText);
  };

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
