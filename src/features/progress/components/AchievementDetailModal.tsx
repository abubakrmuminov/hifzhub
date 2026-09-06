import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  BackHandler,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { GlassView } from '@/shared/components/GlassView';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import type { Achievement } from '../types';

export interface AchievementDetailModalProps {
  achievement: Achievement | null;
  onClose: () => void;
}

function getRussianPlural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function getAchievementStatus(achievement: Achievement, isUz: boolean): string {
  if (achievement.isUnlocked) {
    if (achievement.unlockedAt) {
      const d = new Date(achievement.unlockedAt);
      if (isUz) {
        const monthsUz = [
          'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
          'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
        ];
        return `${d.getDate()}-${monthsUz[d.getMonth()]} ochilgan`;
      }
      const monthsRu = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
      ];
      return `Разблокировано ${d.getDate()} ${monthsRu[d.getMonth()]}`;
    }
    return isUz ? 'Ochilgan' : 'Разблокировано';
  }

  const target = achievement.condition.target;
  const current = Math.min(target, Math.round(achievement.progress * target));
  const remaining = Math.max(1, target - current);

  if (isUz) {
    switch (achievement.condition.type) {
      case 'ayahs_count':
      case 'surah_completed':
      case 'juz_completed':
        return `Yana ${remaining} ta oyat yodlash kerak`;
      case 'streak':
        return `Yana ${remaining} kun qoldi`;
      case 'lessons_count':
        return `Yana ${remaining} ta dars o'tish kerak`;
      case 'xp_total':
        return `Yana ${remaining} XP to'plash kerak`;
      default:
        return `Yana ${remaining} qadam qoldi`;
    }
  }

  switch (achievement.condition.type) {
    case 'ayahs_count':
    case 'surah_completed':
    case 'juz_completed':
      return `Осталось выучить ${remaining} ${getRussianPlural(remaining, 'аят', 'аята', 'аятов')}`;
    case 'streak':
      return `Осталось ${remaining} ${getRussianPlural(remaining, 'день', 'дня', 'дней')}`;
    case 'lessons_count':
      return `Осталось пройти ${remaining} ${getRussianPlural(remaining, 'урок', 'урока', 'уроков')}`;
    case 'xp_total':
      return `Осталось набрать ${remaining} XP`;
    default:
      return `Осталось ${remaining} шагов`;
  }
}

function getCategoryLabel(category: Achievement['category'], isUz: boolean): string {
  if (isUz) {
    switch (category) {
      case 'memorization':
        return 'Yodlash';
      case 'streak':
        return 'Ketma-ketlik';
      case 'lessons':
        return 'Darslar';
      case 'special':
        return 'Maxsus';
      default:
        return 'Yutuq';
    }
  }
  switch (category) {
    case 'memorization':
      return 'Заучивание';
    case 'streak':
      return 'Стрик';
    case 'lessons':
      return 'Уроки';
    case 'special':
      return 'Особое';
    default:
      return 'Достижение';
  }
}

