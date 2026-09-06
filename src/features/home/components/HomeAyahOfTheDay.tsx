import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/shared/theme';
import { GlassView } from '@/shared/components/GlassView';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useSettingsStore } from '@/stores/settingsStore';
import { playAyah } from '@/features/audio';

import { getDailyAyah } from '../data/dailyAyahData';

export interface HomeAyahOfTheDayProps {}

export const HomeAyahOfTheDay: React.FC<HomeAyahOfTheDayProps> = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing, radius, fontFamilies, isDark } = useTheme();
  const defaultReciter = useSettingsStore((s) => s.defaultReciter);
  const language = useSettingsStore((s) => s.language);

  // Dynamic Inspirational Ayah of the Day (changes automatically at 00:00)
  const dailyAyah = React.useMemo(() => getDailyAyah(), []);

  const surahId = dailyAyah.surahId;
  const ayahNumber = dailyAyah.ayahNumber;
  const arabicText = dailyAyah.arabicText;
  const surahBadge =
    language === 'uz'
      ? `${dailyAyah.surahNameUz} ${surahId}:${ayahNumber}`
      : `${dailyAyah.surahNameRu} ${surahId}:${ayahNumber}`;
  const translationText =
    language === 'uz' ? dailyAyah.translationUz : dailyAyah.translationRu;
  const themeTag =
    language === 'uz' ? dailyAyah.themeUz : dailyAyah.themeRu;

  const handleRead = () => {
    void Haptics.selectionAsync();
    router.push({
      pathname: '/surah/[id]',
      params: { id: String(surahId) },
    });
  };

  const handleListen = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await playAyah(surahId, ayahNumber, defaultReciter);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(320).springify()}
      style={[
        styles.wrapper,
        {
          paddingHorizontal: spacing.md,
          marginTop: spacing.md,
          marginBottom: spacing.md,
        },
      ]}
    >
      <GlassView borderRadius={radius.lg} style={styles.container}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleWithIcon}>
            <View style={[styles.iconPill, { backgroundColor: colors.secondary + '20' }]}>
              <Ionicons name="sparkles" size={14} color={colors.secondary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('home.ayahOfTheDay', { defaultValue: 'Аят дня' })}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: colors.secondary + '18' }]}>
            <Text style={[styles.badgeText, { color: colors.secondaryDark }]}>
              {surahBadge}
            </Text>
          </View>
        </View>

        {/* Theme Pill (Optional context tag) */}
        {themeTag ? (
          <View style={styles.themeRow}>
            <Text style={[styles.themeTagText, { color: colors.primary }]}>
              • {themeTag}
            </Text>
          </View>
        ) : null}

        {/* Arabic Calligraphy Verse */}
        <View style={styles.arabicBox}>
          <Text
            style={[
              styles.arabicVerse,
              {
                fontFamily: fontFamilies.quran,
                color: colors.text,
              },
            ]}
          >
            {arabicText}
          </Text>
        </View>

        {/* Translation */}
        <Text style={[styles.translationText, { color: colors.textSecondary }]}>
          «{translationText}»
        </Text>

        {/* Quick Action Buttons */}
        <View style={styles.actionsRow}>
          <AnimatedPressable
            onPress={handleListen}
            style={[
              styles.actionButton,
              { backgroundColor: colors.primary + '18' },
            ]}
          >
            <Ionicons name="play" size={14} color={colors.primary} style={{ marginEnd: 6 }} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              {t('home.listen', { defaultValue: 'Слушать' })}
            </Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={handleRead}
            style={[
              styles.actionButton,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
            ]}
          >
            <Feather name="book-open" size={14} color={colors.text} style={{ marginEnd: 6 }} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              {t('home.readSurah', { defaultValue: 'Читать суру' })}
            </Text>
          </AnimatedPressable>
        </View>
      </GlassView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  themeRow: {
    marginBottom: 6,
    alignItems: 'center',
  },
  themeTagText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  arabicBox: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabicVerse: {
    fontSize: 26,
    lineHeight: 46,
    textAlign: 'center',
  },
  translationText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});