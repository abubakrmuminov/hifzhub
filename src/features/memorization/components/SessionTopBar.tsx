import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components';

export interface SessionTopBarProps {
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
  categoryTitle: string;
}

export const SessionTopBar: React.FC<SessionTopBarProps> = ({
  onBack,
  currentStep,
  totalSteps,
  categoryTitle,
}) => {
  const { isDark, colors, spacing, radius } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.topBar, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
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

      <View style={styles.counterContainer}>
        <Text style={[styles.stepText, { color: colors.text }]}>
          {`${currentStep}/${totalSteps}`}
        </Text>
      </View>

      <View
        style={[
          styles.categoryBadge,
          {
            borderRadius: radius.full,
            backgroundColor: isDark
              ? 'rgba(13, 107, 78, 0.20)'
              : 'rgba(13, 107, 78, 0.12)',
          },
        ]}
      >
        <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>
          {categoryTitle}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  counterContainer: {
    alignItems: 'center',
  },
  stepText: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