export const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({
  achievement,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const isUz = i18n.language === 'uz';
  const insets = useSafeAreaInsets();
  const { colors, radius, isDark } = useTheme();

  const [activeItem, setActiveItem] = useState<Achievement | null>(achievement);
  const isClosingRef = useRef(false);

  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(600);

  // Sync incoming achievement changes
  useEffect(() => {
    if (achievement) {
      setActiveItem(achievement);
      isClosingRef.current = false;
      backdropOpacity.value = 0;
      sheetTranslateY.value = 600;

      // 0ms instant start: backdrop gently dims in place, sheet slides up
      backdropOpacity.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.quad),
      });
      sheetTranslateY.value = withTiming(0, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [achievement, backdropOpacity, sheetTranslateY]);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    backdropOpacity.value = withTiming(0, {
      duration: 180,
      easing: Easing.in(Easing.quad),
    });
    sheetTranslateY.value = withTiming(
      600,
      {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(onClose)();
        }
      }
    );
  }, [onClose, backdropOpacity, sheetTranslateY]);

  // Android hardware back button handler
  useEffect(() => {
    if (!achievement) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => subscription.remove();
  }, [achievement, handleClose]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  if (!achievement && !activeItem) {
    return null;
  }

  const current = activeItem ?? achievement!;
  const progressPercent = Math.min(100, Math.max(0, Math.round(current.progress * 100)));

  return (
    <View style={styles.container} pointerEvents={achievement ? 'auto' : 'none'}>
      {/* 1. Backdrop: dims the whole screen in place, never slides */}
      <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* 2. Bottom Sheet: slides up smoothly from bottom */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: isDark ? '#1C1C30' : '#FFFFFF',
            borderTopLeftRadius: radius.xl + 4,
            borderTopRightRadius: radius.xl + 4,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
            borderWidth: isDark ? 1 : 0,
          },
          sheetAnimatedStyle,
        ]}
      >
        {/* Drag handle pill */}
        <View
          style={[
            styles.sheetHandle,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
            },
          ]}
        />

        {/* Big Icon */}
        <View style={styles.iconWrapper}>
          <LinearGradient
            colors={
              current.isUnlocked
                ? ['rgba(212, 167, 69, 0.28)', 'rgba(13, 107, 78, 0.22)']
                : isDark
                ? ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']
                : ['rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.02)']
            }
            style={[
              styles.iconCircle,
              {
                borderColor: current.isUnlocked
                  ? colors.secondary
                  : isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <Ionicons
              name={current.icon as any}
              size={42}
              color={current.isUnlocked ? colors.secondary : colors.textTertiary}
            />
            {!current.isUnlocked && (
              <View
                style={[
                  styles.lockBadge,
                  {
                    backgroundColor: isDark ? '#121222' : '#FFFFFF',
                    borderColor: colors.textTertiary,
                  },
                ]}
              >
                <Ionicons name="lock-closed" size={12} color={colors.textTertiary} />
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Category Pill */}
        <View
          style={[
            styles.categoryBadge,
            {
              backgroundColor: isDark
                ? 'rgba(212, 167, 69, 0.14)'
                : 'rgba(212, 167, 69, 0.12)',
              borderColor: colors.secondary + '40',
            },
          ]}
        >
          <Text style={[styles.categoryText, { color: colors.secondary }]}>
            {getCategoryLabel(current.category, isUz)}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {isUz && current.titleUz ? current.titleUz : current.titleRu}
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {isUz && current.descriptionUz ? current.descriptionUz : current.descriptionRu}
        </Text>

        {/* Progress & Status Glass card */}
        <GlassView borderRadius={radius.md} style={styles.progressGlass}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <Ionicons
                name={current.isUnlocked ? 'checkmark-circle' : 'hourglass-outline'}
                size={18}
                color={current.isUnlocked ? colors.primary : colors.secondary}
              />
              <Text style={[styles.statusText, { color: colors.text }]}>
                {getAchievementStatus(current, isUz)}
              </Text>
            </View>
            <Text
              style={[
                styles.statusPercent,
                {
                  color: current.isUnlocked ? colors.primary : colors.secondary,
                },
              ]}
            >
              {progressPercent}%
            </Text>
          </View>

          {/* Progress bar track */}
          <View
            style={[
              styles.progressBarTrack,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: current.isUnlocked ? colors.primary : colors.secondary,
                },
              ]}
            />
          </View>
        </GlassView>

        {/* Close Button */}
        <AnimatedPressable
          onPress={handleClose}
          scaleValue={0.96}
          haptic="light"
          style={[
            styles.closeButton,
            {
              backgroundColor: colors.primary,
              borderRadius: radius.lg,
            },
          ]}
        >
          <Text style={styles.closeButtonText}>
            {t('progress.close', { defaultValue: isUz ? 'Yopish' : 'Закрыть' })}
          </Text>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
  },

  sheet: {
    paddingHorizontal: 22,
    paddingTop: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 18,
  },
  iconWrapper: {
    marginBottom: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  progressGlass: {
    width: '100%',
    padding: 14,
    marginBottom: 18,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  statusPercent: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  closeButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
