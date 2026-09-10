import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components';
import {
  DailyHifzCard,
  SurahPickerSheet,
  HifzCategories,
  HifzQuickStart,
  useMemorizationDashboard,
  useAddAyahs,
  getAyahsForMemorization,
  type MemorizationCategory,
} from '@/features/memorization';
import { SURAH_LIST } from '@/features/quran/data/surahList';
import { useMemorizationStore } from '@/stores/memorizationStore';
import { useScrollTabBar } from '@/shared/hooks/useScrollTabBar';

export default function MemorizeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, colors, spacing, radius } = useTheme();
  const { onScroll, scrollEventThrottle } = useScrollTabBar();

  const [pickerVisible, setPickerVisible] = useState(false);

  const {
    dueCount,
    newCount,
    sabaqCount,
    sabqiCount,
    manzilCount,
    totalMemorized,
    todayStats,
  } = useMemorizationDashboard();

  const { addAyahs } = useAddAyahs();
  const cards = useMemorizationStore((s) => s.cards);

  const memorizedCardIds = useMemo(
    () => new Set(Object.keys(cards)),
    [cards]
  );

  const totalCardsCount = Object.keys(cards).length;

  const handleStartSabaq = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/memorize/session?category=sabaq' as any);
  }, [router]);

  const handleStartReview = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/memorize/session?category=review' as any);
  }, [router]);

  const handleCategoryPress = useCallback(
    (category: MemorizationCategory, count: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (count > 0) {
        router.push(`/memorize/session?category=${category}` as any);
      } else if (category === 'sabaq') {
        setPickerVisible(true);
      }
    },
    [router]
  );

  const handleConfirmAyahs = useCallback(
    (surahId: number, fromAyah: number, toAyah: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const ayahsToAdd = getAyahsForMemorization(surahId, fromAyah, toAyah);
      addAyahs(ayahsToAdd);
      setPickerVisible(false);
      router.push(`/memorize/session?category=sabaq&surahId=${surahId}` as any);
    },
    [addAyahs, router]
  );

  const handleQuickStartSelect = useCallback(
    (surahId: number, fromAyah: number, toAyah: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const ayahsToAdd = getAyahsForMemorization(surahId, fromAyah, toAyah);
      addAyahs(ayahsToAdd);
      router.push(`/memorize/session?category=sabaq&surahId=${surahId}` as any);
    },
    [addAyahs, router]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.xxl + 80,
            paddingHorizontal: spacing.md,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen Header */}
        <View style={[styles.header, { marginBottom: spacing.lg }]}>
          <View style={styles.headerTextGroup}>
            <Text style={[styles.screenTitle, { color: colors.text }]}>
              {t('hifz.title', { defaultValue: 'Хифз' })}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('hifz.subtitle', { defaultValue: 'Интерактивное заучивание Корана' })}
            </Text>
          </View>

          {/* Memorized count badge */}
          <View
            style={[
              styles.memorizedBadge,
              {
                borderRadius: radius.full,
                backgroundColor: isDark
                  ? 'rgba(13, 107, 78, 0.22)'
                  : 'rgba(13, 107, 78, 0.12)',
                borderColor: isDark
                  ? 'rgba(13, 107, 78, 0.40)'
                  : 'rgba(13, 107, 78, 0.20)',
              },
            ]}
          >
            <Ionicons name="school" size={16} color={colors.primary} />
            <Text style={[styles.memorizedBadgeText, { color: colors.primary, marginStart: spacing.xs }]}>
              {totalMemorized} {t('hifz.memorized', { defaultValue: 'выучено' })}
            </Text>
          </View>
        </View>

        {/* If user has cards in plan, show the Daily Dashboard */}
        {totalCardsCount > 0 ? (
          <>
            {/* Daily Memorization Stats & Actions */}
            <View style={{ marginBottom: spacing.lg }}>
              <DailyHifzCard
                dueCount={dueCount}
                newCount={newCount}
                reviewedToday={todayStats.cardsReviewed}
                totalMemorized={totalMemorized}
                onStartSabaq={handleStartSabaq}
                onStartReview={handleStartReview}
              />
            </View>

            {/* Section: "Мой прогресс" */}
            <View style={{ marginBottom: spacing.xl }}>
              <HifzCategories
                sabaqCount={sabaqCount}
                sabqiCount={sabqiCount}
                manzilCount={manzilCount}
                onCategoryPress={handleCategoryPress}
              />
            </View>

            {/* Recommendations to add more surahs */}
            <View>
              <HifzQuickStart
                onSelectQuickSurah={handleQuickStartSelect}
                onOpenCustomPicker={() => setPickerVisible(true)}
              />
            </View>
          </>
        ) : (
          /* If collection is empty, show QuickStart as the primary hero! */
          <View>
            <HifzQuickStart
              onSelectQuickSurah={handleQuickStartSelect}
              onOpenCustomPicker={() => setPickerVisible(true)}
            />
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (+) */}
      <AnimatedPressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setPickerVisible(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={t('hifz.addAyahs', { defaultValue: 'Добавить аяты' })}
        style={[
          styles.fab,
          {
            bottom: insets.bottom + 80,
            end: spacing.lg,
            backgroundColor: colors.primary,
            borderRadius: radius.full,
          },
        ]}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </AnimatedPressable>

      {/* Surah & Ayah Range Picker Sheet */}
      {pickerVisible ? (
        <SurahPickerSheet
          visible
          onClose={() => setPickerVisible(false)}
          onConfirm={handleConfirmAyahs}
          surahs={SURAH_LIST}
          alreadyMemorized={memorizedCardIds}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextGroup: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  memorizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  memorizedBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
