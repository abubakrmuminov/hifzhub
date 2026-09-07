import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
import { useBookmarkStore } from '@/stores/bookmarkStore';
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
  const dailyHistory = useProgressStore((s) => s.dailyHistory);
  const dailyActivities = useProgressStore((s) => s.dailyActivities);
  const addXP = useLessonStore((s) => s.addXP);

  const completedLessons = useLessonStore((s) => s.completedLessons);
  const unlockedModules = useLessonStore((s) => s.unlockedModules);
  const memorizationCards = useMemorizationStore((s) => s.cards);
  const memorizationSessions = useMemorizationStore((s) => s.sessions);
  const memorizationCurrentSession = useMemorizationStore((s) => s.currentSession);
  const bookmarks = useBookmarkStore((s) => s.bookmarks);

  const todayKey = getTodayDateString();

  // Construct current player progress profile with real activity metrics
  const profile: UserProgressProfile = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayMs = startOfDay.getTime();

    const completedLessonsList = Object.values(completedLessons);
    const completedLessonsCount = completedLessonsList.length;
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

    // 1. Quran Ayahs read today
    const ayahsReadToday = dailyHistory[todayKey] ?? 0;

    // 2. Hifz cards reviewed today
    let cardsReviewedToday = 0;
    try {
      cardsReviewedToday = useMemorizationStore.getState().getTodayStats().cardsReviewed;
    } catch {
      cardsReviewedToday = 0;
    }

    // 3. New Hifz cards added today
    const cardsAddedToday = Object.values(memorizationCards).filter(
      (c) => (c.addedAt ?? 0) >= startOfDayMs
    ).length;

    // 4. Lessons completed today
    const completedLessonsToday = completedLessonsList.filter(
      (l) => (l.completedAt ?? 0) >= startOfDayMs
    ).length;

    // 5. 100% perfect quiz completed today
    const perfectQuizzesToday = completedLessonsList.filter(
      (l) => (l.completedAt ?? 0) >= startOfDayMs && l.score === 100
    ).length;

    // 6. Bookmarks added today
    const bookmarksAddedToday = Object.values(bookmarks).filter(
      (b) => (b.addedAt ?? 0) >= startOfDayMs
    ).length;

    // 7. Interactive audio and daily reflection activities
    const todayActivities = dailyActivities?.[todayKey] || {};

    return {
      userSeed,
      todayDateKey: todayKey,
      completedLessonsCount,
      activeModuleId,
      memorizedAyahsCount,
      dueCardsCount,
      currentStreak,
      dailyTargetAyahs: dailyTarget,

      ayahsReadToday,
      cardsReviewedToday,
      cardsAddedToday,
      completedLessonsToday,
      perfectQuizzesToday,
      bookmarksAddedToday,
      readDailyAyahToday: Boolean(todayActivities.readDailyAyah),
      listenedAudioToday: Boolean(todayActivities.listenedAudio),
      usedRepeatToday: Boolean(todayActivities.usedRepeat),
      usedRangeLoopToday: Boolean(todayActivities.usedRangeLoop),
    };
  }, [
    userSeed,
    todayKey,
    completedLessons,
    unlockedModules,
    memorizationCards,
    memorizationSessions,
    memorizationCurrentSession,
    currentStreak,
    dailyTarget,
    dailyHistory,
    dailyActivities,
    bookmarks,
  ]);

  // Generate the 3 personalized daily quests with real progress
  const quests: DailyQuest[] = useMemo(() => {
    return generateDailyQuests(profile, completedMap);
  }, [profile, completedMap]);

  // Automatically award XP and record task completion in store when criteria are met
  useEffect(() => {
    let newlyCompleted = false;
    for (const q of quests) {
      if (q.completed && !completedMap[q.id]) {
        toggleTaskStore(q.id);
        addXP(q.xpReward);
        newlyCompleted = true;
      }
    }
    if (newlyCompleted) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [quests, completedMap, toggleTaskStore, addXP]);

  const completedCount = quests.filter((q) => Boolean(completedMap[q.id])).length;
  const isAllDone = quests.length > 0 && completedCount === quests.length;

  const handlePressQuest = (quest: DailyQuest) => {
    if (quest.completed) {
      void Haptics.selectionAsync();
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (quest.route) {
      router.push(quest.route as any);
    }
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
          const progressPercent = Math.min(
            100,
            Math.max(0, Math.round((quest.current / quest.target) * 100))
          );

          return (
            <Animated.View
              key={quest.id}
              entering={FadeInDown.delay(200 + index * 70).springify()}
            >
              <AnimatedPressable
                onPress={() => handlePressQuest(quest)}
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
                {/* Left Status Badge */}
                <View style={styles.statusCol}>
                  {isDone ? (
                    <View
                      style={[
                        styles.statusBadgeDone,
                        {
                          backgroundColor: isDark
                            ? 'rgba(212, 175, 55, 0.20)'
                            : 'rgba(212, 175, 55, 0.16)',
                          borderColor: '#D4AF37',
                        },
                      ]}
                    >
                      <Ionicons name="checkmark-sharp" size={15} color="#D4AF37" />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.statusBadgePending,
                        {
                          backgroundColor: `${quest.color}15`,
                          borderColor: `${quest.color}35`,
                        },
                      ]}
                    >
                      <Feather name={quest.icon as any} size={14} color={quest.color} />
                    </View>
                  )}
                </View>

                {/* Main Content */}
                <View style={styles.textContainer}>
                  {/* Tags row: Category badge + XP reward + Progress fraction */}
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

                    {/* Dynamic progress counter */}
                    <View style={styles.progressCounterBox}>
                      <Text
                        style={[
                          styles.progressCounterText,
                          {
                            color: isDone
                              ? '#D4AF37'
                              : isDark
                              ? 'rgba(255, 255, 255, 0.65)'
                              : 'rgba(0, 0, 0, 0.55)',
                          },
                        ]}
                      >
                        {quest.current} / {quest.target}
                      </Text>
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

                  {/* Real-time Progress Bar */}
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
                          backgroundColor: isDone ? '#D4AF37' : quest.color,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Right Action Button / Chevron */}
                {!isDone && quest.route ? (
                  <View style={styles.actionChevron}>
                    <Feather
                      name="chevron-right"
                      size={18}
                      color={colors.textTertiary}
                    />
                  </View>
                ) : null}
              </AnimatedPressable>
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
    paddingVertical: 12,
  },
  statusCol: {
    paddingEnd: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeDone: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgePending: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
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
  progressCounterBox: {
    marginStart: 'auto',
  },
  progressCounterText: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
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
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  actionChevron: {
    marginStart: 10,
    paddingStart: 2,
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
