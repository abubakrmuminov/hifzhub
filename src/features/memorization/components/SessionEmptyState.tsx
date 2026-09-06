import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components';

export interface SessionEmptyStateProps {
  onBack: () => void;
}

export const SessionEmptyState: React.FC<SessionEmptyStateProps> = ({ onBack }) => {
  const { isDark, colors, spacing, radius } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingHorizontal: spacing.md }]}>
        <AnimatedPressable
          onPress={onBack}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel={t('common.back', { defaultValue: 'Назад' })}
          style={[
            styles.backButton,
            {
              borderRadius: radius.full,
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </AnimatedPressable>
      </View>

      <View style={[styles.emptyContent, { padding: spacing.xl }]}>
        <View
          style={[
            styles.emptyIconWrap,
            {
              borderRadius: radius.full,
              backgroundColor: isDark
                ? 'rgba(13, 107, 78, 0.20)'
                : 'rgba(13, 107, 78, 0.10)',
            },
          ]}
        >
          <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text, marginTop: spacing.md }]}>
          {t('hifz.noCardsDue', { defaultValue: 'Нет карточек на повторение' })}
        </Text>
        <Text
          style={[
            styles.emptySub,
            { color: colors.textSecondary, marginTop: spacing.xs, marginHorizontal: spacing.md },
          ]}
        >
          {t('hifz.noCardsMessage', { defaultValue: 'Добавьте аяты для заучивания' })}
        </Text>

        <AnimatedPressable
          onPress={onBack}
          style={[
            styles.emptyBackButton,
            {
              borderRadius: radius.md,
              backgroundColor: colors.primary,
              marginTop: spacing.lg,
            },
          ]}
        >
          <Text style={styles.emptyBackText}>
            {t('common.back', { defaultValue: 'Назад' })}
          </Text>
        </AnimatedPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBackButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyBackText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
