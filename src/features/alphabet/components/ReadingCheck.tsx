import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, ToastAndroid } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';

export interface ReadingCheckProps {
  instruction: string;
  arabic: string;
  transliteration: string;
  audioFile: string;
  recordingEnabled?: boolean;
  passScore?: number;
  transliterationInitiallyHidden?: boolean;
  onContinue: () => void;
}

export const ReadingCheck: React.FC<ReadingCheckProps> = ({
  instruction,
  arabic,
  transliteration,
  audioFile,
  recordingEnabled = false,
  passScore,
  transliterationInitiallyHidden = false,
  onContinue,
}) => {
  const { t } = useTranslation();
  const { isDark, colors, spacing, radius, fontFamilies } = useTheme();

  const [isTransliterationRevealed, setIsTransliterationRevealed] = useState(
    !transliterationInitiallyHidden
  );
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const audioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reanimated Pulsing Ring for Microphone Button
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.6);

  useEffect(() => {
    if (recordingEnabled) {
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 1200, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 0 })
        ),
        -1,
        false
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }),
          withTiming(0.6, { duration: 0 })
        ),
        -1,
        false
      );
    }
  }, [recordingEnabled, ringScale, ringOpacity]);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  useEffect(() => {
    return () => {
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    audioTimerRef.current = setTimeout(() => {
      setIsPlayingAudio(false);
    }, 800);
  };

  const handleRevealTransliteration = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsTransliterationRevealed(true);
  };

  const handleRecord = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const message = t('learn.recordingComingSoon', { defaultValue: 'Запись скоро будет доступна' });
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }

    setToastMessage(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, [t]);

  const containerBgColor = isDark ? '#0F0F1A' : '#F5F7F6';
  const cardBgColor = isDark ? '#1A1A2E' : '#FFFFFF';

  return (
    <View style={[styles.root, { backgroundColor: containerBgColor }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: spacing.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Instruction */}
        <Text style={[styles.instruction, { color: colors.text }]}>
          {instruction}
        </Text>

        {/* Central Reading Card */}
        <View
          style={[
            styles.readingCard,
            {
              backgroundColor: cardBgColor,
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'transparent',
              borderWidth: isDark ? 1 : 0,
              borderRadius: radius.xl,
            },
          ]}
        >
          {/* Large Arabic Text */}
          <Text
            style={[
              styles.arabicText,
              {
                fontFamily: fontFamilies.arabic,
                color: colors.primary,
              },
            ]}
          >
            {arabic}
          </Text>

          {/* Transliteration Section */}
          <View style={styles.transliterationContainer}>
            {!isTransliterationRevealed ? (
              <AnimatedPressable
                onPress={handleRevealTransliteration}
                haptic="light"
                style={[
                  styles.hintButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(212, 167, 69, 0.15)'
                      : 'rgba(212, 167, 69, 0.1)',
                    borderRadius: radius.full,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('learn.showHint', { defaultValue: 'Показать подсказку' })}
              >
                <Feather
                  name="eye"
                  size={15}
                  color={isDark ? '#E4BF6A' : '#A27008'}
                  style={styles.hintIcon}
                />
                <Text
                  style={[
                    styles.hintButtonText,
                    { color: isDark ? '#E4BF6A' : '#A27008' },
                  ]}
                >
                  {t('learn.showHint', { defaultValue: 'Показать подсказку' })}
                </Text>
              </AnimatedPressable>
            ) : (
              <Animated.View
                entering={
                  transliterationInitiallyHidden ? FadeIn.duration(300) : undefined
                }
              >
                <Text
                  style={[
                    styles.transliterationText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {transliteration}
                </Text>
              </Animated.View>
            )}
          </View>
        </View>

        {/* Audio / Recording Actions */}
        <View style={styles.actionsRow}>
          {/* Play Button (Large circle, 64px, primary bg, white speaker icon) */}
          <View style={styles.actionItem}>
            <AnimatedPressable
              onPress={handlePlayAudio}
              haptic="medium"
              style={[
                styles.playButtonLarge,
                {
                  backgroundColor: colors.primary,
                  transform: [{ scale: isPlayingAudio ? 0.94 : 1 }],
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('learn.listen', { defaultValue: 'Прослушать образец' })}
            >
              <Feather name="volume-2" size={30} color="#FFFFFF" />
            </AnimatedPressable>
            <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>
              {t('learn.listen', { defaultValue: 'Слушать' })}
            </Text>
          </View>

          {/* Microphone Button with Pulsing Ring (If recordingEnabled) */}
          {recordingEnabled && (
            <View style={styles.actionItem}>
              <View style={styles.micWrapper}>
                <Animated.View
                  style={[
                    styles.pulsingRing,
                    { borderColor: colors.secondary },
                    animatedRingStyle,
                  ]}
                />
                <AnimatedPressable
                  onPress={handleRecord}
                  haptic="heavy"
                  style={[
                    styles.micButton,
                    {
                      backgroundColor: isDark ? '#26263E' : '#FFFFFF',
                      borderColor: colors.secondary,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('learn.record', { defaultValue: 'Записать чтение' })}
                >
                  <Feather name="mic" size={28} color={colors.secondary} />
                </AnimatedPressable>
              </View>
              <Text
                style={[
                  styles.actionLabel,
                  { color: isDark ? '#E4BF6A' : '#A27008' },
                ]}
              >
                {t('learn.record', { defaultValue: 'Записать' })}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Footer */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <AnimatedPressable
          onPress={onContinue}
          haptic="light"
          style={[
            styles.continueButton,
            {
              backgroundColor: colors.primary,
              borderRadius: radius.md ?? 16,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('learn.continue', { defaultValue: 'Продолжить' })}
        >
          <Text style={styles.continueButtonText}>{t('learn.continue', { defaultValue: 'Продолжить' })}</Text>
        </AnimatedPressable>
      </View>

      {/* Floating In-App Toast */}
      {toastMessage && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          exiting={FadeOutDown.duration(200)}
          style={[
            styles.toastContainer,
            {
              backgroundColor: isDark ? '#25253A' : '#1C1C1E',
              borderRadius: radius.full,
            },
          ]}
        >
          <Feather name="info" size={16} color="#FFFFFF" style={styles.toastIcon} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  instruction: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },
  readingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    marginBottom: 36,
  },
  arabicText: {
    fontSize: 40,
    writingDirection: 'rtl',
    textAlign: 'center',
    lineHeight: 64,
    marginBottom: 12,
  },
  transliterationContainer: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  transliterationText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  hintIcon: {
    marginRight: 6,
  },
  hintButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 36,
    marginBottom: 36,
  },
  actionItem: {
    alignItems: 'center',
  },
  playButtonLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micWrapper: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulsingRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  footer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  continueButton: {
    width: '100%',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 96,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    zIndex: 99,
  },
  toastIcon: {
    marginRight: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
