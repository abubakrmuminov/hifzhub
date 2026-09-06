import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { GlassView, AnimatedPressable } from '@/shared/components';

export interface EmptyHifzPromptProps {
  onAddPress: () => void;
}

export const EmptyHifzPrompt: React.FC<EmptyHifzPromptProps> = ({ onAddPress }) => {
  const { isDark, colors, spacing, radius } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <GlassView borderRadius={radius.lg} style={styles.glass}>
        <View style={[styles.content, { padding: spacing.lg }]}>
          <View
            style={[
              styles.iconCircle,
              {
                borderRadius: radius.full,
                backgroundColor: isDark
                  ? 'rgba(13, 107, 78, 0.20)'
                  : 'rgba(13, 107, 78, 0.10)',
              },
            ]}
          >
            <Ionicons name="book-outline" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text, marginTop: spacing.sm }]}>
            {t('hifz.emptyTitle', { defaultValue: 'Начните заучивание' })}
          </Text>
          <Text
            style={[
              styles.message,
              { color: colors.textSecondary, marginTop: spacing.xs, marginHorizontal: spacing.sm },
            ]}
          >
            {t('hifz.emptyMessage', {
              defaultValue: 'Нажмите + чтобы добавить аяты из Корана',
            })}
          </Text>
          <AnimatedPressable
            onPress={onAddPress}
            style={[
              styles.button,
              {
                borderRadius: radius.md,
                backgroundColor: colors.primary,
                marginTop: spacing.md,
              },
            ]}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginEnd: spacing.xs }} />
            <Text style={styles.btnText}>
              {t('hifz.addAyahs', { defaultValue: 'Добавить аяты' })}
            </Text>
          </AnimatedPressable>
        </View>
      </GlassView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  glass: {
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
