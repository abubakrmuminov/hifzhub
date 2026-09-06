import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadeInLeft,
  FadeOutRight,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components';
import {
  useSettingsStore,
  type AppLanguage,
  type UserLevel,
} from '@/stores/settingsStore';
import { useProgressStore } from '@/stores/progressStore';

export default function OnboardingScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, isDark, spacing, shadows } = useTheme();

  const storeLanguage = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

  const [step, setStep] = useState<number>(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  // Form states
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(storeLanguage || 'ru');
  const [selectedLevel, setSelectedLevel] = useState<UserLevel>('beginner');
  const [selectedGoal, setSelectedGoal] = useState<number>(10);

  // Step 0: Language Selection handler
  const handleSelectLanguage = useCallback(
    (lang: AppLanguage) => {
      setSelectedLanguage(lang);
      void i18n.changeLanguage(lang);
      setLanguage(lang);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [i18n, setLanguage]
  );

  // Step 1: Experience Level Selection handler
  const handleSelectLevel = useCallback((level: UserLevel) => {
    setSelectedLevel(level);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Step 2: Daily Goal Selection handler
  const handleSelectGoal = useCallback((minutes: number) => {
    setSelectedGoal(minutes);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Back button handler
  const handleBack = useCallback(() => {
    if (step > 0) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDirection('back');
      setStep((prev) => prev - 1);
    }
  }, [step]);

  // Next / Finish button handler
  const handleContinue = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (step < 2) {
      setDirection('forward');
      setStep((prev) => prev + 1);
    } else {
      // Complete onboarding
      completeOnboarding({
        language: selectedLanguage,
        userLevel: selectedLevel,
        dailyGoalMinutes: selectedGoal,
      });

      const targetAyahs = selectedGoal === 5 ? 5 : selectedGoal === 10 ? 10 : 20;
      useProgressStore.getState().setDailyTarget(targetAyahs);

      router.replace('/(tabs)');
    }
  }, [step, selectedLanguage, selectedLevel, selectedGoal, completeOnboarding]);

  // Render Step 0: Language Selection
  const renderStep0Language = () => (
    <View style={styles.stepContainer}>
      {/* Welcome Header */}
      <View style={styles.welcomeHero}>
        <View style={[styles.logoWrapper, shadows.medium]}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>
        <Text style={[styles.welcomeTitle, { color: colors.text }]}>
          {t('onboarding.welcomeTitle')}
        </Text>
        <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
          {t('onboarding.welcomeSubtitle')}
        </Text>
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('onboarding.selectLanguageTitle')}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {t('onboarding.selectLanguageSubtitle')}
        </Text>
      </View>

      {/* Language Cards */}
      <View style={styles.optionsList}>
        {/* Card 1: Russian */}
        <AnimatedPressable
          onPress={() => handleSelectLanguage('ru')}
          style={[
            styles.card,
            {
              backgroundColor:
                selectedLanguage === 'ru'
                  ? isDark
                    ? 'rgba(13, 107, 78, 0.22)'
                    : '#EFF8F4'
                  : colors.surface,
              borderColor:
                selectedLanguage === 'ru'
                  ? '#0D6B4E'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)',
              borderWidth: selectedLanguage === 'ru' ? 2 : 1,
            },
          ]}
        >
          <View style={styles.cardLeft}>
            <View style={styles.flagContainer}>
              <Text style={styles.flagEmoji}>🇷🇺</Text>
            </View>
            <View style={styles.cardTextContent}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t('onboarding.langRu')}
              </Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                {t('onboarding.langRuDesc')}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.radioCircle,
              selectedLanguage === 'ru' && styles.radioCircleSelected,
            ]}
          >
            {selectedLanguage === 'ru' && (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
          </View>
        </AnimatedPressable>

        {/* Card 2: Uzbek */}
        <AnimatedPressable
          onPress={() => handleSelectLanguage('uz')}
          style={[
            styles.card,
            {
              backgroundColor:
                selectedLanguage === 'uz'
                  ? isDark
                    ? 'rgba(13, 107, 78, 0.22)'
                    : '#EFF8F4'
                  : colors.surface,
              borderColor:
                selectedLanguage === 'uz'
                  ? '#0D6B4E'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)',
              borderWidth: selectedLanguage === 'uz' ? 2 : 1,
            },
          ]}
        >
          <View style={styles.cardLeft}>
            <View style={styles.flagContainer}>
              <Text style={styles.flagEmoji}>🇺🇿</Text>
            </View>
            <View style={styles.cardTextContent}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t('onboarding.langUz')}
              </Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                {t('onboarding.langUzDesc')}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.radioCircle,
              selectedLanguage === 'uz' && styles.radioCircleSelected,
            ]}
          >
            {selectedLanguage === 'uz' && (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );

  // Render Step 1: Experience Level Selection
  const renderStep1Level = () => {
    const levels: {
      id: UserLevel;
      icon: keyof typeof Ionicons.glyphMap;
      title: string;
      desc: string;
      tag: string;
    }[] = [
      {
        id: 'beginner',
        icon: 'book-outline',
        title: t('onboarding.levelBeginnerTitle'),
        desc: t('onboarding.levelBeginnerDesc'),
        tag: t('onboarding.levelBeginnerTag'),
      },
      {
        id: 'intermediate',
        icon: 'school-outline',
        title: t('onboarding.levelIntermediateTitle'),
        desc: t('onboarding.levelIntermediateDesc'),
        tag: t('onboarding.levelIntermediateTag'),
      },
      {
        id: 'memorizer',
        icon: 'heart-outline',
        title: t('onboarding.levelMemorizerTitle'),
        desc: t('onboarding.levelMemorizerDesc'),
        tag: t('onboarding.levelMemorizerTag'),
      },
    ];

    return (
      <View style={styles.stepContainer}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitleLarge, { color: colors.text }]}>
            {t('onboarding.selectLevelTitle')}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {t('onboarding.selectLevelSubtitle')}
          </Text>
        </View>

        {/* Level Cards */}
        <View style={styles.optionsList}>
          {levels.map((item) => {
            const isSelected = selectedLevel === item.id;
            return (
              <AnimatedPressable
                key={item.id}
                onPress={() => handleSelectLevel(item.id)}
                style={[
                  styles.card,
                  styles.levelCard,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(13, 107, 78, 0.22)'
                        : '#EFF8F4'
                      : colors.surface,
                    borderColor: isSelected
                      ? '#0D6B4E'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.levelCardTop}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isSelected
                          ? '#0D6B4E'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : '#F3F4F6',
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={24}
                      color={isSelected ? '#FFFFFF' : '#0D6B4E'}
                    />
                  </View>

                  <View style={styles.levelCardHeaderRight}>
                    <View
                      style={[
                        styles.tagBadge,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(212, 167, 69, 0.2)'
                              : '#FEF8E7'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.06)'
                            : '#F0F1F3',
                          borderColor: isSelected ? '#D4A745' : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          {
                            color: isSelected ? '#B38B30' : colors.textTertiary,
                          },
                        ]}
                      >
                        {item.tag}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </View>
                </View>

                <Text style={[styles.cardTitle, { color: colors.text, marginTop: 12 }]}>
                  {item.title}
                </Text>
                <Text style={[styles.cardDesc, { color: colors.textSecondary, marginTop: 4 }]}>
                  {item.desc}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>
      </View>
    );
  };

  // Render Step 2: Daily Goal Selection
  const renderStep2Goal = () => {
    const goals = [
      {
        minutes: 5,
        title: t('onboarding.goal5Min'),
        desc: t('onboarding.goal5MinDesc'),
        badge: null,
      },
      {
        minutes: 10,
        title: t('onboarding.goal10Min'),
        desc: t('onboarding.goal10MinDesc'),
        badge: t('onboarding.goal10MinBadge'),
      },
      {
        minutes: 20,
        title: t('onboarding.goal20Min'),
        desc: t('onboarding.goal20MinDesc'),
        badge: null,
      },
    ];

    return (
      <View style={styles.stepContainer}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitleLarge, { color: colors.text }]}>
            {t('onboarding.selectGoalTitle')}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {t('onboarding.selectGoalSubtitle')}
          </Text>
        </View>

        {/* Goal Cards */}
        <View style={styles.optionsList}>
          {goals.map((item) => {
            const isSelected = selectedGoal === item.minutes;
            return (
              <AnimatedPressable
                key={item.minutes}
                onPress={() => handleSelectGoal(item.minutes)}
                style={[
                  styles.card,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(13, 107, 78, 0.22)'
                        : '#EFF8F4'
                      : colors.surface,
                    borderColor: isSelected
                      ? '#0D6B4E'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.cardLeft}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isSelected
                          ? '#0D6B4E'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : '#F3F4F6',
                      },
                    ]}
                  >
                    <Feather
                      name="clock"
                      size={20}
                      color={isSelected ? '#FFFFFF' : '#0D6B4E'}
                    />
                  </View>
                  <View style={styles.cardTextContent}>
                    <View style={styles.goalTitleRow}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>
                        {item.title}
                      </Text>
                      {item.badge && (
                        <View style={styles.recommendBadge}>
                          <Ionicons name="star" size={11} color="#FFFFFF" />
                          <Text style={styles.recommendBadgeText}>{item.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                      {item.desc}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </AnimatedPressable>
            );
          })}
        </View>

        {/* Spiritual Hadith Card */}
        <View
          style={[
            styles.hadithCard,
            {
              backgroundColor: isDark ? 'rgba(212, 167, 69, 0.08)' : '#FEFBF3',
              borderColor: isDark ? 'rgba(212, 167, 69, 0.25)' : 'rgba(212, 167, 69, 0.35)',
            },
          ]}
        >
          <View style={styles.hadithIconRow}>
            <MaterialCommunityIcons
              name="format-quote-open"
              size={26}
              color="#D4A745"
            />
          </View>
          <Text style={[styles.hadithText, { color: colors.text }]}>
            {t('onboarding.hadithText')}
          </Text>
          <Text style={styles.hadithSource}>{t('onboarding.hadithSource')}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Top Navigation & Step Indicator */}
      <View
        style={[
          styles.topNav,
          {
            paddingTop: Math.max(insets.top, 16) + 8,
            paddingHorizontal: spacing.lg,
          },
        ]}
      >
        {/* Back Button */}
        {step > 0 ? (
          <AnimatedPressable
            onPress={handleBack}
            style={styles.navButton}
            accessibilityLabel={t('onboarding.back')}
          >
            <Feather name="arrow-left" size={22} color={colors.text} />
          </AnimatedPressable>
        ) : (
          <View style={styles.navButtonPlaceholder} />
        )}

        {/* Step Progress Bar */}
        <View style={styles.progressBar}>
          {[0, 1, 2].map((idx) => {
            const isActive = idx === step;
            const isCompleted = idx < step;
            return (
              <View
                key={idx}
                style={[
                  styles.progressPill,
                  isActive
                    ? styles.progressPillActive
                    : isCompleted
                    ? styles.progressPillCompleted
                    : styles.progressPillInactive,
                  {
                    backgroundColor: isActive
                      ? '#D4A745'
                      : isCompleted
                      ? '#0D6B4E'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.15)'
                      : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Symmetry Placeholder */}
        <View style={styles.navButtonPlaceholder} />
      </View>

      {/* Main Content ScrollView */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        <Animated.View
          key={`step-${step}`}
          entering={
            direction === 'forward'
              ? FadeInRight.duration(280)
              : FadeInLeft.duration(280)
          }
          exiting={
            direction === 'forward'
              ? FadeOutLeft.duration(200)
              : FadeOutRight.duration(200)
          }
        >
          {step === 0 && renderStep0Language()}
          {step === 1 && renderStep1Level()}
          {step === 2 && renderStep2Goal()}
        </Animated.View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 16) + 12,
            backgroundColor: isDark
              ? 'rgba(19, 19, 34, 0.95)'
              : 'rgba(248, 246, 240, 0.95)',
            borderTopColor: isDark
              ? 'rgba(255, 255, 255, 0.06)'
              : 'rgba(0, 0, 0, 0.05)',
          },
        ]}
      >
        <AnimatedPressable
          onPress={handleContinue}
          style={styles.primaryButtonWrapper}
          scaleValue={0.98}
        >
          <LinearGradient
            colors={['#0D6B4E', '#128762']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButtonGradient}
          >
            <Text style={styles.primaryButtonText}>
              {step < 2
                ? t('onboarding.continue')
                : t('onboarding.startLearning')}
            </Text>
            <Feather
              name="arrow-right"
              size={20}
              color="#FFFFFF"
              style={styles.primaryButtonIcon}
            />
          </LinearGradient>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 16,
  },
  progressPill: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  progressPillActive: {
    flex: 1.4,
  },
  progressPillCompleted: {
    flex: 1,
  },
  progressPillInactive: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  stepContainer: {
    width: '100%',
  },
  welcomeHero: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  logoWrapper: {
    width: 76,
    height: 76,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
  },
  logoImage: {
    width: 76,
    height: 76,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionTitleLarge: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionsList: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  flagEmoji: {
    fontSize: 28,
  },
  cardTextContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(150, 150, 150, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioCircleSelected: {
    borderColor: '#0D6B4E',
    backgroundColor: '#0D6B4E',
  },
  levelCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 18,
  },
  levelCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  levelCardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  recommendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4A745',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  recommendBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  hadithCard: {
    marginTop: 20,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  hadithIconRow: {
    marginBottom: 6,
  },
  hadithText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    fontWeight: '500',
    marginBottom: 8,
  },
  hadithSource: {
    fontSize: 12,
    color: '#D4A745',
    fontWeight: '700',
    textAlign: 'right',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  primaryButtonWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  primaryButtonIcon: {
    marginLeft: 8,
  },
});
