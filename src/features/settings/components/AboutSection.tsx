import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme';
import { SettingCard } from './SettingCard';

export interface AboutSectionProps {}

export const AboutSection: React.FC<AboutSectionProps> = () => {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  return (
    <SettingCard
      title={t('settings.about')}
      icon={<Feather name="info" size={18} color={colors.primary} />}
    >
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <Text style={[styles.appName, { color: colors.primary }]}>
            HifzHub
          </Text>
          <Text style={[styles.versionBadge, { color: colors.textSecondary }]}>
            v1.0.0
          </Text>
        </View>

        <Text
          style={[
            styles.creditsText,
            { color: colors.textSecondary, marginTop: spacing.xs },
          ]}
        >
          {t('settings.credits')}
        </Text>
      </View>
    </SettingCard>
  );
};

const styles = StyleSheet.create({
  content: {
    marginTop: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  versionBadge: {
    fontSize: 13,
    fontWeight: '600',
  },
  creditsText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
