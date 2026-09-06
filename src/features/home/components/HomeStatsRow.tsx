import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/shared/theme';
import { ProgressRing } from '@/shared/components/ProgressRing';
import { GlassView } from '@/shared/components/GlassView';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useProgressStore, type DayActivity } from '@/stores/progressStore';
import { useSettingsStore } from '@/stores/settingsStore';

export interface HomeStatsRowProps {
  dailyCompleted?: number;
  dailyTarget?: number;
  streakDays?: number;
}

const TARGET_PRESETS = [5, 10, 20, 30, 50];

export const HomeStatsRow: React.FC<HomeStatsRowProps> = ({
  dailyCompleted: propCompleted,
  dailyTarget: propTarget,
  streakDays: propStreak,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing, radius, isDark } = useTheme();
  const language = useSettingsStore((s) => s.language);

  // Store state & actions
  const getTodayCompleted = useProgressStore((s) => s.getTodayCompleted);
  const storeTarget = useProgressStore((s) => s.dailyTarget);
  const getEffectiveStreak = useProgressStore((s) => s.getEffectiveStreak);
  const currentStreak = useProgressStore((s) => s.currentStreak);
  const dailyHistory = useProgressStore((s) => s.dailyHistory);
  const bestStreak = useProgressStore((s) => s.bestStreak);
  const checkAndRefreshDay = useProgressStore((s) => s.checkAndRefreshDay);
  const setDailyTarget = useProgressStore((s) => s.setDailyTarget);
  const recordAyahRead = useProgressStore((s) => s.recordAyahRead);
  const getLast7DaysActivity = useProgressStore((s) => s.getLast7DaysActivity);
  const resetTodayProgress = useProgressStore((s) => s.resetTodayProgress);

  const storeCompleted = useMemo(
    () => (typeof getTodayCompleted === 'function' ? getTodayCompleted() : 0),
    [getTodayCompleted, dailyHistory, storeTarget]
  );
  const storeStreak = useMemo(
    () => (typeof getEffectiveStreak === 'function' ? getEffectiveStreak() : currentStreak),
    [getEffectiveStreak, currentStreak]
  );

  // Modals state
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [isStreakModalVisible, setIsStreakModalVisible] = useState(false);

  useEffect(() => {
    checkAndRefreshDay();
  }, [checkAndRefreshDay]);

  const dailyCompleted = propCompleted ?? storeCompleted;
  const dailyTarget = propTarget ?? storeTarget;
  const streakDays = propStreak ?? storeStreak;

  const displayedCompleted = Math.min(dailyCompleted, dailyTarget);
  const progress = Math.min(1, Math.max(0, dailyCompleted / Math.max(1, dailyTarget)));
  const isGoalReached = dailyCompleted >= dailyTarget;
  const remaining = Math.max(0, dailyTarget - dailyCompleted);

  const weeklyActivity = useMemo(
    () => getLast7DaysActivity(language),
    [getLast7DaysActivity, language, dailyCompleted]
  );

  const streakMotivationText = useMemo(() => {
    if (streakDays <= 2) {
      return language === 'uz'
        ? "Boshlanishi ajoyib! Shu tarzda davom eting"
        : "Отличное начало! Продолжайте регулярно";
    }
    if (streakDays <= 6) {
      return language === 'uz'
        ? "Doimiy takrorlash maqsadga yetaklaydi!"
        : "Отличный темп! Не сбавляйте обороты";
    }
    return language === 'uz'
      ? "Ajoyib natija! Bir haftalik seriya!"
      : "Неделя без перерывов! Превосходный результат!";
  }, [streakDays, language]);

  const handleOpenGoal = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsGoalModalVisible(true);
  };

  const handleOpenStreak = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsStreakModalVisible(true);
  };

  const handleSelectPreset = (target: number) => {
    void Haptics.selectionAsync();
    setDailyTarget(target);
  };

  const handleAddAyahs = (count: number) => {
    if (isGoalReached) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    recordAyahRead(count);
  };

  const handleGoToQuran = () => {
    void Haptics.selectionAsync();
    setIsGoalModalVisible(false);
    setIsStreakModalVisible(false);
    router.push('/(tabs)/quran');
  };

  return (
    <View style={[styles.container, { marginTop: spacing.md, paddingHorizontal: spacing.md }]}>
      {/* 1. Daily Goal Card (Touchable) */}
      <Animated.View
        entering={FadeInDown.delay(0).springify()}
        style={styles.cardCol}
      >
        <AnimatedPressable
          onPress={handleOpenGoal}
          scaleValue={0.96}
          haptic="light"
          style={styles.pressableCard}
        >
          <GlassView borderRadius={radius.lg} style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconPill, { backgroundColor: colors.primary + '18' }]}>
                <Feather name="target" size={14} color={colors.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
                {t('home.dailyGoal')}
              </Text>
            </View>

            <View style={styles.ringWrapper}>
              <ProgressRing
                progress={progress}
                size={64}
                strokeWidth={6}
                color={isGoalReached ? colors.primary : colors.secondary}
                backgroundColor="rgba(0,0,0,0.06)"
                textColor={colors.text}
              />
            </View>

            <Text style={[styles.cardHighlight, { color: colors.text }]}>
              {displayedCompleted}/{dailyTarget} {t('quran.ayah', { defaultValue: 'аятов' })}
            </Text>

            <Text
              numberOfLines={1}
              style={[
                styles.cardSubtext,
                { color: isGoalReached ? colors.primary : colors.textSecondary },
              ]}
            >
              {isGoalReached
                ? t('home.goalAchieved')
                : t('home.remainingAyahs', { count: remaining })}
            </Text>
          </GlassView>
        </AnimatedPressable>
      </Animated.View>

      {/* 2. Streak Card (Touchable) */}
      <Animated.View
        entering={FadeInDown.delay(80).springify()}
        style={styles.cardCol}
      >
        <AnimatedPressable
          onPress={handleOpenStreak}
          scaleValue={0.96}
          haptic="light"
          style={styles.pressableCard}
        >
          <GlassView borderRadius={radius.lg} style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconPill, { backgroundColor: '#FF6B3518' }]}>
                <MaterialCommunityIcons name="fire" size={16} color="#FF6B35" />
              </View>
              <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
                {t('home.currentStreak')}
              </Text>
            </View>

            <View style={styles.streakWrapper}>
              <Text style={[styles.streakNumber, { color: colors.text }]}>
                {streakDays} {t('home.days')} 🔥
              </Text>
            </View>

            <Text numberOfLines={2} style={[styles.cardMotivation, { color: colors.textSecondary }]}>
              {streakMotivationText}
            </Text>
          </GlassView>
        </AnimatedPressable>
      </Animated.View>

      {/* ========================================================================= */}
      {/* 3. Daily Goal Modal */}
      {/* ========================================================================= */}
      <Modal
        visible={isGoalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsGoalModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsGoalModalVisible(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF' }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.iconPill, { backgroundColor: colors.primary + '20' }]}>
                  <Feather name="target" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t('home.goalSettings')}
                </Text>
              </View>
              <AnimatedPressable
                onPress={() => setIsGoalModalVisible(false)}
                scaleValue={0.9}
                style={styles.closeButton}
              >
                <Feather name="x" size={20} color={colors.textSecondary} />
              </AnimatedPressable>
            </View>

            {/* Large Progress Display */}
            <View style={styles.modalProgressSection}>
              <ProgressRing
                progress={progress}
                size={96}
                strokeWidth={9}
                color={isGoalReached ? colors.primary : colors.secondary}
                backgroundColor="rgba(0,0,0,0.06)"
                textColor={colors.text}
              />
              <Text style={[styles.modalCountText, { color: colors.text }]}>
                {displayedCompleted} / {dailyTarget}{' '}
                <Text style={{ fontSize: 16, fontWeight: 'normal', color: colors.textSecondary }}>
                  {t('quran.ayah', { defaultValue: 'аятов' })}
                </Text>
              </Text>
              <Text
                style={[
                  styles.modalSubstatus,
                  { color: isGoalReached ? colors.primary : colors.textSecondary },
                ]}
              >
                {isGoalReached
                  ? t('home.goalAchieved')
                  : t('home.remainingAyahs', { count: remaining })}
              </Text>
            </View>

            {/* Quick Add Buttons */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {isGoalReached
                  ? (language === 'uz' ? "Bugungi reja bajarildi! 🎉" : "План на сегодня выполнен! 🎉")
                  : t('home.addQuick')}
              </Text>
              {!isGoalReached ? (
                <View style={styles.quickAddRow}>
                  <AnimatedPressable
                    onPress={() => handleAddAyahs(1)}
                    style={[styles.quickAddBtn, { backgroundColor: colors.primary + '15' }]}
                  >
                    <Text style={[styles.quickAddBtnText, { color: colors.primary }]}>
                      {t('home.addOneAyah')}
                    </Text>
                  </AnimatedPressable>

                  <AnimatedPressable
                    onPress={() => handleAddAyahs(5)}
                    style={[styles.quickAddBtn, { backgroundColor: colors.primary + '15' }]}
                  >
                    <Text style={[styles.quickAddBtnText, { color: colors.primary }]}>
                      {t('home.addFiveAyahs')}
                    </Text>
                  </AnimatedPressable>
                </View>
              ) : (
                <Text style={{ fontSize: 12.5, color: colors.textSecondary, fontStyle: 'italic', marginBottom: 4 }}>
                  {language === 'uz'
                    ? "Ko'proq o'qish uchun quyidagi maqsadni oshiring:"
                    : "Чтобы продолжить, выберите цель выше:"}
                </Text>
              )}
            </View>

            {/* Target Presets */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {t('home.selectDailyTarget')}
              </Text>
              <View style={styles.presetRow}>
                {TARGET_PRESETS.map((preset) => {
                  const isSelected = dailyTarget === preset;
                  return (
                    <AnimatedPressable
                      key={preset}
                      onPress={() => handleSelectPreset(preset)}
                      style={[
                        styles.presetBtn,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetBtnText,
                          { color: isSelected ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {preset}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>

            {/* Reset count button */}
            <AnimatedPressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                resetTodayProgress();
              }}
              style={styles.resetTodayBtn}
            >
              <Feather name="rotate-ccw" size={13} color={colors.textTertiary} />
              <Text style={[styles.resetTodayBtnText, { color: colors.textTertiary }]}>
                {language === 'uz' ? "Bugungi hisobni 0 ga tushirish" : "Сбросить счёт за сегодня до 0"}
              </Text>
            </AnimatedPressable>

            {/* Action button */}
            <AnimatedPressable
              onPress={handleGoToQuran}
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="book-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryActionBtnText}>{t('home.goToQuran')}</Text>
            </AnimatedPressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ========================================================================= */}
      {/* 4. Streak Modal */}
      {/* ========================================================================= */}
      <Modal
        visible={isStreakModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStreakModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsStreakModalVisible(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF' }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.iconPill, { backgroundColor: '#FF6B3520' }]}>
                  <MaterialCommunityIcons name="fire" size={18} color="#FF6B35" />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t('home.streakModalTitle')}
                </Text>
              </View>
              <AnimatedPressable
                onPress={() => setIsStreakModalVisible(false)}
                scaleValue={0.9}
                style={styles.closeButton}
              >
                <Feather name="x" size={20} color={colors.textSecondary} />
              </AnimatedPressable>
            </View>

            {/* Fire Banner */}
            <View style={styles.streakBigBanner}>
              <Text style={styles.flameLarge}>🔥</Text>
              <Text style={[styles.streakBigNumber, { color: colors.text }]}>
                {t('home.streakInARow', { count: streakDays })}
              </Text>
              <View style={[styles.bestStreakPill, { backgroundColor: colors.secondary + '20' }]}>
                <Ionicons name="trophy-outline" size={14} color={colors.secondary} />
                <Text style={[styles.bestStreakText, { color: colors.secondary }]}>
                  {t('home.bestStreakRecord', { count: bestStreak })}
                </Text>
              </View>
            </View>

            {/* 7-Day Activity Calendar */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {t('home.last7Days')}
              </Text>
              <View style={styles.weekRow}>
                {weeklyActivity.map((day: DayActivity) => (
                  <View key={day.date} style={styles.weekDayCol}>
                    <Text
                      style={[
                        styles.weekDayName,
                        {
                          color: day.isToday ? colors.primary : colors.textSecondary,
                          fontWeight: day.isToday ? '800' : '500',
                        },
                      ]}
                    >
                      {day.dayName}
                    </Text>
                    <View
                      style={[
                        styles.weekDayCircle,
                        {
                          backgroundColor: day.hasActivity
                            ? day.metGoal
                              ? colors.primary
                              : colors.secondary
                            : isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.05)',
                          borderColor: day.isToday ? colors.primary : 'transparent',
                          borderWidth: day.isToday ? 2 : 0,
                        },
                      ]}
                    >
                      {day.hasActivity ? (
                        <Feather name="check" size={14} color="#FFFFFF" />
                      ) : (
                        <Text style={[styles.weekDayAyahs, { color: colors.textSecondary }]}>
                          ·
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Hadith Inspiration Quote */}
            <View
              style={[
                styles.hadithCard,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(13,107,78,0.06)' },
              ]}
            >
              <Text style={[styles.hadithQuote, { color: colors.text }]}>
                {t('home.streakHadith')}
              </Text>
              <Text style={[styles.hadithSource, { color: colors.primary }]}>
                {t('home.streakHadithSource')}
              </Text>
            </View>

            {/* Action button */}
            <AnimatedPressable
              onPress={handleGoToQuran}
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="book-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryActionBtnText}>{t('home.goToQuran')}</Text>
            </AnimatedPressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  cardCol: {
    flex: 1,
  },
  pressableCard: {
    flex: 1,
  },
  glassCard: {
    padding: 14,
    minHeight: 165,
    justifyContent: 'space-between',
  },
  cardHeader: {
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
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  streakWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardHighlight: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardSubtext: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  cardMotivation: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeButton: {
    padding: 6,
  },
  modalProgressSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  modalCountText: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 12,
  },
  modalSubstatus: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionBlock: {
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAddBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  presetBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 20,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Streak modal styles
  streakBigBanner: {
    alignItems: 'center',
    marginVertical: 12,
  },
  flameLarge: {
    fontSize: 48,
    marginBottom: 6,
  },
  streakBigNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  bestStreakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
  },
  bestStreakText: {
    fontSize: 13,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekDayCol: {
    alignItems: 'center',
    gap: 6,
  },
  weekDayName: {
    fontSize: 11,
  },
  weekDayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayAyahs: {
    fontSize: 14,
    fontWeight: '700',
  },
  hadithCard: {
    padding: 14,
    borderRadius: 16,
    marginTop: 16,
  },
  hadithQuote: {
    fontSize: 12.5,
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'center',
  },
  hadithSource: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
  resetTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 6,
  },
  resetTodayBtnText: {
    fontSize: 12,
  },
});

export default HomeStatsRow;
