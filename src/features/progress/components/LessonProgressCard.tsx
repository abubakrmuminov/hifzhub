import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { GlassView } from '@/shared/components/GlassView';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useLessonStore } from '@/stores/lessonStore';
import type { LessonProgressCardProps } from '../types';

interface ModuleConfig {
  id: number;
  titleRu: string;
  titleUz: string;
  subtitleRu: string;
  subtitleUz: string;
  totalLessons: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const MODULES_CONFIG: ModuleConfig[] = [
  {
    id: 1,
    titleRu: 'Арабский алфавит и махраджи',
    titleUz: 'Arab alifbosi va maxrajlar',
    subtitleRu: '28 букв, звучание и правильное произношение',
    subtitleUz: '28 ta harf, tovushlar va to‘g‘ri talaffuz',
    totalLessons: 16,
    icon: 'text-outline',
    color: '#0D6B4E',
  },
  {
    id: 2,
    titleRu: 'Харакаты и слитное письмо',
    titleUz: 'Harakatlar va harflarni ulash',
    subtitleRu: 'Огласовки, сукун, шадда, танвин и соединение',
    subtitleUz: 'Harakatlar, sukun, shadda, tanvin va ulanish',
    totalLessons: 17,
    icon: 'create-outline',
    color: '#D4A745',
  },
  {
    id: 3,
    titleRu: 'Мадды — удлинение звуков',
    titleUz: 'Maddlar — cho‘ziq tovushlar',
    subtitleRu: 'Правила удлинений: таби‘и, муттасыль, лязим',
    subtitleUz: 'Cho‘zish qoidalari: tabiiy, muttasil, lozim',
    totalLessons: 12,
    icon: 'musical-notes-outline',
    color: '#4A90D9',
  },
  {
    id: 4,
    titleRu: 'Полный курс Таджвида',
    titleUz: 'To‘liq Tajvid kursi',
    subtitleRu: 'Нун сакина, мим сакина, калькаля, правила буквы ра',
    subtitleUz: 'Nun sokina, mim sokina, qalqala, ro qoidalari',
    totalLessons: 22,
    icon: 'school-outline',
    color: '#9B59B6',
  },
  {
    id: 5,
    titleRu: 'Практика на сурах',
    titleUz: 'Suralar ustida amaliyot',
    subtitleRu: 'Аль-Фатиха, Ихлас, Фаляк, Нас и другие суры',
    subtitleUz: 'Fotiha, Ixlos, Falaq, Nos va boshqa suralar',
    totalLessons: 11,
    icon: 'book-outline',
    color: '#E74C3C',
  },
];

export const LessonProgressCard: React.FC<LessonProgressCardProps> = ({
  onContinueLearning,
}) => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isUz = i18n.language === 'uz';
  const { colors, spacing, radius, shadows, isDark } = useTheme();

  // Lesson store data
  const completedLessons = useLessonStore((s) => s.completedLessons);
  const totalXP = useLessonStore((s) => s.totalXP);
  const unlockedModules = useLessonStore((s) => s.unlockedModules);

  // Compute modules progress
  const { modules, totalCompleted, totalCourseLessons, overallPercentage } = useMemo(() => {
    let completedCountAll = 0;
    let totalCountAll = 0;

    const moduleList = MODULES_CONFIG.map((mod) => {
      const completedCount = Object.values(completedLessons).filter(
        (l) => l.moduleId === mod.id && l.passed
      ).length;

      const isUnlocked = mod.id === 1 || unlockedModules.includes(mod.id);
      const isFinished = completedCount >= mod.totalLessons;
      const percentage =
        mod.totalLessons > 0
          ? Math.min(100, Math.round((completedCount / mod.totalLessons) * 100))
          : 0;

      completedCountAll += completedCount;
      totalCountAll += mod.totalLessons;

      return {
        ...mod,
        completedCount,
        isUnlocked,
        isFinished,
        percentage,
      };
    });

    const overall =
      totalCountAll > 0
        ? Math.min(100, Math.round((completedCountAll / totalCountAll) * 100))
        : 0;

    return {
      modules: moduleList,
      totalCompleted: completedCountAll,
      totalCourseLessons: totalCountAll,
      overallPercentage: overall,
    };
  }, [completedLessons, unlockedModules]);

