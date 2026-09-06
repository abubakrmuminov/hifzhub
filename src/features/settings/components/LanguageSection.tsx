import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useSettingsStore, type AppLanguage } from '@/stores/settingsStore';
import { SettingCard } from './SettingCard';

export interface LanguageSectionProps {}

interface LanguageOption {
  code: AppLanguage;
  labelKey: string;
  nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'ru', labelKey: 'settings.languageRussian', nativeName: 'Русский' },
  { code: 'uz', labelKey: 'settings.languageUzbek', nativeName: "O'zbekcha" },
];

export const LanguageSection: React.FC<LanguageSectionProps> = () => {
  const { t, i18n } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const currentLanguage = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  const handleSelectLanguage = (code: AppLanguage) => {
    setLanguage(code);
    void i18n.changeLanguage(code);
  };

  return (
    <SettingCard
      title={t('settings.language')}
      icon={<Feather name="globe" size={18} color={colors.primary} />}
    >
      <View style={styles.list}>
        {LANGUAGES.map((lang, index) => {
          const isSelected = currentLanguage === lang.code;
          return (
            <AnimatedPressable
              key={lang.code}
              onPress={() => handleSelectLanguage(lang.code)}
              accessibilityRole="radio"
              accessibilityLabel={t(lang.labelKey)}
              style={[
                styles.optionRow,
                {
                  borderRadius: radius.md,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.sm,
                  backgroundColor: isSelected ? 'rgba(13, 107, 78, 0.08)' : 'transparent',
                  marginTop: index > 0 ? spacing.xs : 0,
                },
              ]}
            >
              <View style={styles.textContainer}>
                <Text style={[styles.langName, { color: colors.text }]}>
                  {t(lang.labelKey)}
                </Text>
                <Text style={[styles.nativeName, { color: colors.textSecondary }]}>
                  {lang.nativeName}
                </Text>
              </View>

              <View
                style={[
                  styles.radioCircle,
                  {
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                {isSelected ? (
                  <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                ) : null}
              </View>
            </AnimatedPressable>
          );
        })}
      </View>
    </SettingCard>
  );
};

const styles = StyleSheet.create({
  list: {
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
  langName: {
    fontSize: 15,
    fontWeight: '600',
  },
  nativeName: {
    fontSize: 12,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: 12,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
