import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { GlassView } from '@/shared/components/GlassView';
import { ProgressRing } from '@/shared/components/ProgressRing';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useMemorizationStore } from '@/stores/memorizationStore';
import { TOTAL_QURAN_VERSES } from '../data/juzData';
import type { MemorizationStats } from '../types';

export interface MemorizationStatsCardProps {
  stats?: MemorizationStats;
  onPressLearnMore?: () => void;
  onPressStage?: (stage: 'sabaq' | 'sabqi' | 'manzil') => void;
}

export const MemorizationStatsCard: React.FC<MemorizationStatsCardProps> = ({
  stats: propStats,
  onPressLearnMore,
  onPressStage,
}) => {
  const { colors, spacing, radius, shadows, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const isUz = i18n.language === 'uz';


  // Store Fallbacks
  const storeCards = useMemorizationStore((s) => s.cards);
  const getSabaqCards = useMemorizationStore((s) => s.getSabaqCards);
  const getSabqiCards = useMemorizationStore((s) => s.getSabqiCards);
  const getManzilCards = useMemorizationStore((s) => s.getManzilCards);
  const getTotalMemorized = useMemorizationStore((s) => s.getTotalMemorized);

  const stats: MemorizationStats = useMemo(() => {
    if (propStats) return propStats;

    const cardsCount = Object.keys(storeCards).length;
    if (cardsCount > 0) {
      const sabaq = getSabaqCards().length;
      const sabqi = getSabqiCards().length;
      const manzil = getManzilCards().length;
      const total = getTotalMemorized() || sabaq + sabqi + manzil;
      return {
        totalVerses: TOTAL_QURAN_VERSES,
        memorizedVerses: total,
        percentage: Number(((total / TOTAL_QURAN_VERSES) * 100).toFixed(1)),
        sabaqCount: sabaq,
        sabqiCount: sabqi,
        manzilCount: manzil,
      };
    }

    // Default demonstration stats (75 / 6236 = 1.2% matching spec)
    return {
      totalVerses: TOTAL_QURAN_VERSES,
      memorizedVerses: 75,
      percentage: 1.2,
      sabaqCount: 12,
      sabqiCount: 28,
      manzilCount: 35,
    };
  }, [propStats, storeCards, getSabaqCards, getSabqiCards, getManzilCards, getTotalMemorized]);

  const progressFraction = Math.min(1, Math.max(0, stats.memorizedVerses / stats.totalVerses));
  const percentageDisplay = `${stats.percentage.toFixed(1)}%`;

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} style={styles.outerContainer}>
      <GlassView borderRadius={radius.xl} style={styles.card}>
        {/* Section Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitleWrap}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: isDark ? 'rgba(212, 167, 69, 0.2)' : 'rgba(212, 167, 69, 0.12)' },
              ]}
            >
              <MaterialCommunityIcons name="book-open-page-variant" size={18} color={colors.secondary} />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('progress.hifzTitle', { defaultValue: 'Заучивание Корана (Хифз)' })}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {t('progress.hifzSubtitle', { defaultValue: 'Система интервальных повторений FSRS' })}
              </Text>
            </View>
          </View>

          {onPressLearnMore && (
            <AnimatedPressable onPress={onPressLearnMore} haptic="light" scaleValue={0.92}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textTertiary} />
            </AnimatedPressable>
          )}
        </View>

        {/* Centerpiece: Large Progress Ring + Total Verses Count */}
        <View style={styles.progressHeroRow}>
          <View style={styles.ringWrapper}>
            <ProgressRing
              progress={progressFraction}
              size={116}
              strokeWidth={10}
              color={colors.primary}
              backgroundColor={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(13, 107, 78, 0.08)'}
              centerText={percentageDisplay}
              centerSubtext={isUz ? 'yodlangan' : 'выучено'}
              textColor={colors.text}
            />
          </View>

          <View style={styles.heroDetailsCol}>
            <View style={styles.versesBadge}>
              <Text style={[styles.versesBigCount, { color: colors.primary }]}>
                {stats.memorizedVerses.toLocaleString(isUz ? 'uz-UZ' : 'ru-RU')}
              </Text>
              <Text style={[styles.versesDivider, { color: colors.textTertiary }]}>/</Text>
              <Text style={[styles.versesTotalCount, { color: colors.textSecondary }]}>
                {stats.totalVerses.toLocaleString(isUz ? 'uz-UZ' : 'ru-RU')}
              </Text>
            </View>
            <Text style={[styles.versesLabel, { color: colors.textSecondary }]}>
              {isUz ? "Muqaddas Qur'on oyatlari" : 'аятов Священного Корана'}
            </Text>

            {/* Micro Progress Bar */}
            <View style={styles.miniTrack}>
              <View
                style={[
                  styles.miniTrackFill,
                  {
                    width: `${Math.max(4, Math.min(100, stats.percentage))}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>

            <Text style={[styles.versesRemainingText, { color: colors.textTertiary }]}>
              {isUz
                ? `Yana yodlash kerak: ${(stats.totalVerses - stats.memorizedVerses).toLocaleString('uz-UZ')}`
                : `Осталось выучить: ${(stats.totalVerses - stats.memorizedVerses).toLocaleString('ru-RU')}`}
            </Text>
          </View>
        </View>

        {/* 3 FSRS Memory Stages Pills */}
        <View style={styles.stagesRow}>
          {/* Sabaq (Новое) */}
          <AnimatedPressable
            scaleValue={0.95}
            haptic="light"
            onPress={() => onPressStage?.('sabaq')}
            style={styles.stagePillPressable}
          >
            <View
              style={[
                styles.stagePill,
                {
                  backgroundColor: isDark ? 'rgba(13, 107, 78, 0.2)' : 'rgba(13, 107, 78, 0.08)',
                  borderColor: isDark ? 'rgba(13, 107, 78, 0.4)' : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
            >
              <View style={styles.stageTitleRow}>
                <View style={[styles.stageDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.stageName, { color: isDark ? '#34D399' : '#0D6B4E' }]}>
                  {t('progress.sabaqTitle', { defaultValue: 'Сабак' })}
                </Text>
              </View>
              <Text style={[styles.stageSubtitle, { color: colors.textSecondary }]}>
                {t('progress.sabaqSub', { defaultValue: 'Новое' })}
              </Text>
              <Text style={[styles.stageCount, { color: colors.text }]}>
                {stats.sabaqCount}
              </Text>
            </View>
          </AnimatedPressable>

          {/* Sabqi (Закрепление) */}
          <AnimatedPressable
            scaleValue={0.95}
            haptic="light"
            onPress={() => onPressStage?.('sabqi')}
            style={styles.stagePillPressable}
          >
            <View
              style={[
                styles.stagePill,
                {
                  backgroundColor: isDark ? 'rgba(230, 126, 34, 0.18)' : 'rgba(230, 126, 34, 0.08)',
                  borderColor: isDark ? 'rgba(230, 126, 34, 0.35)' : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
            >
              <View style={styles.stageTitleRow}>
                <View style={[styles.stageDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={[styles.stageName, { color: isDark ? '#FBBF24' : '#D97706' }]}>
                  {t('progress.sabqiTitle', { defaultValue: 'Сабки' })}
                </Text>
              </View>
              <Text style={[styles.stageSubtitle, { color: colors.textSecondary }]}>
                {t('progress.sabqiSub', { defaultValue: 'Повтор' })}
              </Text>
              <Text style={[styles.stageCount, { color: colors.text }]}>
                {stats.sabqiCount}
              </Text>
            </View>
          </AnimatedPressable>

          {/* Manzil (Выучено) */}
          <AnimatedPressable
            scaleValue={0.95}
            haptic="light"
            onPress={() => onPressStage?.('manzil')}
            style={styles.stagePillPressable}
          >
            <View
              style={[
                styles.stagePill,
                {
                  backgroundColor: isDark ? 'rgba(212, 167, 69, 0.18)' : 'rgba(212, 167, 69, 0.1)',
                  borderColor: isDark ? 'rgba(212, 167, 69, 0.35)' : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
            >
              <View style={styles.stageTitleRow}>
                <View style={[styles.stageDot, { backgroundColor: colors.secondary }]} />
                <Text style={[styles.stageName, { color: colors.secondaryDark }]}>
                  {t('progress.manzilTitle', { defaultValue: 'Манзиль' })}
                </Text>
              </View>
              <Text style={[styles.stageSubtitle, { color: colors.textSecondary }]}>
                {t('progress.manzilSub', { defaultValue: 'Выучено' })}
              </Text>
              <Text style={[styles.stageCount, { color: colors.text }]}>
                {stats.manzilCount}
              </Text>
            </View>
          </AnimatedPressable>
        </View>

        {/* Motivational Banner */}
        <View style={styles.bannerWrapper}>
          <LinearGradient
            colors={
              isDark
                ? ['rgba(13, 107, 78, 0.3)', 'rgba(212, 167, 69, 0.15)']
                : ['rgba(13, 107, 78, 0.08)', 'rgba(212, 167, 69, 0.1)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.bannerContent,
              {
                borderColor: isDark ? 'rgba(212, 167, 69, 0.3)' : 'rgba(212, 167, 69, 0.2)',
                borderWidth: 1,
              },
            ]}
          >
            <View style={styles.bannerIconBox}>
              <Ionicons name="sparkles" size={16} color={colors.secondary} />
            </View>
            <Text style={[styles.bannerText, { color: colors.text }]}>
              {isUz ? 'Siz Hofizlik maqomi sari to‘g‘ri yo‘ldasiz!' : 'Ты на верном пути к статусу Хафиза!'}
            </Text>
          </LinearGradient>
        </View>

      </GlassView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  progressHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 4,
  },
  ringWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroDetailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  versesBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  versesBigCount: {
    fontSize: 24,
    fontWeight: '800',
  },
  versesDivider: {
    fontSize: 18,
    fontWeight: '500',
  },
  versesTotalCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  versesLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  miniTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 6,
  },
  miniTrackFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  versesRemainingText: {
    fontSize: 11,
    fontWeight: '500',
  },
  stagesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  stagePillPressable: {
    flex: 1,
  },
  stagePill: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
  },
  stageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stageDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  stageName: {
    fontSize: 12,
    fontWeight: '700',
  },
  stageSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  stageCount: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  bannerWrapper: {
    marginTop: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 10,
  },
  bannerIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(212, 167, 69, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