  const handleNavigateToLearn = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onContinueLearning) {
      onContinueLearning();
    } else {
      router.push('/(tabs)/learn');
    }
  }, [onContinueLearning, router]);

  const handleModulePress = useCallback(
    (moduleId: number, isUnlocked: boolean) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (isUnlocked) {
        router.push({
          pathname: '/module/[moduleId]',
          params: { moduleId: String(moduleId) },
        });
      } else {
        router.push('/(tabs)/learn');
      }
    },
    [router]
  );

  return (
    <Animated.View
      entering={FadeInDown.duration(600).delay(150).springify()}
      style={styles.outerContainer}
    >
      <GlassView borderRadius={radius.xl} style={styles.glassCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.titleWithIcon}>
            <View
              style={[
                styles.headerIconCircle,
                {
                  backgroundColor: isDark
                    ? 'rgba(13, 107, 78, 0.25)'
                    : 'rgba(13, 107, 78, 0.12)',
                },
              ]}
            >
              <MaterialCommunityIcons
                name="school"
                size={18}
                color={colors.primary}
              />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t('progress.lessonsCardTitle', {
                  defaultValue: isUz
                    ? "Qur'on o'qish va Tajvid kursi"
                    : 'Курс чтения и Таджвида',
                })}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {t('progress.lessonsCardSub', {
                  defaultValue: isUz
                    ? '5 ta modul • Alifbodan suralargacha'
                    : '5 модулей • Алфавит до сур',
                })}
              </Text>
            </View>
          </View>

          {/* XP Pill */}
          <View
            style={[
              styles.xpPill,
              {
                backgroundColor: isDark
                  ? 'rgba(212, 167, 69, 0.16)'
                  : 'rgba(212, 167, 69, 0.14)',
                borderColor: colors.secondary + '40',
              },
            ]}
          >
            <Ionicons name="flash" size={13} color={colors.secondary} />
            <Text style={[styles.xpText, { color: colors.secondary }]}>
              {totalXP} XP
            </Text>
          </View>
        </View>

        {/* Overall Progress Section */}
        <View style={styles.overallSection}>
          <View style={styles.overallTopRow}>
            <Text style={[styles.overallLabel, { color: colors.textSecondary }]}>
              {t('progress.courseProgress', {
                defaultValue: isUz ? 'Kursning umumiy rivojlanishi' : 'Общий прогресс курса',
              })}
            </Text>
            <Text style={[styles.overallPercentage, { color: colors.primary }]}>
              {overallPercentage}%
            </Text>
          </View>

          <View
            style={[
              styles.overallTrack,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.overallFill,
                { width: `${Math.max(3, overallPercentage)}%` },
              ]}
            />
          </View>

          <View style={styles.overallMetaRow}>
            <Text style={[styles.overallMetaText, { color: colors.textTertiary }]}>
              {t('progress.completedLessonsOf', {
                completed: totalCompleted,
                total: totalCourseLessons,
                defaultValue: isUz
                  ? `${totalCourseLessons} darsdan ${totalCompleted} tasi o'tildi`
                  : `${totalCompleted} из ${totalCourseLessons} уроков завершено`,
              })}
            </Text>
            <Text style={[styles.overallMetaText, { color: colors.textTertiary }]}>
              {t('progress.modulesCompletedOf', {
                completed: modules.filter((m) => m.isFinished).length,
                total: 5,
                defaultValue: isUz
                  ? `5 moduldan ${modules.filter((m) => m.isFinished).length} tasi yakunlandi`
                  : `${modules.filter((m) => m.isFinished).length} из 5 модулей пройдено`,
              })}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View
          style={[
            styles.divider,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        />

        {/* 5 Modules List */}
        <View style={styles.modulesContainer}>
          {modules.map((mod, index) => {
            return (
              <AnimatedPressable
                key={mod.id}
                onPress={() => handleModulePress(mod.id, mod.isUnlocked)}
                scaleValue={0.98}
                haptic="light"
                style={[
                  styles.moduleRow,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(255, 255, 255, 0.65)',
                    borderColor: mod.isFinished
                      ? colors.primary + '50'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                    opacity: mod.isUnlocked ? 1 : 0.65,
                  },
                ]}
              >
                {/* Module Icon Container */}
                <View
                  style={[
                    styles.moduleIconBox,
                    {
                      backgroundColor: mod.color + '18',
                      borderColor: mod.color + '35',
                    },
                  ]}
                >
                  <Ionicons
                    name={mod.icon}
                    size={20}
                    color={mod.isUnlocked ? mod.color : colors.textTertiary}
                  />
                </View>

                {/* Module Details & Progress */}
                <View style={styles.moduleContent}>
                  <View style={styles.moduleTitleRow}>
                    <Text
                      style={[
                        styles.moduleTitleText,
                        { color: colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {`${index + 1}. ${isUz ? mod.titleUz : mod.titleRu}`}
                    </Text>

                    {mod.isFinished ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={colors.primary}
                      />
                    ) : !mod.isUnlocked ? (
                      <Ionicons
                        name="lock-closed"
                        size={14}
                        color={colors.textTertiary}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.modulePercentBadge,
                          { color: mod.color },
                        ]}
                      >
                        {mod.percentage}%
                      </Text>
                    )}
                  </View>

                  {/* Module Mini Progress Bar */}
                  <View
                    style={[
                      styles.moduleTrack,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.moduleFill,
                        {
                          width: `${mod.percentage}%`,
                          backgroundColor: mod.color,
                        },
                      ]}
                    />
                  </View>

                  {/* Completed / Total Count */}
                  <View style={styles.moduleFooterRow}>
                    <Text
                      style={[
                        styles.moduleLessonsCount,
                        { color: colors.textTertiary },
                      ]}
                    >
                      {isUz
                        ? `${mod.completedCount}/${mod.totalLessons} dars`
                        : `${mod.completedCount}/${mod.totalLessons} уроков`}
                    </Text>
                    <Text
                      style={[
                        styles.moduleSubtitle,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {isUz ? mod.subtitleUz : mod.subtitleRu}
                    </Text>
                  </View>
                </View>
              </AnimatedPressable>
            );
          })}
        </View>

        {/* Continue Learning CTA Button */}
        <AnimatedPressable
          onPress={handleNavigateToLearn}
          scaleValue={0.97}
          haptic="medium"
          style={[
            styles.continueButton,
            {
              backgroundColor: colors.primary,
              borderRadius: radius.md,
            },
          ]}
        >
          <Feather name="play-circle" size={18} color="#FFFFFF" style={styles.ctaIcon} />
          <Text style={styles.continueButtonText}>
            {t('progress.continueLearning', {
              defaultValue: isUz ? "O'qishni davom ettirish" : 'Продолжить обучение',
            })}
          </Text>
          <Feather name="arrow-right" size={16} color="#FFFFFF" style={styles.ctaArrow} />
        </AnimatedPressable>
      </GlassView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  glassCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Overall Progress
  overallSection: {
    marginBottom: 14,
  },
  overallTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  overallLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  overallPercentage: {
    fontSize: 16,
    fontWeight: '800',
  },
  overallTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  overallFill: {
    height: '100%',
    borderRadius: 4,
  },
  overallMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overallMetaText: {
    fontSize: 11,
    fontWeight: '500',
  },

  divider: {
    height: 1,
    width: '100%',
    marginVertical: 12,
  },

  // Modules List
  modulesContainer: {
    gap: 8,
    marginBottom: 16,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  moduleIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  moduleTitleText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  modulePercentBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  moduleTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  moduleFill: {
    height: '100%',
    borderRadius: 2,
  },
  moduleFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleLessonsCount: {
    fontSize: 11,
    fontWeight: '600',
    marginRight: 8,
  },
  moduleSubtitle: {
    fontSize: 10,
    flex: 1,
    textAlign: 'right',
  },

  // CTA Button
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#0D6B4E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  ctaIcon: {
    marginRight: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  ctaArrow: {
    marginLeft: 8,
  },
});
