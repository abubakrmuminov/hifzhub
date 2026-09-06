import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { GlassView, AnimatedPressable } from '@/shared/components';

export interface DailyHifzCardProps {
  dueCount: number;
  newCount: number;
  reviewedToday: number;
  totalMemorized: number;
  onStartSabaq: () => void;
  onStartReview: () => void;
}

export const DailyHifzCard: React.FC<DailyHifzCardProps> = ({
  dueCount,
  newCount,
  reviewedToday,
  totalMemorized,
  onStartSabaq,
  onStartReview,
}) => {
  const { colors, spacing, radius, isDark } = useTheme();
  const { t } = useTranslation();

  const isSabaqDisabled = newCount === 0;
  const isReviewDisabled = dueCount === 0;

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.cardOuter}>
      <GlassView borderRadius={radius.lg} style={styles.glassContainer}>
        <View style={[styles.content, { padding: spacing.md }]}>
          {/* Header: "Сегодня" with flame icon */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <View
                style={[
                  styles.flameIconContainer,
                  {
                    borderRadius: radius.full,
                    backgroundColor: isDark
                      ? 'rgba(212, 167, 69, 0.15)'
                      : 'rgba(212, 167, 69, 0.12)',
                  },
                ]}
              >
                <Ionicons name="flame" size={20} color={colors.secondary} />
              </View>
              <Text style={[styles.headerTitle, { color: colors.text, marginStart: spacing.xs }]}>
                {t('hifz.today', { defaultValue: 'Сегодня' })}
              </Text>
            </View>
          </View>

          {/* Stats row: 3 mini stat items */}
          <View style={[styles.statsRow, { marginVertical: spacing.md }]}>
            {/* Due for review */}
            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIconBadge,
                  {
                    borderRadius: radius.full,
                    backgroundColor: isDark
                      ? 'rgba(243, 156, 18, 0.16)'
                      : 'rgba(243, 156, 18, 0.10)',
                  },
                ]}
              >
                <Ionicons
                  name="hourglass-outline"
                  size={16}
                  color={colors.warning}
                />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {dueCount}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.statLabel, { color: colors.textSecondary }]}
              >
                {t('hifz.dueCount', { defaultValue: 'На повторение' })}
              </Text>
            </View>

            {/* New ayahs */}
            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIconBadge,
                  {
                    borderRadius: radius.full,
                    backgroundColor: isDark
                      ? 'rgba(13, 107, 78, 0.16)'
                      : 'rgba(13, 107, 78, 0.10)',
                  },
                ]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={16}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {newCount}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.statLabel, { color: colors.textSecondary }]}
              >
                {t('hifz.newCount', { defaultValue: 'Новые' })}
              </Text>
            </View>

            {/* Total memorized */}
            <View style={styles.statItem}>
              <View
                style={[
                  styles.statIconBadge,
                  {
                    borderRadius: radius.full,
                    backgroundColor: isDark
                      ? 'rgba(212, 167, 69, 0.16)'
                      : 'rgba(212, 167, 69, 0.10)',
                  },
                ]}
              >
                <Ionicons
                  name="school-outline"
                  size={16}
                  color={colors.secondary}
                />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {totalMemorized}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.statLabel, { color: colors.textSecondary }]}
              >
                {t('hifz.totalMemorized', { defaultValue: 'Выучено' })}
              </Text>
            </View>
          </View>

          {/* Divider line */}
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

          {/* Two action buttons */}
          <View style={[styles.buttonRow, { marginTop: spacing.md }]}>
            <AnimatedPressable
              onPress={onStartSabaq}
              disabled={isSabaqDisabled}
              haptic="medium"
              accessibilityRole="button"
              accessibilityLabel={t('hifz.startSabaq', {
                defaultValue: 'Учить новое',
              })}
              style={[
                styles.actionButton,
                {
                  borderRadius: radius.md,
                  backgroundColor: colors.primary,
                  opacity: isSabaqDisabled ? 0.45 : 1,
                  marginEnd: spacing.xs,
                },
              ]}
            >
              <Ionicons
                name="book-outline"
                size={18}
                color="#FFFFFF"
                style={styles.btnIcon}
              />
              <Text
                numberOfLines={1}
                style={[styles.buttonText, styles.primaryButtonText]}
              >
                {t('hifz.startSabaq', { defaultValue: 'Учить новое' })}
              </Text>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={onStartReview}
              disabled={isReviewDisabled}
              haptic="medium"
              accessibilityRole="button"
              accessibilityLabel={t('hifz.startReview', {
                defaultValue: 'Повторение',
              })}
              style={[
                styles.actionButton,
                {
                  borderRadius: radius.md,
                  backgroundColor: colors.secondary,
                  opacity: isReviewDisabled ? 0.45 : 1,
                  marginStart: spacing.xs,
                },
              ]}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color="#FFFFFF"
                style={styles.btnIcon}
              />
              <Text
                numberOfLines={1}
                style={[styles.buttonText, styles.secondaryButtonText]}
              >
                {t('hifz.startReview', { defaultValue: 'Повторение' })}
              </Text>
            </AnimatedPressable>
          </View>

          {/* Small footer text: "Повторено сегодня: {reviewedToday}" */}
          <View style={[styles.footerRow, { marginTop: spacing.sm }]}>
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>
              {t('hifz.reviewedToday', {
                defaultValue: `Повторено сегодня: ${reviewedToday}`,
                count: reviewedToday,
              })}
            </Text>
          </View>
        </View>
      </GlassView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    width: '100%',
  },
  glassContainer: {
    width: '100%',
  },
  content: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flameIconContainer: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statIconBadge: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  btnIcon: {
    marginEnd: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
  },
  footerRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
