import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { GlassView } from '@/shared/components/GlassView';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useProgressStore, type DayActivity, getTodayDateString } from '@/stores/progressStore';
import type { HeatmapDay } from '../types';

export interface ActivityTrackerProps {
  weeklyActivity?: DayActivity[];
  dailyTarget?: number;
  monthlyHistory?: Record<string, number>;
  onSelectDay?: (day: DayActivity | HeatmapDay) => void;
}

const BAR_MAX_HEIGHT = 86;

const ActivityTrackerComponent: React.FC<ActivityTrackerProps> = ({
  weeklyActivity: propWeekly,
  dailyTarget: propTarget,
  monthlyHistory: propHistory,
  onSelectDay,
}) => {
  const { colors, radius, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const isUz = i18n.language === 'uz';

  // Store Fallbacks
  const getLast7DaysActivity = useProgressStore((s) => s.getLast7DaysActivity);
  const storeTarget = useProgressStore((s) => s.dailyTarget);
  const storeHistory = useProgressStore((s) => s.dailyHistory);

  const storeWeekly = useMemo(
    () => (typeof getLast7DaysActivity === 'function' ? getLast7DaysActivity(i18n.language) : []),
    [getLast7DaysActivity, storeHistory, i18n.language]
  );


  const dailyTarget = propTarget ?? storeTarget;
  const dailyHistory = propHistory ?? storeHistory;

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Check if store has any recorded activity
  const hasRealActivity = useMemo(() => {
    return Object.values(dailyHistory).some((count) => count > 0);
  }, [dailyHistory]);

  // 1. 7-Day Activity data (with realistic baseline if user is on fresh install)
  const weeklyActivity: DayActivity[] = useMemo(() => {
    if (propWeekly) return propWeekly;
    if (hasRealActivity) return storeWeekly;

    // Demo realistic week values for initial delight
    const demoCounts = [12, 18, 8, 22, 15, 20, 14];
    return storeWeekly.map((day, idx) => {
      const count = demoCounts[idx % demoCounts.length];
      return {
        ...day,
        completedAyahs: count,
        hasActivity: count > 0,
        metGoal: count >= dailyTarget,
      };
    });
  }, [propWeekly, storeWeekly, hasRealActivity, dailyTarget]);

  // Max scale for bar chart height calculation
  const maxScale = useMemo(() => {
    const maxVal = Math.max(...weeklyActivity.map((d) => d.completedAyahs), dailyTarget);
    return Math.max(maxVal, 20);
  }, [weeklyActivity, dailyTarget]);

  const totalAyahsThisWeek = useMemo(() => {
    return weeklyActivity.reduce((sum, d) => sum + d.completedAyahs, 0);
  }, [weeklyActivity]);

  // 2. Generate 28-day heatmap data (4 full weeks, ending today)
  const heatmapDays: HeatmapDay[] = useMemo(() => {
    const days: HeatmapDay[] = [];
    const todayStr = getTodayDateString();
    const demoPattern = [
      0, 5, 8, 12, 15, 20, 14,
      0, 0, 7, 10, 12, 18, 22,
      5, 8, 0, 14, 16, 20, 25,
      10, 12, 15, 18, 20, 14, 16,
    ];

    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getTodayDateString(d);
      let count = dailyHistory[dateStr] ?? 0;
      if (!hasRealActivity) {
        count = demoPattern[27 - i] ?? 0;
      }
      days.push({
        date: dateStr,
        count,
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [dailyHistory, hasRealActivity]);

  // 4 Weeks matrix: 4 rows x 7 days
  const weeksMatrix = useMemo(() => {
    const matrix: HeatmapDay[][] = [];
    for (let i = 0; i < heatmapDays.length; i += 7) {
      matrix.push(heatmapDays.slice(i, i + 7));
    }
    return matrix;
  }, [heatmapDays]);

  // Selected Day info
  const selectedDayInfo = useMemo(() => {
    if (!selectedDate) return null;
    const fromWeekly = weeklyActivity.find((d) => d.date === selectedDate);
    if (fromWeekly) {
      return {
        date: fromWeekly.date,
        dayName: fromWeekly.dayName,
        count: fromWeekly.completedAyahs,
        metGoal: fromWeekly.metGoal,
        isToday: fromWeekly.isToday,
      };
    }
    const fromHeatmap = heatmapDays.find((d) => d.date === selectedDate);
    if (fromHeatmap) {
      return {
        date: fromHeatmap.date,
        dayName: '',
        count: fromHeatmap.count,
        metGoal: fromHeatmap.count >= dailyTarget,
        isToday: fromHeatmap.isToday,
      };
    }
    return null;
  }, [selectedDate, weeklyActivity, heatmapDays, dailyTarget]);

  // Activity intensity color mapping for heatmap
  const getIntensityColor = useCallback((count: number): string => {
    if (count <= 0) {
      return isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.05)';
    }
    if (count < 5) {
      return isDark ? '#164E3D' : '#A7E3D0';
    }
    if (count < 10) {
      return isDark ? '#1D8060' : '#4EBA97';
    }
    return isDark ? '#22C55E' : '#0D6B4E';
  }, [isDark]);

  // Target guideline position (from bottom of bar track)
  const targetLineBottom = useMemo(() => {
    return Math.round((dailyTarget / maxScale) * BAR_MAX_HEIGHT);
  }, [dailyTarget, maxScale]);

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.outerContainer}>
      <GlassView borderRadius={radius.xl} style={styles.card}>
        {/* Section Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitleWrap}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: isDark ? 'rgba(13, 107, 78, 0.25)' : 'rgba(13, 107, 78, 0.1)' },
              ]}
            >
              <Feather name="bar-chart-2" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('progress.activityTrackerTitle', { defaultValue: 'График активности' })}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {isUz ? `Kunlik maqsad: ${dailyTarget} oyat` : `Цель: ${dailyTarget} аятов в день`}
              </Text>
            </View>
          </View>

          {/* Weekly summary badge */}
          <View
            style={[
              styles.totalChip,
              {
                backgroundColor: isDark ? 'rgba(212, 167, 69, 0.15)' : 'rgba(212, 167, 69, 0.12)',
              },
            ]}
          >
            <Ionicons name="sparkles" size={13} color={colors.secondary} />
            <Text style={[styles.totalChipText, { color: colors.secondaryDark }]}>
              {totalAyahsThisWeek} {t('progress.ayahs', { defaultValue: 'аятов' })}
            </Text>
          </View>
        </View>

        {/* Selected Day Floating Feedback Card */}
        {selectedDayInfo && (
          <View
            style={[
              styles.selectedBanner,
              {
                backgroundColor: isDark ? 'rgba(13, 107, 78, 0.2)' : 'rgba(13, 107, 78, 0.08)',
              },
            ]}
          >
            <Ionicons
              name={selectedDayInfo.metGoal ? 'checkmark-circle' : 'time-outline'}
              size={16}
              color={selectedDayInfo.metGoal ? colors.primary : colors.secondary}
            />
            <Text style={[styles.selectedBannerText, { color: colors.text }]}>
              {selectedDayInfo.dayName ? `${selectedDayInfo.dayName}, ` : ''}
              {selectedDayInfo.date}:{' '}
              <Text style={{ fontWeight: '800', color: colors.primary }}>
                {selectedDayInfo.count} {t('progress.ayahs', { defaultValue: 'аятов' })}
              </Text>
              {selectedDayInfo.metGoal
                ? ` • ${t('progress.goalCompleted', { defaultValue: 'Цель выполнена! 🎉' })}`
                : ` ${t('progress.ofDailyTarget', { target: dailyTarget, defaultValue: `(из ${dailyTarget})` })}`}
            </Text>
          </View>
        )}

        {/* Chart Subheader / Target Legend */}
        <View style={styles.chartHeaderRow}>
          <View
            style={[
              styles.targetLegendPill,
              {
                backgroundColor: isDark
                  ? 'rgba(212, 167, 69, 0.14)'
                  : 'rgba(212, 167, 69, 0.10)',
              },
            ]}
          >
            <View style={[styles.targetLegendDashedIcon, { borderColor: colors.secondary }]} />
            <Text style={[styles.targetLegendText, { color: colors.secondaryDark }]}>
              {t('progress.targetAyahs', { count: dailyTarget, defaultValue: `Цель: ${dailyTarget} аятов` })}
            </Text>
          </View>
          <Text style={[styles.chartHintText, { color: colors.textTertiary }]}>
            {t('progress.clickBarHint', { defaultValue: 'Нажми на столбец' })}
          </Text>
        </View>


        {/* 1. VISUAL BAR CHART (7 Days) */}
        <View style={styles.chartContainer}>
          {/* Target Guideline across chart (clean dashed line without text collision) */}
          <View
            style={[
              styles.targetGuideline,
              {
                bottom: targetLineBottom + 30,
                borderColor: isDark ? 'rgba(212, 167, 69, 0.35)' : 'rgba(212, 167, 69, 0.45)',
              },
            ]}
          />

          {/* 7 Columns */}
          <View style={styles.barsRow}>
            {weeklyActivity.map((day) => {
              const isSelected = selectedDate === day.date;
              const hasActivity = day.completedAyahs > 0;
              const metGoal = day.metGoal;

              // Compute filled bar height
              const barHeight = hasActivity
                ? Math.max(12, Math.round((day.completedAyahs / maxScale) * BAR_MAX_HEIGHT))
                : 4;

              return (
                <AnimatedPressable
                  key={day.date}
                  scaleValue={0.92}
                  haptic="light"
                  onPress={() => {
                    setSelectedDate(selectedDate === day.date ? null : day.date);
                    onSelectDay?.(day);
                  }}
                  style={styles.barColumn}
                >
                  {/* Ayahs Count Number above bar */}
                  <View style={styles.countNumberWrap}>
                    {hasActivity ? (
                      <Text
                        style={[
                          styles.barCountText,
                          {
                            color: metGoal
                              ? colors.secondaryDark
                              : day.isToday
                              ? colors.primary
                              : colors.textSecondary,
                            fontWeight: day.isToday || metGoal ? '800' : '600',
                          },
                        ]}
                      >
                        {day.completedAyahs}
                      </Text>
                    ) : (
                      <Text style={[styles.barCountText, { color: colors.textTertiary, opacity: 0.5 }]}>
                        0
                      </Text>
                    )}
                  </View>

                  {/* Bar Pillar Track */}
                  <View
                    style={[
                      styles.barTrack,
                      {
                        height: BAR_MAX_HEIGHT,
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isSelected
                          ? colors.primary
                          : day.isToday
                          ? colors.secondary
                          : 'transparent',
                        borderWidth: isSelected || day.isToday ? 1.5 : 0,
                      },
                    ]}
                  >
                    {/* Filled Bar */}
                    <LinearGradient
                      colors={
                        metGoal
                          ? ['#F59E0B', '#D4A745']
                          : hasActivity
                          ? ['#34D399', colors.primary]
                          : [
                              isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                              isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                            ]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[
                        styles.barFill,
                        {
                          height: barHeight,
                        },
                      ]}
                    />
                  </View>

                  {/* Day Label underneath */}
                  <View
                    style={[
                      styles.dayLabelContainer,
                      day.isToday && {
                        backgroundColor: isDark ? 'rgba(13, 107, 78, 0.35)' : 'rgba(13, 107, 78, 0.12)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayLabelText,
                        {
                          color: day.isToday ? colors.primary : colors.textSecondary,
                          fontWeight: day.isToday ? '800' : '600',
                        },
                      ]}
                    >
                      {day.dayName}
                    </Text>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        {/* Divider */}
        <View
          style={[
            styles.divider,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          ]}
        />

        {/* 2. 4-WEEK HEATMAP MATRIX (28 Days) */}
        <View style={styles.matrixSection}>
          <View style={styles.matrixHeaderRow}>
            <Text style={[styles.matrixTitle, { color: colors.textSecondary }]}>
              {isUz ? '4 haftalik tarix (28 kun)' : 'История за 4 недели (28 дней)'}
            </Text>
            <Text style={[styles.matrixHint, { color: colors.textTertiary }]}>
              {isUz ? 'Kunni bosing' : 'Нажми на день'}
            </Text>
          </View>

          {/* Matrix Weekday column headers */}
          <View style={styles.matrixWeekdaysRow}>
            {(isUz ? ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'] : ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']).map((dayShort, idx) => (
              <Text key={idx} style={[styles.matrixWeekdayLabel, { color: colors.textTertiary }]}>
                {dayShort}
              </Text>
            ))}
          </View>

          {/* 4 Rows of 7 Cells */}
          <View style={styles.matrixGrid}>
            {weeksMatrix.map((week, wIdx) => (
              <View key={wIdx} style={styles.matrixRow}>
                {week.map((day) => {
                  const bg = getIntensityColor(day.count);
                  const isSelected = selectedDate === day.date;

                  return (
                    <AnimatedPressable
                      key={day.date}
                      scaleValue={0.88}
                      haptic="light"
                      onPress={() => {
                        setSelectedDate(selectedDate === day.date ? null : day.date);
                        onSelectDay?.(day);
                      }}
                      style={[
                        styles.matrixCell,
                        {
                          backgroundColor: bg,
                          borderColor: day.isToday
                            ? colors.secondary
                            : isSelected
                            ? colors.primary
                            : 'transparent',
                          borderWidth: day.isToday || isSelected ? 1.5 : 0,
                        },
                      ]}
                    >
                      <View style={styles.matrixCellInner} />
                    </AnimatedPressable>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Heatmap Legend */}
          <View style={styles.legendRow}>
            <Text style={[styles.legendText, { color: colors.textTertiary }]}>
              {t('progress.heatmapLess', { defaultValue: 'Меньше' })}
            </Text>
            <View style={[styles.legendBox, { backgroundColor: getIntensityColor(0) }]} />
            <View style={[styles.legendBox, { backgroundColor: getIntensityColor(3) }]} />
            <View style={[styles.legendBox, { backgroundColor: getIntensityColor(7) }]} />
            <View style={[styles.legendBox, { backgroundColor: getIntensityColor(15) }]} />
            <Text style={[styles.legendText, { color: colors.textTertiary }]}>
              {t('progress.heatmapMore', { defaultValue: 'Больше (10+)' })}
            </Text>
          </View>

        </View>
      </GlassView>
    </Animated.View>
  );
};

export const ActivityTracker = React.memo(ActivityTrackerComponent);

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
    marginBottom: 14,
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
  totalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  totalChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
  },
  selectedBannerText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  targetLegendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 7,
  },
  targetLegendDashedIcon: {
    width: 16,
    height: 0,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
  },
  targetLegendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chartHintText: {
    fontSize: 11,
  },
  chartContainer: {
    position: 'relative',
    paddingTop: 2,
    paddingBottom: 4,
  },
  targetGuideline: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
    zIndex: 1,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: BAR_MAX_HEIGHT + 48,
    zIndex: 2,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  countNumberWrap: {
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  barCountText: {
    fontSize: 11,
  },
  barTrack: {
    width: 22,
    borderRadius: 11,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '100%',
    borderRadius: 11,
  },
  dayLabelContainer: {
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 28,
    alignItems: 'center',
  },
  dayLabelText: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  matrixSection: {},
  matrixHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  matrixTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  matrixHint: {
    fontSize: 11,
  },
  matrixWeekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  matrixWeekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
  },
  matrixGrid: {
    gap: 5,
  },
  matrixRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  matrixCell: {
    flex: 1,
    height: 30,
    minHeight: 28,
    maxWidth: 38,
    borderRadius: 7,
    marginHorizontal: 2,
    overflow: 'hidden',
  },
  matrixCellInner: {
    width: '100%',
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 12,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
