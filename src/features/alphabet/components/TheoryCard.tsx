import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { GlassView, AnimatedPressable } from '@/shared/components';

export interface TheoryCardProps {
  title: string;
  content: string;
  mnemonic?: string;
  example?: string;
  onContinue: () => void;
}

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const CYRILLIC_REGEX = /[\u0400-\u04FF]/;
const SPLIT_REGEX = /^([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u064B-\u065F\u0670\u06D6-\u06ED۝۞\s]+?)\s*(читается:?|—|=|–|:)\s*(.*[\u0400-\u04FF].*)$/i;

interface ExampleContent {
  type: 'split' | 'arabic_only' | 'mixed_inline' | 'text_only';
  arabic?: string;
  explanation?: string;
  text?: string;
}

const parseExample = (rawExample?: string): ExampleContent | null => {
  if (!rawExample || !rawExample.trim()) return null;
  const trimmed = rawExample.trim();

  const hasArabic = ARABIC_REGEX.test(trimmed);
  const hasCyrillic = CYRILLIC_REGEX.test(trimmed);

  if (!hasArabic) {
    return { type: 'text_only', text: trimmed };
  }

  if (!hasCyrillic) {
    return { type: 'arabic_only', arabic: trimmed };
  }

  const match = trimmed.match(SPLIT_REGEX);
  if (match) {
    const arabicLead = match[1].trim();
    const sep = match[2];
    const rest = match[3].trim();
    const explanation = sep.toLowerCase().startsWith('читается')
      ? `${sep.endsWith(':') ? sep : sep + ':'} ${rest}`
      : rest;
    return {
      type: 'split',
      arabic: arabicLead,
      explanation,
    };
  }

  return { type: 'mixed_inline', text: trimmed };
};

export const TheoryCard: React.FC<TheoryCardProps> = ({
  title,
  content,
  mnemonic,
  example,
  onContinue,
}) => {
  const { t } = useTranslation();
  const { isDark, colors, spacing, radius, fontFamilies } = useTheme();

  const parsedExample = useMemo(() => parseExample(example), [example]);

  const handleContinue = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Graceful fallback for web/unsupported environments
    }
    onContinue();
  }, [onContinue]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={styles.cardContainer}
      >
        <GlassView borderRadius={radius.lg ?? 16} style={styles.card}>
          <View style={styles.contentBody}>
            {/* Title */}
            <Text
              style={[
                styles.title,
                {
                  color: colors.primary,
                  fontFamily: fontFamilies.ui,
                  marginBottom: spacing.md,
                },
              ]}
            >
              {title}
            </Text>

            {/* Content text */}
            <Text
              style={[
                styles.content,
                {
                  color: colors.text,
                  fontFamily: fontFamilies.ui,
                  marginBottom: spacing.lg,
                },
              ]}
            >
              {content}
            </Text>

            {/* Mnemonic Pill/Banner */}
            {mnemonic ? (
              <View
                style={[
                  styles.mnemonicBanner,
                  {
                    backgroundColor: isDark
                      ? 'rgba(23, 176, 122, 0.12)'
                      : 'rgba(13, 107, 78, 0.08)',
                    borderRadius: radius.md ?? 14,
                    marginBottom: spacing.lg,
                    borderWidth: isDark ? 1 : 0,
                    borderColor: isDark ? 'rgba(23, 176, 122, 0.25)' : 'transparent',
                  },
                ]}
              >
                <Text style={styles.mnemonicIcon}>💡</Text>
                <View style={styles.mnemonicTextContainer}>
                  <Text
                    style={[
                      styles.mnemonicLabel,
                      {
                        color: isDark ? '#4ADE80' : colors.primary,
                        fontFamily: fontFamilies.ui,
                      },
                    ]}
                  >
                    {t('learn.mnemonic', { defaultValue: 'Запоминалка' })}
                  </Text>
                  <Text
                    style={[
                      styles.mnemonicText,
                      {
                        color: isDark ? '#E8E3D9' : colors.primaryDark,
                        fontFamily: fontFamilies.ui,
                      },
                    ]}
                  >
                    {mnemonic}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Example Card */}
            {parsedExample ? (
              <View
                style={[
                  styles.exampleCard,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.04)'
                      : 'rgba(13, 107, 78, 0.04)',
                    borderRadius: radius.md ?? 14,
                    marginBottom: spacing.lg,
                    borderWidth: isDark ? 1 : 0,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.exampleLabel,
                    {
                      color: colors.textSecondary,
                      fontFamily: fontFamilies.ui,
                    },
                  ]}
                >
                  {t('learn.example', { defaultValue: 'Пример' })}
                </Text>

                {parsedExample.type === 'split' ? (
                  <View style={styles.splitExampleContainer}>
                    <Text
                      style={[
                        styles.exampleArabicLead,
                        {
                          fontFamily: fontFamilies.arabic,
                          color: isDark ? colors.text : colors.primaryDark,
                        },
                      ]}
                    >
                      {parsedExample.arabic}
                    </Text>
                    <Text
                      style={[
                        styles.exampleExplanation,
                        {
                          fontFamily: fontFamilies.ui,
                          color: isDark ? colors.textSecondary : colors.primary,
                        },
                      ]}
                    >
                      {parsedExample.explanation}
                    </Text>
                  </View>
                ) : parsedExample.type === 'arabic_only' ? (
                  <Text
                    style={[
                      styles.exampleArabic,
                      {
                        fontFamily: fontFamilies.arabic,
                        color: isDark ? colors.text : colors.primaryDark,
                      },
                    ]}
                  >
                    {parsedExample.arabic}
                  </Text>
                ) : (
                  <Text
                    style={[
                      styles.exampleMixed,
                      {
                        fontFamily: fontFamilies.ui,
                        color: isDark ? colors.text : colors.text,
                      },
                    ]}
                  >
                    {parsedExample.text}
                  </Text>
                )}
              </View>
            ) : null}
          </View>
        </GlassView>
      </Animated.View>
    </ScrollView>

    {/* Fixed Bottom Footer */}
    <View style={[styles.footer, { backgroundColor: colors.background }]}>
      <AnimatedPressable
        onPress={handleContinue}
        haptic="light"
        style={[
          styles.continueButton,
          {
            backgroundColor: colors.primary,
            borderRadius: radius.md ?? 16,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('learn.continue', { defaultValue: 'Продолжить' })}
      >
        <Text style={styles.continueButtonText}>{t('learn.continue', { defaultValue: 'Продолжить' })}</Text>
      </AnimatedPressable>
    </View>
  </View>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  cardContainer: {
    width: '100%',
  },
  card: {
    padding: 20,
    width: '100%',
  },
  contentBody: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  content: {
    fontSize: 16.5,
    lineHeight: 26,
    letterSpacing: 0.1,
  },
  mnemonicBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 10,
  },
  mnemonicIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  mnemonicTextContainer: {
    flex: 1,
  },
  mnemonicLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mnemonicText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  exampleCard: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  splitExampleContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exampleArabicLead: {
    fontSize: 40,
    lineHeight: 56,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 6,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  exampleExplanation: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
    writingDirection: 'ltr',
    letterSpacing: 0.1,
  },
  exampleArabic: {
    fontSize: 34,
    lineHeight: 52,
    textAlign: 'center',
    writingDirection: 'rtl',
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  exampleMixed: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '500',
    textAlign: 'center',
    writingDirection: 'ltr',
  },
  footer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  continueButton: {
    width: '100%',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
