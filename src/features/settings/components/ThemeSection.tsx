import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useSettingsStore, type AppTheme } from '@/stores/settingsStore';
import { SettingCard } from './SettingCard';

export interface ThemeSectionProps {}

interface ThemeOption {
  key: AppTheme;
  labelKey: string;
  iconName: keyof typeof Feather.glyphMap;
}

const THEMES: ThemeOption[] = [
  { key: 'light', labelKey: 'settings.lightMode', iconName: 'sun' },
  { key: 'dark', labelKey: 'settings.darkMode', iconName: 'moon' },
  { key: 'system', labelKey: 'settings.system', iconName: 'smartphone' },
];

export const ThemeSection: React.FC<ThemeSectionProps> = () => {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const currentTheme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);

  return (
    <SettingCard
      title={t('settings.theme')}
      icon={<Feather name="moon" size={18} color={colors.primary} />}
    >
      <View style={styles.grid}>
        {THEMES.map((item) => {
          const isSelected = currentTheme === item.key;
          return (
            <AnimatedPressable
              key={item.key}
              onPress={() => setTheme(item.key)}
              accessibilityRole="radio"
              accessibilityLabel={t(item.labelKey)}
              style={[
                styles.themeButton,
                {
                  borderRadius: radius.md,
                  backgroundColor: isSelected
                    ? 'rgba(13, 107, 78, 0.12)'
                    : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isSelected ? colors.primary : colors.border,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.xs,
                },
              ]}
            >
              <Feather
                name={item.iconName}
                size={20}
                color={isSelected ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.themeLabel,
                  {
                    color: isSelected ? colors.primary : colors.text,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {t(item.labelKey)}
              </Text>
              {isSelected ? (
                <View
                  style={[
                    styles.indicatorDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
              ) : (
                <View style={styles.placeholderDot} />
              )}
            </AnimatedPressable>
          );
        })}
      </View>
    </SettingCard>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  themeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    minHeight: 74,
  },
  themeLabel: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  placeholderDot: {
    width: 6,
    height: 6,
    marginTop: 4,
  },
});
