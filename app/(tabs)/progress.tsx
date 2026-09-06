import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { useScrollTabBar } from '@/shared/hooks/useScrollTabBar';
import { AnimatedPressable } from '@/shared/components';
import {
  ProgressHeader,
  ActivityTracker,
  MemorizationStatsCard,
  JuzProgressList,
  AchievementsSection,
  AchievementDetailModal,
  LessonProgressCard,
} from '@/features/progress/components';
import { useTabBarStore } from '@/stores';
import type { Achievement } from '@/features/progress/types';

export type ProgressTab = 'hifz' | 'lessons' | 'achievements';

interface TabItem {
  id: ProgressTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface ProgressScreenProps {}

export function ProgressScreen({}: ProgressScreenProps) {
  const insets = useSafeAreaInsets();
  const { isDark, colors, spacing, radius } = useTheme();
  const { onScroll, scrollEventThrottle } = useScrollTabBar();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ProgressTab>('hifz');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const tabs: TabItem[] = useMemo(
    () => [
      { id: 'hifz', label: t('progress.tabHifz', { defaultValue: 'Хифз' }), icon: 'book-outline' },
      { id: 'lessons', label: t('progress.tabLessons', { defaultValue: 'Уроки' }), icon: 'school-outline' },
      { id: 'achievements', label: t('progress.tabAchievements', { defaultValue: 'Награды' }), icon: 'trophy-outline' },
    ],
    [t]
  );


  const handleOpenAchievement = useCallback((achievement: Achievement) => {
    setSelectedAchievement(achievement);
    useTabBarStore.getState().setTabBarVisible(false);
  }, []);

  const handleCloseAchievement = useCallback(() => {
    setSelectedAchievement(null);
    useTabBarStore.getState().setTabBarVisible(true);
  }, []);

  // Ensure tab bar is restored on unmount
  useEffect(() => {
    return () => {
      useTabBarStore.getState().setTabBarVisible(true);
    };
  }, []);

  const handleTabPress = useCallback((tabId: ProgressTab) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tabId);
  }, []);


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + spacing.xl + 70,
          },
        ]}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        {/* Screen Title */}
        <View style={styles.topHeader}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>
            {t('progress.title', { defaultValue: 'Прогресс' })}
          </Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
            {t('progress.subtitle', { defaultValue: 'Твой путь к совершенству в чтении и заучивании' })}
          </Text>
        </View>

        {/* 1. Header: User Level, Total XP & Streak */}
        <ProgressHeader />

        {/* 2. Segmented Tabs Switcher */}
        <View style={[styles.tabsContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
          {tabs.map((tab) => {

            const isActive = activeTab === tab.id;
            return (
              <AnimatedPressable
                key={tab.id}
                onPress={() => handleTabPress(tab.id)}
                style={[
                  styles.tabButton,
                  isActive && [
                    styles.tabButtonActive,
                    {
                      backgroundColor: isDark ? colors.primaryDark : colors.surface,
                      ...Platform.select({
                        ios: {
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isDark ? 0.3 : 0.08,
                          shadowRadius: 4,
                        },
                        android: {},
                      }),
                    },
                  ],
                ]}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={isActive ? colors.primary : colors.textTertiary}
                  style={styles.tabIcon}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? (isDark ? '#FFF' : colors.primaryDark) : colors.textSecondary,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        {/* Tab Content: Preserved mounted views for 0ms instant tab switching */}
        <View style={{ display: activeTab === 'hifz' ? 'flex' : 'none' }}>
          {/* Activity Tracker: 7-day Weekly Bar Chart & 28-day Matrix */}
          <ActivityTracker />

          {/* Memorization Stats Card: Ring Progress & FSRS stages */}
          <MemorizationStatsCard />

          {/* Juz Progress List: 30 Juz with filters and expandable surahs */}
          <JuzProgressList />
        </View>

        <View style={{ display: activeTab === 'lessons' ? 'flex' : 'none' }}>
          {/* Alphabet & Tajweed 5 Modules Progress */}
          <LessonProgressCard />
        </View>

        <View style={{ display: activeTab === 'achievements' ? 'flex' : 'none' }}>
          {/* Achievements Grid with filter tabs */}
          <AchievementsSection onSelectAchievement={handleOpenAchievement} />
        </View>
      </ScrollView>

      {/* Screen-level Achievement Detail Sheet outside ScrollView for 0ms delay and buttery smooth animation */}
      {selectedAchievement && (
        <AchievementDetailModal
          achievement={selectedAchievement}
          onClose={handleCloseAchievement}
        />
      )}
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
  scrollContent: {
    paddingHorizontal: 0,
  },
  topHeader: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 4,
    borderRadius: 14,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
  },
  tabButtonActive: {},
  tabIcon: {
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 14,
  },
});

export default ProgressScreen;
