import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import {
  LanguageSection,
  ThemeSection,
  QuranReadingSection,
  ReciterSection,
  AudioStorageSection,
  AboutSection,
} from '@/features/settings/components';

export interface SettingsScreenProps {}

export function SettingsScreen({}: SettingsScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top > 0 ? insets.top : spacing.md,
        },
      ]}
    >
      {/* Header bar */}
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <AnimatedPressable
          onPress={() => router.back()}
          accessibilityLabel={t('common.back')}
          style={[styles.backButton, { backgroundColor: colors.surfaceGlass }]}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </AnimatedPressable>

        <Text style={[styles.title, { color: colors.text }]}>
          {t('common.settings')}
        </Text>

        <View style={styles.headerRightSpacer} />
      </View>

      {/* Settings list */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: spacing.md,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LanguageSection />
        <ThemeSection />
        <QuranReadingSection />
        <ReciterSection />
        <AudioStorageSection />
        <AboutSection />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRightSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
});

export default SettingsScreen;
