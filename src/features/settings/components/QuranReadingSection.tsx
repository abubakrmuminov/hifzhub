import React, { useCallback } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useSettingsStore, type ReadingMode } from '@/stores/settingsStore';
import { SettingCard } from './SettingCard';

export interface QuranReadingSectionProps {}

export const QuranReadingSection: React.FC<QuranReadingSectionProps> = () => {
  const { t } = useTranslation();
  const { colors, spacing, radius, fontFamilies } = useTheme();

  const quranFontSize = useSettingsStore((state) => state.quranFontSize);
  const setQuranFontSize = useSettingsStore((state) => state.setQuranFontSize);
  const showTranslation = useSettingsStore((state) => state.showTranslation);
  const setShowTranslation = useSettingsStore((state) => state.setShowTranslation);
  const showTajweed = useSettingsStore((state) => state.showTajweed);
  const setShowTajweed = useSettingsStore((state) => state.setShowTajweed);
  const readingMode = useSettingsStore((state) => state.readingMode);
  const setReadingMode = useSettingsStore((state) => state.setReadingMode);

  const decreaseFontSize = useCallback(() => {
    setQuranFontSize(Math.max(16, quranFontSize - 2));
  }, [quranFontSize, setQuranFontSize]);

  const increaseFontSize = useCallback(() => {
    setQuranFontSize(Math.min(40, quranFontSize + 2));
  }, [quranFontSize, setQuranFontSize]);

  // Calculate percentage along 16-40 range
  const progressRatio = Math.max(0, Math.min(1, (quranFontSize - 16) / 24));

  return (
    <SettingCard
      title={t('settings.quranReading')}
      icon={<Feather name="book-open" size={18} color={colors.primary} />}
    >
      {/* Font Size Adjustment */}
      <View style={styles.subSection}>
        <View style={styles.rowBetween}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t('settings.fontSize')}
          </Text>
          <Text style={[styles.valueBadge, { color: colors.primary }]}>
            {quranFontSize} pt
          </Text>
        </View>

        {/* Custom Stepper & Track */}
        <View style={styles.sliderRow}>
          <AnimatedPressable
            onPress={decreaseFontSize}
            disabled={quranFontSize <= 16}
            accessibilityLabel="Decrease font size"
            style={[
              styles.stepButton,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                opacity: quranFontSize <= 16 ? 0.4 : 1,
              },
            ]}
          >
            <Feather name="minus" size={16} color={colors.text} />
          </AnimatedPressable>

          <View style={styles.trackContainer}>
            <View style={[styles.trackBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.trackFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.round(progressRatio * 100)}%`,
                  },
                ]}
              />
            </View>
          </View>

          <AnimatedPressable
            onPress={increaseFontSize}
            disabled={quranFontSize >= 40}
            accessibilityLabel="Increase font size"
            style={[
              styles.stepButton,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                opacity: quranFontSize >= 40 ? 0.4 : 1,
              },
            ]}
          >
            <Feather name="plus" size={16} color={colors.text} />
          </AnimatedPressable>
        </View>

        {/* Arabic preview text */}
        <View
          style={[
            styles.previewContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              padding: spacing.sm,
            },
          ]}
        >
          <Text
            style={[
              styles.previewArabic,
              {
                fontSize: quranFontSize,
                lineHeight: Math.round(quranFontSize * 2),
                fontFamily: fontFamilies.arabic,
                color: colors.quranText,
              },
            ]}
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Show Translation Toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleTextContainer}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t('settings.showTranslation')}
          </Text>
        </View>
        <Switch
          value={showTranslation}
          onValueChange={setShowTranslation}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={showTranslation ? colors.primary : '#F4F3F4'}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Show Tajweed Toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleTextContainer}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t('settings.showTajweed')}
          </Text>
        </View>
        <Switch
          value={showTajweed}
          onValueChange={setShowTajweed}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={showTajweed ? colors.primary : '#F4F3F4'}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Reading Mode Radio */}
      <View style={styles.subSection}>
        <Text style={[styles.label, { color: colors.text, marginBottom: spacing.xs }]}>
          {t('settings.readingMode')}
        </Text>
        <View style={styles.modeRow}>
          {(['translation', 'mushaf'] as ReadingMode[]).map((mode) => {
            const isSelected = readingMode === mode;
            const modeLabel =
              mode === 'translation'
                ? t('settings.readingModeTranslation')
                : t('settings.readingModeMushaf');

            return (
              <AnimatedPressable
                key={mode}
                onPress={() => setReadingMode(mode)}
                accessibilityRole="radio"
                accessibilityLabel={modeLabel}
                style={[
                  styles.modeButton,
                  {
                    borderRadius: radius.md,
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected
                      ? 'rgba(13, 107, 78, 0.1)'
                      : 'transparent',
                    paddingVertical: spacing.sm,
                  },
                ]}
              >
                <View
                  style={[
                    styles.radioCircle,
                    { borderColor: isSelected ? colors.primary : colors.border },
                  ]}
                >
                  {isSelected ? (
                    <View
                      style={[
                        styles.radioDot,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.modeText,
                    {
                      color: isSelected ? colors.primary : colors.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {modeLabel}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>
      </View>
    </SettingCard>
  );
};

const styles = StyleSheet.create({
  subSection: {
    marginVertical: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  valueBadge: {
    fontSize: 13,
    fontWeight: '700',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 10,
  },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackContainer: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
  },
  trackBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },
  previewContainer: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  previewArabic: {
    textAlign: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  toggleTextContainer: {
    flex: 1,
    marginEnd: 12,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 8,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 8,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modeText: {
    fontSize: 13,
  },
});
