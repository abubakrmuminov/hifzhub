import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import Animated, { ZoomIn, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { GlassView, AnimatedPressable } from '@/shared/components';

export interface LetterIntroCardProps {
  arabic: string;
  name: string;
  transliteration: string;
  makhraj: string;
  isHeavy: boolean | null;
  forms: { isolated: string; initial: string; medial: string; final: string };
  note?: string;
  weightRule?: string;
  onContinue: () => void;
}

export const LetterIntroCard: React.FC<LetterIntroCardProps> = ({
  arabic,
  name,
  transliteration,
  makhraj,
  isHeavy,
  forms,
  note,
  weightRule,
  onContinue,
}) => {
  const { t } = useTranslation();
  const { isDark, colors, spacing, radius, fontFamilies } = useTheme();

  const handleContinue = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Graceful fallback for unsupported environments
    }
    onContinue();
  }, [onContinue]);

  const badgeInfo = useMemo(() => {
    if (isHeavy === true) {
      return {
        label: t('learn.heavy', { defaultValue: 'Тяжёлая (تفخيم)' }),
        bg: isDark ? 'rgba(231, 76, 60, 0.22)' : 'rgba(231, 76, 60, 0.12)',
        textColor: isDark ? '#FF6B6B' : '#C0392B',
      };
    }
    if (isHeavy === false) {
      return {
        label: t('learn.light', { defaultValue: 'Лёгкая (ترقيق)' }),
        bg: isDark ? 'rgba(52, 152, 219, 0.22)' : 'rgba(52, 152, 219, 0.12)',
        textColor: isDark ? '#5DADE2' : '#1976D2',
      };
    }
    return {
      label: t('learn.contextDependent', { defaultValue: 'Зависит от контекста' }),
      bg: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)',
      textColor: colors.textSecondary,
    };
  }, [isHeavy, isDark, colors.textSecondary, t]);

  const formsData = useMemo(
    () => [
      { key: 'isolated', label: t('learn.isolated', { defaultValue: 'Обособленная' }), char: forms.isolated },
      { key: 'initial', label: t('learn.initial', { defaultValue: 'Начальная' }), char: forms.initial },
      { key: 'medial', label: t('learn.medial', { defaultValue: 'Серединная' }), char: forms.medial },
      { key: 'final', label: t('learn.final', { defaultValue: 'Конечная' }), char: forms.final },
    ],
    [forms, t]
  );

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
        <GlassView borderRadius={radius.lg ?? 16} style={styles.card}>
        {/* Top Hero Section: Letter + Speaker + Name */}
        <View style={styles.heroSection}>
          <Animated.View
            entering={ZoomIn.duration(450)}
            style={styles.letterWrapper}
          >
            <View style={styles.letterRow}>
              {/* Invisible spacer to balance speaker button and keep Arabic letter centered */}
              <View style={styles.speakerSpacer} />

              <Text
                style={[
                  styles.arabicLetter,
                  {
                    color: colors.primary,
                    fontFamily: fontFamilies.arabic,
                  },
                ]}
              >
                {arabic}
              </Text>

              {/* Speaker placeholder circle */}
              <View
                style={[
                  styles.speakerCircle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(13, 107, 78, 0.08)',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('learn.listen', { defaultValue: 'Прослушать произношение' })}
              >
                <Text style={styles.speakerIcon}>🔊</Text>
              </View>
            </View>
          </Animated.View>

          {/* Letter Name & Transliteration */}
          <Text
            style={[
              styles.letterName,
              {
                color: colors.text,
                fontFamily: fontFamilies.ui,
              },
            ]}
          >
            {name}
          </Text>
          <Text
            style={[
              styles.transliteration,
              {
                color: colors.textSecondary,
                fontFamily: fontFamilies.ui,
              },
            ]}
          >
            [{transliteration}]
          </Text>

          {/* Heavy / Light Badge */}
          <View
            style={[
              styles.badgePill,
              {
                backgroundColor: badgeInfo.bg,
                borderRadius: radius.full,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: badgeInfo.textColor,
                  fontFamily: fontFamilies.ui,
                },
              ]}
            >
              {badgeInfo.label}
            </Text>
          </View>

          {weightRule ? (
            <Text
              style={[
                styles.weightRuleText,
                {
                  color: colors.textSecondary,
                  fontFamily: fontFamilies.ui,
                },
              ]}
            >
              {weightRule}
            </Text>
          ) : null}
        </View>

        {/* Makhraj Card with Target Icon */}
        <View
          style={[
            styles.makhrajCard,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.04)'
                : 'rgba(13, 107, 78, 0.04)',
              borderRadius: radius.md ?? 14,
              borderWidth: isDark ? 1 : 0,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              marginVertical: spacing.md,
            },
          ]}
        >
          <View style={styles.makhrajHeader}>
            <Text style={styles.makhrajIcon}>🎯</Text>
            <Text
              style={[
                styles.makhrajTitle,
                {
                  color: colors.primary,
                  fontFamily: fontFamilies.ui,
                },
              ]}
            >
              {t('learn.makhraj', { defaultValue: 'Махрадж' })}
            </Text>
          </View>
          <Text
            style={[
              styles.makhrajText,
              {
                color: colors.text,
                fontFamily: fontFamilies.ui,
              },
            ]}
          >
            {makhraj}
          </Text>
        </View>

        {/* 4 Forms Horizontal Row */}
        <View style={styles.formsSection}>
          <Text
            style={[
              styles.formsSectionTitle,
              {
                color: colors.textSecondary,
                fontFamily: fontFamilies.ui,
                marginBottom: spacing.sm,
              },
            ]}
          >
            {t('learn.writingForms', { defaultValue: 'Формы написания' })}
          </Text>
          <View style={styles.formsRow}>
            {formsData.map((item, index) => (
              <Animated.View
                key={item.key}
                entering={FadeInRight.delay(index * 100).duration(400)}
                style={styles.formItemWrapper}
              >
                <View
                  style={[
                    styles.formMiniCard,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(13, 107, 78, 0.04)',
                      borderRadius: radius.sm ?? 12,
                      borderWidth: isDark ? 1 : 0,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.formArabic,
                      {
                        fontFamily: fontFamilies.arabic,
                        color: colors.primary,
                      },
                    ]}
                  >
                    {item.char}
                  </Text>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[
                      styles.formLabel,
                      {
                        color: colors.textSecondary,
                        fontFamily: fontFamilies.ui,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Optional Note with Info Icon */}
        {note ? (
          <View
            style={[
              styles.noteCard,
              {
                backgroundColor: isDark
                  ? 'rgba(52, 152, 219, 0.12)'
                  : 'rgba(52, 152, 219, 0.08)',
                borderRadius: radius.md ?? 14,
                borderWidth: isDark ? 1 : 0,
                borderColor: isDark ? 'rgba(52, 152, 219, 0.25)' : 'transparent',
                marginTop: spacing.md,
              },
            ]}
          >
            <Text style={styles.noteIcon}>ℹ️</Text>
            <Text
              style={[
                styles.noteText,
                {
                  color: isDark ? '#90CAF9' : '#1976D2',
                  fontFamily: fontFamilies.ui,
                },
              ]}
            >
              {note}
            </Text>
          </View>
        ) : null}
      </GlassView>
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
  card: {
    padding: 20,
    width: '100%',
  },
  heroSection: {
    alignItems: 'center',
    width: '100%',
  },
  letterWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 4,
  },
  letterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  speakerSpacer: {
    width: 44,
    height: 44,
  },
  arabicLetter: {
    fontSize: 78,
    lineHeight: 122,
    textAlign: 'center',
    writingDirection: 'rtl',
    paddingVertical: 4,
    ...Platform.select({
      android: {
        includeFontPadding: true,
      },
    }),
  },
  speakerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerIcon: {
    fontSize: 18,
  },
  letterName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  transliteration: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  badgePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  weightRuleText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  makhrajCard: {
    padding: 14,
    width: '100%',
  },
  makhrajHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  makhrajIcon: {
    fontSize: 18,
  },
  makhrajTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  makhrajText: {
    fontSize: 15,
    lineHeight: 22,
  },
  formsSection: {
    width: '100%',
    marginTop: 4,
  },
  formsSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  formItemWrapper: {
    flex: 1,
  },
  formMiniCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 90,
  },
  formArabic: {
    fontSize: 30,
    lineHeight: 50,
    textAlign: 'center',
    writingDirection: 'rtl',
    ...Platform.select({
      android: {
        includeFontPadding: true,
      },
    }),
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 10,
    width: '100%',
  },
  noteIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
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
