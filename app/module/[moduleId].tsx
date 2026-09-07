import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polygon, Line } from 'react-native-svg';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/shared/theme';
import { GlassView, AnimatedPressable } from '@/shared/components';
import { useModuleDetail } from '@/features/alphabet';
import { useLessonStore } from '@/stores';
import type { Lesson, LessonModule } from '@/features/alphabet/types';

interface PulsingRingsProps {
  color: string;
  isHexagon?: boolean;
}

/**
 * Pulsing halo animation surrounding the current active lesson node.
 */
const PulsingRings: React.FC<PulsingRingsProps> = ({ color, isHexagon = false }) => {
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);

  useEffect(() => {
    pulse1.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.cubic) }),
      -1,
      false
    );

    const timer = setTimeout(() => {
      pulse2.value = withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.out(Easing.cubic) }),
        -1,
        false
      );
    }, 1100);

    return () => clearTimeout(timer);
  }, [pulse1, pulse2]);

  const style1 = useAnimatedStyle(() => {
    const scale = interpolate(pulse1.value, [0, 1], [0.96, 1.45]);
    const opacity = interpolate(
      pulse1.value,
      [0, 0.2, 0.8, 1],
      [0.85, 0.6, 0.15, 0]
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const style2 = useAnimatedStyle(() => {
    const scale = interpolate(pulse2.value, [0, 1], [0.96, 1.45]);
    const opacity = interpolate(
      pulse2.value,
      [0, 0.2, 0.8, 1],
      [0.85, 0.6, 0.15, 0]
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View pointerEvents="none" style={styles.pulseContainer}>
      <Animated.View
        style={[
          styles.pulsingRing,
          {
            borderColor: color,
            borderRadius: isHexagon ? 22 : 40,
          },
          style1,
        ]}
      />
      <Animated.View
        style={[
          styles.pulsingRing,
          {
            borderColor: color,
            borderRadius: isHexagon ? 22 : 40,
          },
          style2,
        ]}
      />
    </View>
  );
};

interface LessonPathRowProps {
  lesson: Lesson;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isCompleted: boolean;
  isUnlocked: boolean;
  isCurrent: boolean;
  isExam: boolean;
  moduleColor: string;
  isDark: boolean;
  textColor: string;
  textSecondaryColor: string;
  textTertiaryColor: string;
  radiusMd: number;
  onPress: (lesson: Lesson, isUnlocked: boolean) => void;
  examLabel: string;
  minutesLabel: string;
  completedLabel: string;
  unlockedLabel: string;
  lockedLabel: string;
}

const LessonPathRow = React.memo<LessonPathRowProps>(({
  lesson,
  index,
  isFirst,
  isLast,
  isCompleted,
  isUnlocked,
  isCurrent,
  isExam,
  moduleColor,
  isDark,
  textColor,
  textSecondaryColor,
  textTertiaryColor,
  radiusMd,
  onPress,
  examLabel,
  minutesLabel,
  completedLabel,
  unlockedLabel,
  lockedLabel,
}) => {
  // Connector colors
  const topConnectorActive = isFirst ? false : isUnlocked;
  const bottomConnectorActive = isCompleted;

  const activeLineColor = moduleColor;
  const lockedLineColor = isDark
    ? 'rgba(255, 255, 255, 0.16)'
    : 'rgba(0, 0, 0, 0.12)';

  const topColor = topConnectorActive ? activeLineColor : lockedLineColor;
  const bottomColor = bottomConnectorActive ? activeLineColor : lockedLineColor;

  // Node Colors
  const nodeFill = isCompleted || isCurrent
    ? moduleColor
    : isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.06)';

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 45, 600)).duration(380)}
      style={styles.lessonRowWrapper}
    >
      {/* Connected Path Left Column (76px wide) */}
      <View style={styles.timelineColumn}>
        {/* Top connector segment */}
        {!isFirst && (
          <View style={[styles.connectorSegment, styles.connectorTop]}>
            <Svg height="100%" width="4">
              <Line
                x1="2"
                y1="0"
                x2="2"
                y2="100%"
                stroke={topColor}
                strokeWidth="2.5"
                strokeDasharray="6, 5"
                strokeLinecap="round"
              />
            </Svg>
          </View>
        )}

        {/* Bottom connector segment */}
        {!isLast && (
          <View style={[styles.connectorSegment, styles.connectorBottom]}>
            <Svg height="100%" width="4">
              <Line
                x1="2"
                y1="0"
                x2="2"
                y2="100%"
                stroke={bottomColor}
                strokeWidth="2.5"
                strokeDasharray="6, 5"
                strokeLinecap="round"
              />
            </Svg>
          </View>
        )}

        {/* 64px Node Center Wrapper */}
        <View style={styles.nodeCenterContainer}>
          {isCurrent && (
            <PulsingRings
              color={moduleColor}
              isHexagon={isExam}
            />
          )}

          <AnimatedPressable
            onPress={() => onPress(lesson, isUnlocked)}
            disabled={!isUnlocked}
            style={[
              styles.nodePressable,
              !isUnlocked && styles.lockedNodePressable,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${lesson.title}, ${
              isCompleted
                ? completedLabel
                : isUnlocked
                ? unlockedLabel
                : lockedLabel
            }`}
          >
            {isExam ? (
              /* Exam Hexagon Badge */
              <View style={styles.hexagonWrapper}>
                <Svg width={64} height={64} viewBox="0 0 64 64">
                  <Polygon
                    points="32,3 59,17 59,47 32,61 5,47 5,17"
                    fill={nodeFill}
                  />
                </Svg>
                <View style={styles.nodeIconOverlay}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={28} color="#FFFFFF" />
                  ) : isCurrent ? (
                    <Ionicons name="trophy" size={26} color="#FFFFFF" />
                  ) : (
                    <Ionicons
                      name="lock-closed"
                      size={22}
                      color={isDark ? '#888899' : '#888888'}
                    />
                  )}
                </View>
              </View>
            ) : (
              /* Standard 64px Circular Node */
              <View
                style={[
                  styles.circleNode,
                  {
                    backgroundColor: nodeFill,
                  },
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={28} color="#FFFFFF" />
                ) : isCurrent ? (
                  <Ionicons
                    name="play"
                    size={26}
                    color="#FFFFFF"
                    style={styles.playIconOffset}
                  />
                ) : (
                  <Ionicons
                    name="lock-closed"
                    size={22}
                    color={isDark ? '#888899' : '#888888'}
                  />
                )}
              </View>
            )}
          </AnimatedPressable>
        </View>
      </View>

      {/* Right Column: Lesson Information Card */}
      <View style={styles.cardColumn}>
        <AnimatedPressable
          onPress={() => onPress(lesson, isUnlocked)}
          disabled={!isUnlocked}
          style={[
            styles.cardPressable,
            !isUnlocked && styles.lockedCardPressable,
          ]}
        >
          <GlassView
            borderRadius={radiusMd}
            style={[
              styles.lessonCard,
              isCurrent && {
                borderColor: isDark
                  ? `${moduleColor}70`
                  : `${moduleColor}45`,
                borderWidth: 1.5,
              },
            ]}
          >
            <View style={styles.lessonCardInner}>
              {/* Title Row */}
              <View style={styles.cardTitleRow}>
                <Text
                  style={[
                    styles.lessonTitle,
                    {
                      color: isUnlocked
                        ? textColor
                        : textTertiaryColor,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {lesson.title}
                </Text>
                {isCompleted && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={moduleColor}
                  />
                )}
              </View>

              {/* Optional Description */}
              {Boolean(lesson.description) && (
                <Text
                  style={[
                    styles.lessonDescription,
                    { color: textSecondaryColor },
                  ]}
                  numberOfLines={2}
                >
                  {lesson.description}
                </Text>
              )}

              {/* Metadata Badges Row */}
              <View style={styles.badgesRow}>
                {/* Duration Badge */}
                <View
                  style={[
                    styles.badgePill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.07)'
                        : 'rgba(0, 0, 0, 0.04)',
                    },
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color={textSecondaryColor}
                  />
                  <Text
                    style={[
                      styles.badgeText,
                      { color: textSecondaryColor },
                    ]}
                  >
                    {lesson.estimatedMinutes} {minutesLabel}
                  </Text>
                </View>

                {/* Golden XP Badge */}
                <View
                  style={[
                    styles.badgePill,
                    styles.xpBadgePill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(212, 167, 69, 0.18)'
                        : 'rgba(212, 167, 69, 0.12)',
                    },
                  ]}
                >
                  <Ionicons name="star" size={13} color="#D4A745" />
                  <Text style={styles.xpBadgeText}>
                    +{lesson.xpReward} XP
                  </Text>
                </View>

                {/* Exam Badge Tag */}
                {isExam && (
                  <View
                    style={[
                      styles.badgePill,
                      {
                        backgroundColor: isDark
                          ? `${moduleColor}25`
                          : `${moduleColor}15`,
                      },
                    ]}
                  >
                    <Ionicons
                      name="trophy"
                      size={12}
                      color={moduleColor}
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        { color: moduleColor, fontWeight: '700' },
                      ]}
                    >
                      {examLabel}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </GlassView>
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
});

export default function ModuleDetailScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { isDark, colors, spacing, radius } = useTheme();

  // Parse moduleId and load dynamic module + lessons
  const parsedModuleId = parseInt(moduleId ?? '1', 10);
  const { module: loadedModule, lessons } = useModuleDetail(parsedModuleId);

  const currentModule: LessonModule = useMemo(() => {
    if (loadedModule) return loadedModule;
    return {
      moduleId: parsedModuleId,
      moduleTitle: `${t('learn.module', { defaultValue: 'Модуль' })} ${parsedModuleId}`,
      moduleDescription: '',
      lessonsCount: lessons.length,
      icon: 'book-outline',
      color: '#0D6B4E',
      totalXP: 100,
    };
  }, [loadedModule, parsedModuleId, t, lessons.length]);

  // Lesson store subscription
  const completedLessons = useLessonStore((s) => s.completedLessons);
  const isLessonCompleted = useLessonStore((s) => s.isLessonCompleted);

  // Single-pass memoized status and completion calculation
  const { statuses: lessonStatuses, completedCount } = useMemo(() => {
    let prevCompleted = true;
    let count = 0;
    const statuses = lessons.map((lesson, idx) => {
      const isCompleted = Boolean(
        isLessonCompleted(lesson.lessonId) ||
          completedLessons[lesson.lessonId]?.completedAt ||
          completedLessons[lesson.lessonId]?.passed
      );
      if (isCompleted) count++;
      const isUnlocked = idx === 0 || prevCompleted;
      prevCompleted = isCompleted;
      return {
        isCompleted,
        isUnlocked,
        isCurrent: isUnlocked && !isCompleted,
        isExam: Boolean(lesson.isExam || idx === lessons.length - 1),
      };
    });
    return { statuses, completedCount: count };
  }, [lessons, isLessonCompleted, completedLessons]);

  const totalLessons = currentModule.lessonsCount || lessons.length || 1;
  const progressPercent = Math.min(
    100,
    Math.round((completedCount / totalLessons) * 100)
  );

  const handleBack = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/learn' as any);
    }
  }, [router]);

  const handleLessonPress = useCallback(
    (lesson: Lesson, isUnlocked: boolean) => {
      if (!isUnlocked) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/lesson/${lesson.lessonId}` as any);
    },
    [router]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Area */}
      <View
        style={[
          styles.headerWrapper,
          {
            paddingTop: insets.top + spacing.xs,
          },
        ]}
      >
        {/* Navigation Bar: Back button + Centered Module Title */}
        <View style={styles.navBar}>
          <AnimatedPressable
            onPress={handleBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t('common.back', { defaultValue: 'Назад' })}
          >
            <View
              style={[
                styles.backButtonCircle,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </View>
          </AnimatedPressable>

          <View style={styles.navTitleContainer}>
            <Text
              style={[styles.navTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {currentModule.moduleTitle}
            </Text>
          </View>

          {/* Symmetrical placeholder */}
          <View style={styles.backButtonPlaceholder} />
        </View>

        {/* Module Progress Hero Card */}
        <View style={styles.heroWrapper}>
          <GlassView borderRadius={radius.lg} style={styles.heroCard}>
            {/* Left Accent Strip */}
            <View
              style={[
                styles.heroAccentStrip,
                { backgroundColor: currentModule.color },
              ]}
            />

            <View style={styles.heroBody}>
              {/* Module Metadata Row */}
              <View style={styles.heroTopRow}>
                <View
                  style={[
                    styles.heroIconWrapper,
                    {
                      backgroundColor: isDark
                        ? `${currentModule.color}25`
                        : `${currentModule.color}15`,
                    },
                  ]}
                >
                  <Ionicons
                    name={currentModule.icon as any}
                    size={28}
                    color={currentModule.color}
                  />
                </View>

                <View style={styles.heroTexts}>
                  <View style={styles.moduleTagRow}>
                    <View
                      style={[
                        styles.moduleTag,
                        { backgroundColor: `${currentModule.color}22` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.moduleTagText,
                          { color: currentModule.color },
                        ]}
                      >
                        {`${t('learn.module', { defaultValue: 'Модуль' })} ${currentModule.moduleId}`}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.heroDescription,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    {currentModule.moduleDescription}
                  </Text>
                </View>
              </View>

              {/* Progress Summary Section */}
              <View style={styles.heroProgressSection}>
                <View style={styles.heroProgressInfo}>
                  <Text
                    style={[styles.progressSummaryText, { color: colors.text }]}
                  >
                    {`${completedCount}/${totalLessons} ${t('learn.lessons', { defaultValue: 'уроков' })} · ${currentModule.totalXP} XP`}
                  </Text>
                  <Text
                    style={[styles.percentLabel, { color: currentModule.color }]}
                  >
                    {progressPercent === 100 ? `${t('learn.completed', { defaultValue: 'Завершено' })} ✓` : `${progressPercent}%`}
                  </Text>
                </View>

                {/* Progress Bar */}
                <View
                  style={[
                    styles.progressTrack,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.10)'
                        : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progressPercent}%`,
                        backgroundColor: currentModule.color,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </GlassView>
        </View>
      </View>

      {/* Lesson Path Timeline */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + spacing.xxl + 48,
          },
        ]}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        <View style={styles.timelineList}>
          {lessons.map((lesson, index) => {
            const status = lessonStatuses[index];
            return (
              <LessonPathRow
                key={lesson.lessonId}
                lesson={lesson}
                index={index}
                isFirst={index === 0}
                isLast={index === lessons.length - 1}
                isCompleted={status?.isCompleted ?? false}
                isUnlocked={status?.isUnlocked ?? false}
                isCurrent={status?.isCurrent ?? false}
                isExam={status?.isExam ?? false}
                moduleColor={currentModule.color}
                isDark={isDark}
                textColor={colors.text}
                textSecondaryColor={colors.textSecondary}
                textTertiaryColor={colors.textTertiary}
                radiusMd={radius.md}
                onPress={handleLessonPress}
                examLabel={t('learn.exam', { defaultValue: 'Экзамен' })}
                minutesLabel={t('learn.minutes', { defaultValue: 'мин' })}
                completedLabel={t('learn.completed', { defaultValue: 'пройден' })}
                unlockedLabel={t('learn.unlocked', { defaultValue: 'доступен' })}
                lockedLabel={t('learn.locked', { defaultValue: 'заблокирован' })}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  navTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroWrapper: {
    marginTop: 4,
  },
  heroCard: {
    overflow: 'hidden',
    position: 'relative',
  },
  heroAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    zIndex: 3,
  },
  heroBody: {
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroTexts: {
    flex: 1,
  },
  moduleTagRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  moduleTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  moduleTagText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  heroProgressSection: {
    marginTop: 12,
  },
  heroProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressSummaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  percentLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  timelineList: {
    width: '100%',
  },
  lessonRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 96,
  },
  timelineColumn: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
    minHeight: 96,
  },
  connectorSegment: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  connectorTop: {
    top: 0,
    bottom: '50%',
  },
  connectorBottom: {
    top: '50%',
    bottom: 0,
  },
  nodeCenterContainer: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
  },
  pulseContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  pulsingRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderWidth: 2.5,
  },
  nodePressable: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  lockedNodePressable: {
    opacity: 0.4,
  },
  circleNode: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconOffset: {
    marginLeft: 3,
  },
  hexagonWrapper: {
    width: 64,
    height: 64,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardColumn: {
    flex: 1,
    paddingLeft: 8,
    paddingVertical: 8,
  },
  cardPressable: {
    flex: 1,
  },
  lockedCardPressable: {
    opacity: 0.4,
  },
  lessonCard: {
    overflow: 'hidden',
  },
  lessonCardInner: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  lessonDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  xpBadgePill: {},
  xpBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4A745',
  },
});
