import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useAchievements } from '../hooks/useAchievements';
import { AchievementDetailModal } from './AchievementDetailModal';
import type { Achievement, AchievementFilter, AchievementsSectionProps } from '../types';

const FILTER_TABS: { id: AchievementFilter; labelKey: string }[] = [
  { id: 'all', labelKey: 'progress.filterAll' },
  { id: 'memorization', labelKey: 'progress.filterMemorization' },
  { id: 'streak', labelKey: 'progress.filterStreak' },
  { id: 'lessons', labelKey: 'progress.filterLessons' },
];

function getRussianPlural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function getBadgeProgressText(achievement: Achievement, isUz: boolean): string {
  const target = achievement.condition.target;
  const current = Math.min(target, Math.round(achievement.progress * target));

  if (isUz) {
    switch (achievement.condition.type) {
      case 'streak':
        return `${current}/${target} kun`;
      case 'ayahs_count':
      case 'surah_completed':
      case 'juz_completed':
        return `${current}/${target} oyat`;
      case 'lessons_count':
        return `${current}/${target} dars`;
      case 'xp_total':
        return `${current}/${target} XP`;
      default:
        return `${Math.round(achievement.progress * 100)}%`;
    }
  }

  switch (achievement.condition.type) {
    case 'streak':
      return `${current}/${target} ${getRussianPlural(target, 'день', 'дня', 'дней')}`;
    case 'ayahs_count':
    case 'surah_completed':
    case 'juz_completed':
      return `${current}/${target} ${getRussianPlural(target, 'аят', 'аята', 'аятов')}`;
    case 'lessons_count':
      return `${current}/${target} ${getRussianPlural(target, 'урок', 'урока', 'уроков')}`;
    case 'xp_total':
      return `${current}/${target} XP`;
    default:
      return `${Math.round(achievement.progress * 100)}%`;
  }
}

