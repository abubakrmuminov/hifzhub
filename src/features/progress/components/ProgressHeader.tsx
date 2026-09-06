import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { GlassView } from '@/shared/components/GlassView';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useProgressStore } from '@/stores/progressStore';
import { useLessonStore } from '@/stores/lessonStore';
import { getLevelProgress } from '../data/userLevels';


export interface ProgressHeaderProps {
  totalXp?: number;
  streakDays?: number;
  bestStreakDays?: number;
  onPressLevel?: () => void;
  onPressStreak?: () => void;
}

const getPluralDays = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return 'дней';
  if (mod10 === 1) return 'день';
  if (mod10 >= 2 && mod10 <= 4) return 'дня';
  return 'дней';
};

const ProgressHeaderComponent: React.FC<ProgressHeaderProps> = ({
  totalXp: propXp,
  streakDays: propStreak,
  bestStreakDays: propBestStreak,
  onPressLevel,
  onPressStreak,
}) => {
  const { colors, spacing, radius, shadows, fontFamilies, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const isUz = i18n.language === 'uz';

  // Stores fallback
  const storeXp = useLessonStore((s) => s.totalXP);
  const currentStreak = useProgressStore((s) => s.currentStreak);
  const storeBestStreak = useProgressStore((s) => s.bestStreak);
  const getEffectiveStreak = useProgressStore((s) => s.getEffectiveStreak);
  const storeStreak = useMemo(
    () => (typeof getEffectiveStreak === 'function' ? getEffectiveStreak() : currentStreak),
    [getEffectiveStreak, currentStreak]
  );

  // If store XP is 0 on fresh install, fallback to 450 for demo / visual consistency if prop isn't passed
  const effectiveXp = propXp !== undefined ? propXp : (storeXp > 0 ? storeXp : 450);
  const effectiveStreak = propStreak !== undefined ? propStreak : Math.max(1, storeStreak);
  const effectiveBestStreak = propBestStreak !== undefined ? propBestStreak : Math.max(effectiveStreak, storeBestStreak);

  const levelInfo = getLevelProgress(effectiveXp);
  const { currentLevel, nextLevel, progress, remainingXp } = levelInfo;

  return (
    <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.outerContainer}>
      <GlassView borderRadius={radius.xl} style={styles.card}>
        {/* Top Row: Level Badge + Total XP */}
        <View style={styles.topRow}>
          {/* User Level Badge */}
          <AnimatedPressable
            disabled={!onPressLevel}
            onPress={onPressLevel}
            style={styles.levelBadgePressable}
            haptic="light"
          >
            <View style={styles.levelBadgeContent}>
              {/* Gold Arabic Level Crown Badge */}
              <LinearGradient
                colors={['rgba(212, 167, 69, 0.22)', 'rgba(212, 167, 69, 0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.arabicBadgePill,
                  {
                    borderColor: isDark ? 'rgba(212, 167, 69, 0.35)' : 'transparent',
                    borderWidth: isDark ? 1 : 0,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.arabicTitle,
                    {
                      fontFamily: fontFamilies.arabic,
                      color: colors.secondary,
                    },
                  ]}
                >
                  {currentLevel.titleArabic}
                </Text>
              </LinearGradient>

              <View style={styles.titleColumn}>
                <View style={styles.levelChip}>
                  <Text style={[styles.levelChipText, { color: colors.secondaryDark }]}>
                    {t('progress.level', { level: currentLevel.level, defaultValue: `Уровень ${currentLevel.level}` })}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[styles.russianTitle, { color: colors.text }]}
                >
                  «{isUz ? currentLevel.titleUz : currentLevel.titleRu}»
                </Text>
              </View>
            </View>
          </AnimatedPressable>

          {/* Total XP Pill with Gold Sparkles */}
          <View
            style={[
              styles.xpPill,
              {
                backgroundColor: isDark ? 'rgba(212, 167, 69, 0.15)' : 'rgba(212, 167, 69, 0.12)',
                borderColor: isDark ? 'rgba(212, 167, 69, 0.3)' : 'transparent',
                borderWidth: isDark ? 1 : 0,
              },
            ]}
          >
            <Ionicons name="sparkles" size={14} color={colors.secondary} style={styles.sparkleIcon} />
            <Text style={[styles.xpValue, { color: colors.secondaryDark }]}>
              {effectiveXp.toLocaleString(isUz ? 'uz-UZ' : 'ru-RU')}
            </Text>
            <Text style={[styles.xpUnit, { color: colors.secondary }]}>XP</Text>
          </View>
        </View>

        {/* Level Progress Bar Section */}
        <View style={styles.progressBarSection}>
          <View style={styles.progressLabelsRow}>
            <Text style={[styles.remainingXpText, { color: colors.textSecondary }]}>
              {nextLevel
                ? t('progress.remainingXpTo', {
                    xp: remainingXp,
                    title: isUz ? nextLevel.titleUz : nextLevel.titleRu,
                    defaultValue: `Ещё ${remainingXp} XP до уровня «${nextLevel.titleRu}»`,
                  })
                : t('progress.maxLevelReached', { defaultValue: 'Наивысший ранг достигнут!' })}
            </Text>
            <Text style={[styles.percentageText, { color: colors.primary }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>

          {/* Bar track */}
          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(13, 107, 78, 0.08)',
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                {
                  width: `${Math.max(5, Math.min(100, Math.round(progress * 100)))}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Streak Badge */}
        <View style={styles.streakWrapper}>
          <View
            style={[
              styles.streakBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 107, 53, 0.12)'
                  : 'rgba(255, 107, 53, 0.07)',
                borderColor: isDark
                  ? 'rgba(255, 107, 53, 0.35)'
                  : 'transparent',
                borderWidth: isDark ? 1 : 0,
              },
            ]}
          >
            <View style={styles.fireIconWrapper}>
              <MaterialCommunityIcons name="fire" size={20} color="#FF6B35" />
            </View>
            <View style={styles.streakTextCol}>
              <Text style={[styles.streakPrimaryText, { color: isDark ? '#FF9E79' : '#D94813' }]}>
                {isUz
                  ? `${effectiveStreak} kun ketma-ket`
                  : `${effectiveStreak} ${getPluralDays(effectiveStreak)} подряд`}
              </Text>
              <Text style={[styles.streakSecondaryText, { color: colors.textTertiary }]}>
                {isUz
                  ? `rekord: ${effectiveBestStreak} kun`
                  : `рекорд: ${effectiveBestStreak} ${getPluralDays(effectiveBestStreak)}`}
              </Text>
            </View>
          </View>
        </View>
      </GlassView>
    </Animated.View>
  );
};


export const ProgressHeader = React.memo(ProgressHeaderComponent);

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    padding: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  levelBadgePressable: {
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  levelBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  arabicBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 46,
    flexShrink: 0,
  },
  arabicTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  titleColumn: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  levelChip: {
    alignSelf: 'flex-start',
  },
  levelChipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  russianTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginTop: 1,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    flexShrink: 0,
  },
  sparkleIcon: {
    marginRight: 2,
  },
  xpValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  xpUnit: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarSection: {
    marginTop: 16,
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  remainingXpText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    paddingRight: 8,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  streakWrapper: {
    marginTop: 14,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 0,
  },
  fireIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  streakTextCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  streakPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  streakSecondaryText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
