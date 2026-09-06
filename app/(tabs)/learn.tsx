import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/shared/theme';
import { GlassView, AnimatedPressable } from '@/shared/components';
import { useScrollTabBar } from '@/shared/hooks/useScrollTabBar';
import { useLessonModules } from '@/features/alphabet/hooks/useLessonContent';
import { LessonManagerModal } from '@/features/alphabet/components/LessonManagerModal';
import { useLessonStore } from '@/stores/lessonStore';
import type { LessonModule } from '@/features/alphabet/types';

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, colors, spacing, radius } = useTheme();
  const { onScroll, scrollEventThrottle } = useScrollTabBar();
  const { modules } = useLessonModules();
  const [managerVisible, setManagerVisible] = useState(false);

  const totalXP = useLessonStore((s) => s.totalXP);
  const getModuleProgress = useLessonStore((s) => s.getModuleProgress);
  const isModuleUnlocked = useLessonStore((s) => s.isModuleUnlocked);

  const handleModulePress = useCallback(
    (module: LessonModule) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/module/${module.moduleId}` as any);
    },
    [router]
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
            paddingBottom: insets.bottom + spacing.xxl + 64,
            paddingHorizontal: spacing.md,
          },
        ]}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        {/* Header Area */}
        <View style={[styles.header, { marginBottom: spacing.lg }]}>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('tabs.learn', { defaultValue: 'Обучение' })}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('learn.subtitle', { defaultValue: 'Пошаговое изучение чтения Корана' })}
            </Text>
          </View>

          <View style={styles.headerRightRow}>
            {/* Quick Content Manager / Admin Button */}
            <AnimatedPressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setManagerVisible(true);
              }}
              style={[
                styles.adminBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
              accessibilityLabel="Lesson Architecture & Content Manager"
            >
              <Ionicons
                name="construct-outline"
                size={18}
                color={colors.textSecondary}
              />
            </AnimatedPressable>

            {/* Golden XP Badge */}
            <View
              style={[
                styles.xpBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(212, 167, 69, 0.18)'
                    : 'rgba(212, 167, 69, 0.12)',
                  borderColor: isDark
                    ? 'rgba(212, 167, 69, 0.35)'
                    : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
            >
              <Ionicons name="star" size={16} color="#D4A745" />
              <Text style={styles.xpText}>{totalXP} XP</Text>
            </View>
          </View>
        </View>

        {/* Module Cards */}
        <View style={styles.modulesList}>
          {modules.map((module, index) => {
            const isUnlocked = isModuleUnlocked(module.moduleId);
            const progress = getModuleProgress(module.moduleId, module.lessonsCount);
            const completedCount = progress?.completed ?? 0;
            const percentage = progress?.percentage ?? 0;

            return (
              <Animated.View
                key={module.moduleId}
                entering={FadeInDown.delay(index * 90).duration(450).springify()}
                style={styles.cardWrapper}
              >
                <AnimatedPressable
                  onPress={() => handleModulePress(module)}
                  disabled={!isUnlocked}
                  style={[
                    styles.pressable,
                    !isUnlocked && styles.lockedCard,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${module.moduleTitle}, ${isUnlocked ? t('learn.unlocked', { defaultValue: 'доступно' }) : t('learn.locked', { defaultValue: 'заблокировано' })}`}
                >
                  <GlassView
                    borderRadius={radius.lg}
                    style={styles.cardContainer}
                  >
                    {/* Left Colored Accent Bar (4px wide) */}
                    <View
                      style={[
                        styles.accentBar,
                        { backgroundColor: module.color },
                      ]}
                    />

                    {/* Card Content Area */}
                    <View style={styles.cardContent}>
                      {/* Top Row: Icon + Title & Description */}
                      <View style={styles.topRow}>
                        <View
                          style={[
                            styles.iconContainer,
                            {
                              backgroundColor: isDark
                                ? `${module.color}25`
                                : `${module.color}15`,
                            },
                          ]}
                        >
                          <Ionicons
                            name={module.icon as any}
                            size={32}
                            color={module.color}
                          />
                        </View>

                        <View style={styles.infoContainer}>
                          <Text
                            style={[styles.moduleTitle, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {module.moduleTitle}
                          </Text>
                          <Text
                            style={[
                              styles.moduleDescription,
                              { color: colors.textSecondary },
                            ]}
                            numberOfLines={2}
                          >
                            {module.moduleDescription}
                          </Text>
                        </View>
                      </View>

                      {/* Spacer */}
                      <View style={styles.spacer} />

                      {/* Bottom Section: Progress bar + Lesson count */}
                      <View style={styles.progressSection}>
                        <View
                          style={[
                            styles.progressBarTrack,
                            {
                              backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.10)'
                                : 'rgba(0, 0, 0, 0.06)',
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${Math.min(Math.max(percentage, 0), 100)}%`,
                                backgroundColor: module.color,
                              },
                            ]}
                          />
                        </View>

                        <View style={styles.metaRow}>
                          <Text
                            style={[
                              styles.lessonsCountText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {`${completedCount}/${module.lessonsCount} ${t('learn.lessons', { defaultValue: 'уроков' })}`}
                          </Text>

                          {percentage > 0 && (
                            <Text
                              style={[
                                styles.percentText,
                                { color: module.color },
                              ]}
                            >
                              {percentage === 100 ? `${t('learn.completed', { defaultValue: 'Пройдено' })} ✓` : `${percentage}%`}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Locked Overlay */}
                    {!isUnlocked && (
                      <View style={styles.lockedOverlay}>
                        <View
                          style={[
                            styles.lockIconCircle,
                            {
                              backgroundColor: isDark
                                ? 'rgba(26, 26, 44, 0.94)'
                                : 'rgba(255, 255, 255, 0.94)',
                              borderColor: isDark
                                ? 'rgba(255, 255, 255, 0.15)'
                                : 'transparent',
                              borderWidth: isDark ? 1 : 0,
                            },
                          ]}
                        >
                          <Ionicons
                            name="lock-closed"
                            size={24}
                            color={isDark ? '#E2E8F0' : '#475569'}
                          />
                        </View>
                      </View>
                    )}
                  </GlassView>
                </AnimatedPressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Dynamic Content Manager Modal */}
      <LessonManagerModal
        visible={managerVisible}
        onClose={() => setManagerVisible(false)}
      />
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
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  xpText: {
    color: '#D4A745',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modulesList: {
    gap: 16,
  },
  cardWrapper: {
    width: '100%',
  },
  pressable: {
    width: '100%',
  },
  lockedCard: {
    opacity: 0.5,
  },
  cardContainer: {
    height: 160,
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    zIndex: 2,
  },
  cardContent: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 14,
    paddingLeft: 18,
    paddingRight: 16,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 14,
    paddingTop: 2,
  },
  moduleTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  moduleDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  spacer: {
    flex: 1,
  },
  progressSection: {
    width: '100%',
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonsCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  lockIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 0,
      },
    }),
  },
});