const AchievementsSectionComponent: React.FC<AchievementsSectionProps> = ({
  achievements: propAchievements,
  onSelectAchievement,
}) => {
  const { t, i18n } = useTranslation();
  const isUz = i18n.language === 'uz';
  const { colors, radius, shadows, isDark } = useTheme();

  // Store data fallback
  const hookResult = useAchievements();
  const achievements: Achievement[] = propAchievements ?? hookResult.achievements;
  const unlockedCount = propAchievements
    ? propAchievements.filter((a: Achievement) => a.isUnlocked).length
    : hookResult.unlockedCount;
  const totalCount = propAchievements ? propAchievements.length : hookResult.totalCount;

  // Filter state
  const [activeFilter, setActiveFilter] = useState<AchievementFilter>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const filteredAchievements = useMemo(() => {
    if (activeFilter === 'all' || activeFilter === 'Все') return achievements;
    if (activeFilter === 'memorization' || activeFilter === 'Заучивание') {
      return achievements.filter((a) => a.category === 'memorization');
    }
    if (activeFilter === 'streak' || activeFilter === 'Стрик') {
      return achievements.filter((a) => a.category === 'streak');
    }
    if (activeFilter === 'lessons' || activeFilter === 'Уроки') {
      return achievements.filter((a) => a.category === 'lessons');
    }
    return achievements;
  }, [achievements, activeFilter]);

  const handleOpenAchievement = useCallback(
    (achievement: Achievement) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (onSelectAchievement) {
        onSelectAchievement(achievement);
        return;
      }
      setSelectedAchievement(achievement);
    },
    [onSelectAchievement]
  );


  return (
    <Animated.View
      entering={FadeInDown.duration(600).delay(200).springify()}
      style={styles.container}
    >
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View
            style={[
              styles.headerIconCircle,
              { backgroundColor: isDark ? 'rgba(212, 167, 69, 0.15)' : 'rgba(212, 167, 69, 0.12)' },
            ]}
          >
            <Ionicons name="trophy" size={16} color={colors.secondary} />
          </View>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('progress.achievementsTitle', { defaultValue: 'Достижения' })}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {isUz
                ? `${totalCount} tadan ${unlockedCount} ochilgan`
                : `${unlockedCount} из ${totalCount} открыто`}
            </Text>
          </View>
        </View>

        {/* Progress Counter Pill */}
        <View
          style={[
            styles.counterBadge,
            {
              backgroundColor: isDark ? 'rgba(212, 167, 69, 0.16)' : 'rgba(212, 167, 69, 0.14)',
              borderColor: isDark ? colors.secondary + '40' : 'transparent',
              borderWidth: isDark ? 1 : 0,
            },
          ]}
        >
          <Ionicons name="sparkles" size={12} color={colors.secondary} style={styles.sparkleIcon} />
          <Text style={[styles.counterBadgeText, { color: colors.secondary }]}>
            {Math.round(totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0)}%
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsContainer}>
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <AnimatedPressable
              key={tab.id}
              onPress={() => {
                void Haptics.selectionAsync();
                setActiveFilter(tab.id);
              }}
              scaleValue={0.94}
              haptic="none"
              style={[
                styles.tabButton,
                isActive
                  ? [
                      styles.tabButtonActive,
                      {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]
                  : [
                      styles.tabButtonInactive,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.04)',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'transparent',
                        borderWidth: isDark ? 1 : 0,
                      },
                    ],
              ]}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  {
                    color: isActive ? '#FFFFFF' : colors.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {t(tab.labelKey)}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      {/* 2-Column Badges Grid */}
      <View style={styles.gridContainer}>
        {filteredAchievements.map((item) => {
          const isUnlocked = item.isUnlocked;
          const progressPercent = Math.min(100, Math.max(0, Math.round(item.progress * 100)));

          return (
            <View key={item.id} style={styles.gridColumn}>
              <AnimatedPressable
                onPress={() => handleOpenAchievement(item)}
                scaleValue={0.96}
                haptic="light"
                style={[
                  styles.badgeCard,
                  isUnlocked
                    ? [
                        styles.badgeCardUnlocked,
                        {
                          borderColor: colors.secondary,
                          shadowColor: colors.secondary,
                        },
                      ]
                    : [
                        styles.badgeCardLocked,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(255, 255, 255, 0.70)',
                          borderColor: isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'transparent',
                          borderWidth: isDark ? 1 : 0,
                        },
                      ],
                ]}
              >
                {/* Background Gradient for Unlocked Items */}
                {isUnlocked && (
                  <LinearGradient
                    colors={
                      isDark
                        ? ['rgba(212, 167, 69, 0.22)', 'rgba(13, 107, 78, 0.25)']
                        : ['rgba(255, 248, 230, 0.95)', 'rgba(235, 247, 242, 0.95)']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}

                {/* Top Row: Icon + Lock/Checkmark Indicator */}
                <View style={styles.badgeTopRow}>
                  {/* Badge Icon Circle */}
                  <View
                    style={[
                      styles.iconCircle,
                      isUnlocked
                        ? {
                            backgroundColor: isDark
                              ? 'rgba(212, 167, 69, 0.25)'
                              : 'rgba(212, 167, 69, 0.20)',
                            borderColor: colors.secondary,
                          }
                        : {
                            backgroundColor: isDark
                              ? 'rgba(255, 255, 255, 0.06)'
                              : 'rgba(0, 0, 0, 0.05)',
                            borderColor: 'transparent',
                          },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={isUnlocked ? colors.secondary : colors.textTertiary}
                    />
                  </View>

                  {/* Status Indicator */}
                  {isUnlocked ? (
                    <View
                      style={[
                        styles.indicatorPill,
                        { backgroundColor: 'rgba(13, 107, 78, 0.16)' },
                      ]}
                    >
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.indicatorPill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}
                    >
                      <Ionicons name="lock-closed" size={13} color={colors.textTertiary} />
                    </View>
                  )}
                </View>

                {/* Full Title */}
                <Text
                  style={[
                    styles.badgeTitle,
                    {
                      color: isUnlocked ? colors.text : colors.textSecondary,
                      fontWeight: isUnlocked ? '700' : '600',
                    },
                  ]}
                  numberOfLines={2}
                >
                  {isUz && item.titleUz ? item.titleUz : item.titleRu}
                </Text>

                {/* Unlocked / Locked Subtitle & Progress */}
                {isUnlocked ? (
                  <View style={styles.unlockedSubRow}>
                    <Ionicons name="star" size={11} color={colors.secondary} />
                    <Text style={[styles.unlockedSubText, { color: colors.secondary }]}>
                      {isUz ? 'Ochilgan' : 'Разблокировано'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.lockedProgressContainer}>
                    <View
                      style={[
                        styles.progressBarTrack,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${progressPercent}%`,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[styles.badgeProgressText, { color: colors.textTertiary }]}
                      numberOfLines={1}
                    >
                      {getBadgeProgressText(item, isUz)}
                    </Text>
                  </View>
                )}
              </AnimatedPressable>
            </View>
          );
        })}
      </View>

      {/* Fallback Achievement Detail Modal (if used standalone without onSelectAchievement) */}
      {!onSelectAchievement && selectedAchievement && (
        <AchievementDetailModal
          achievement={selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </Animated.View>

  );
};

export const AchievementsSection = React.memo(AchievementsSectionComponent);

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 0,
  },
  sparkleIcon: {
    marginRight: 4,
  },
  counterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 0,
  },
  tabButtonActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#0D6B4E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {},
    }),
  },
  tabButtonInactive: {},
  tabButtonText: {
    fontSize: 13,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  gridColumn: {
    width: '50%',
    padding: 4,
  },
  badgeCard: {
    minHeight: 124,
    borderRadius: 18,
    padding: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 0,
  },
  badgeCardUnlocked: {
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: {},
    }),
  },
  badgeCardLocked: {},
  badgeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  indicatorPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTitle: {
    fontSize: 13,
    lineHeight: 17,
    marginBottom: 8,
  },
  unlockedSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unlockedSubText: {
    fontSize: 11,
    fontWeight: '700',
  },
  lockedProgressContainer: {
    width: '100%',
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  badgeProgressText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

