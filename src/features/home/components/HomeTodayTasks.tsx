import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { GlassView } from '@/shared/components/GlassView';

import { useProgressStore, getTodayDateString } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useLessonStore } from '@/stores/lessonStore';
import { useMemorizationStore } from '@/stores/memorizationStore';
import {
  generateDailyQuests,
  type DailyQuest,
  type UserProgressProfile,
} from '../services/dailyQuestsEngine';

export interface HomeTodayTasksProps {}

export const HomeTodayTasks: React.FC<HomeTodayTasksProps> = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing, radius, isDark } = useTheme();

  const userSeed = useSettingsStore((s) => s.userSeed) || 'hifzhub_seed_default';
  const language = useSettingsStore((s) => s.language);
  const currentStreak = useProgressStore((s) => s.currentStreak);
  const dailyTarget = useProgressStore((s) => s.dailyTarget);
  const completedMap = useProgressStore((s) => s.tasksCompleted);
  const toggleTaskStore = useProgressStore((s) => s.toggleTask);
  const addXP = useLessonStore((s) => s.addXP);

  const completedLessons = useLessonStore((s) => s.completedLessons);
  const unlockedModules = useLessonStore((s) => s.unlockedModules);
  const memorizationCards = useMemorizationStore((s) => s.cards);

  const todayKey = getTodayDateString();

  // Construct current player progress profile for the adaptive quest generator
  const profile: UserProgressProfile = useMemo(() => {
    const completedLessonsCount = Object.keys(completedLessons).length;
    const memorizedAyahsCount = Object.keys(memorizationCards).length;
    let dueCardsCount = 0;
    try {
      dueCardsCount = useMemorizationStore.getState().getDueCards().length;
    } catch {
      dueCardsCount = 0;
    }

    const activeModuleId =
      unlockedModules && unlockedModules.length > 0
        ? unlockedModules[unlockedModules.length - 1]
        : 1;

    return {
      userSeed,
      todayDateKey: todayKey,
      completedLessonsCount,
      activeModuleId,
      memorizedAyahsCount,
      dueCardsCount,
      currentStreak,
      dailyTargetAyahs: dailyTarget,
    };
  }, [
    userSeed,
    todayKey,
    completedLessons,
    unlockedModules,
    memorizationCards,
    currentStreak,
    dailyTarget,
  ]);

  // Generate the 3 personalized daily quests using the Mulberry32 PRNG
  const quests: DailyQuest[] = useMemo(() => {
    return generateDailyQuests(profile, completedMap);
  }, [profile, completedMap]);

  const completedCount = quests.filter((q) => Boolean(completedMap[q.id])).length;
  const isAllDone = quests.length > 0 && completedCount === quests.length;

  const handleToggleQuest = (quest: DailyQuest) => {
    const isCurrentlyDone = Boolean(completedMap[quest.id]);
    if (!isCurrentlyDone) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addXP(quest.xpReward);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleTaskStore(quest.id);
  };

  const handleNavigate = (route?: string) => {
    if (!route) return;
    void Haptics.selectionAsync();
    router.push(route as any);
  };

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.md, marginTop: spacing.md }]}>
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Feather name="check-square" size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === 'uz' ? 'Bugungi vazifalar' : 'Задачи на сегодня'}
          </Text>
        </View>

        {/* Progress pill counter */}
        <View
          style={[
            styles.progressBadge,
            {
              backgroundColor: isAllDone
                ? 'rgba(212, 175, 55, 0.18)'
                : isDark
                ? 'rgba(13, 107, 78, 0.25)'
                : 'rgba(13, 107, 78, 0.12)',
              borderColor: isAllDone ? '#D4AF37' : colors.primary + '30',
            },
          ]}
        >
          <Text
            style={[
              styles.progressBadgeText,
              { color: isAllDone ? '#D4AF37' : colors.primary },
            ]}
          >
            {completedCount} / {quests.length} {language === 'uz' ? 'bajarildi' : 'выполнено'}
          </Text>
        </View>
      </View>

      {/* Main Quests Card */}
      <GlassView borderRadius={radius.lg} style={styles.glassCard}>
        {quests.map((quest, index) => {
          const isDone = Boolean(completedMap[quest.id]);
          const title = language === 'uz' ? quest.titleUz : quest.titleRu;
          const description =
            language === 'uz' ? quest.descriptionUz : quest.descriptionRu;
          const badgeText = language === 'uz' ? quest.badgeUz : quest.badgeRu;

          return (
            <Animated.View
              key={quest.id}
              entering={FadeInDown.delay(200 + index * 70).springify()}
            >
              <View
                style={[
                  styles.taskRow,
                  index > 0 && {
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                {/* Checkbox Touch Area */}
                <Pressable
                  onPress={() => handleToggleQuest(quest)}
                  hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
                  style={styles.checkboxContainer}
                  accessibilityRole="checkbox"
                  accessibilityLabel={title}
                  accessibilityState={{ checked: isDone }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isDone
                          ? colors.primary
                          : isDark
                          ? 'rgba(255,255,255,0.25)'
                          : 'rgba(13, 107, 78, 0.25)',
                        backgroundColor: isDone ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    {isDone ? (
                      <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                    ) : null}
                  </View>
                </Pressable>

                {/* Quest Details & Clickable Area */}
                <Pressable
                  onPress={() => {
                    if (!isDone && quest.route) {
                      handleNavigate(quest.route);
                    } else {
                      handleToggleQuest(quest);
                    }
                  }}
                  style={styles.contentPressable}
                >
                  <View style={styles.textContainer}>
                    {/* Tags row: Pillar category badge + XP reward */}
                    <View style={styles.tagRow}>
                      <View
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: `${quest.color}18` },
                        ]}
                      >
                        <Text style={[styles.categoryText, { color: quest.color }]}>
                          {badgeText}
                        </Text>
                      </View>

                      <View style={styles.xpBadge}>
                        <Ionicons name="sparkles" size={10} color="#D4AF37" />
                        <Text style={styles.xpBadgeText}>+{quest.xpReward} XP</Text>
                      </View>
                    </View>

                    {/* Quest Title */}
                    <Text
                      style={[
                        styles.taskTitle,
                        {
                          color: isDone ? colors.textTertiary : colors.text,
                          textDecorationLine: isDone ? 'line-through' : 'none',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {title}
                    </Text>

                    {/* Quest Subtitle / Tip */}
                    <Text
                      style={[
                        styles.taskSubtitle,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {description}
                    </Text>
                  </View>

                  {/* Navigation chevron if task has a link */}
                  {!isDone && quest.route && (
                    <View style={styles.actionChevron}>
                      <Feather
                        name="chevron-right"
                        size={16}
                        color={colors.textTertiary}
                      />
                    </View>
                  )}
                </Pressable>
              </View>
            </Animated.View>
          );
        })}

        {/* Celebration Banner when all 3 are completed */}
        {isAllDone && (
          <Animated.View
            entering={ZoomIn.duration(280).springify()}
            style={[
              styles.completedBanner,
              {
                backgroundColor: isDark
                  ? 'rgba(212, 175, 55, 0.15)'
                  : 'rgba(212, 175, 55, 0.12)',
                borderColor: 'rgba(212, 175, 55, 0.35)',
              },
            ]}
          >
            <Ionicons name="trophy" size={20} color="#D4AF37" />
            <View style={styles.completedTextCol}>
              <Text style={styles.completedTitle}>
                {language === 'uz'
                  ? 'Barcha vazifalar bajarildi!'
                  : 'Все задачи на сегодня выполнены!'}
              </Text>
              <Text style={[styles.completedSub, { color: colors.textSecondary }]}>
                {language === 'uz'
                  ? 'Ajoyib natija! Baraka toping 🌟'
                  : 'Отличный результат! Так держать 🌟'}
              </Text>
            </View>
          </Animated.View>
        )}
      </GlassView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  glassCard: {
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkboxContainer: {
    paddingVertical: 4,
    paddingEnd: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  xpBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D4AF37',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  taskSubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '400',
  },
  actionChevron: {
    marginStart: 8,
    paddingStart: 4,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 8,
  },
  completedTextCol: {
    flex: 1,
  },
  completedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4AF37',
  },
  completedSub: {
    fontSize: 11,
    marginTop: 1,
  },
});
