import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, ToastAndroid } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';

export interface ListenRepeatItem {
  arabic: string;
  transliteration: string;
  audioFile: string;
}

export interface ListenRepeatProps {
  instruction: string;
  items: ListenRepeatItem[];
  recordingEnabled?: boolean;
  cameraHintEnabled?: boolean;
  onContinue: () => void;
}

export const ListenRepeat: React.FC<ListenRepeatProps> = ({
  instruction,
  items,
  recordingEnabled = false,
  cameraHintEnabled = false,
  onContinue,
}) => {
  const { t } = useTranslation();
  const { isDark, colors, spacing, radius, fontFamilies } = useTheme();

  const [activePlayIndex, setActivePlayIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handlePlay = (index: number) => {
    setActivePlayIndex(index);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    playTimerRef.current = setTimeout(() => {
      setActivePlayIndex(null);
    }, 700);
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

        {/* Camera / Mirror Hint Banner */}
        {cameraHintEnabled && (
          <View
            style={[
              styles.cameraBanner,
              {
                backgroundColor: isDark
                  ? 'rgba(212, 167, 69, 0.18)'
                  : '#FEF9E7',
                borderColor: isDark ? 'rgba(212, 167, 69, 0.3)' : 'transparent',
                borderWidth: isDark ? 1 : 0,
                borderRadius: radius.md,
                marginBottom: spacing.lg,
              },
            ]}
          >
            <Text
              style={[
                styles.cameraBannerText,
                { color: isDark ? '#F5D782' : '#8A5D00' },
              ]}
            >
              📷 {t('learn.mirrorHint', { defaultValue: 'Используй зеркало или камеру, чтобы проверить положение языка' })}
            </Text>
          </View>
        )}

        {/* Items List */}
        <View style={styles.itemsList}>
          {items.map((item, index) => {
            const isPlaying = activePlayIndex === index;

            return (
              <View
                key={`${item.arabic}-${index}`}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: cardBgColor,
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'transparent',
                    borderWidth: isDark ? 1 : 0,
                    borderRadius: radius.lg,
                  },
                ]}
              >
                {/* Play Button on Left */}
                <AnimatedPressable
                  onPress={() => handlePlay(index)}
                  haptic="light"
                  style={[
                    styles.playButtonCircle,
                    {
                      backgroundColor: isPlaying
                        ? colors.primary
                        : isDark
                        ? 'rgba(13, 107, 78, 0.25)'
                        : 'rgba(13, 107, 78, 0.1)',
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('learn.listen', { defaultValue: 'Прослушать' })} ${item.transliteration}`}
                >
                  <Feather
                    name="volume-2"
                    size={22}
                    color={isPlaying ? '#FFFFFF' : colors.primary}
                  />
                </AnimatedPressable>

                {/* Centered Arabic Text and Transliteration */}
                <View style={styles.textContainer}>
                  <Text
                    style={[
                      styles.arabicText,
                      {
                        fontFamily: fontFamilies.arabic,
                        color: colors.text,
                      },
                    ]}
                  >
                    {item.arabic}
                  </Text>
                  <Text
                    style={[
                      styles.transliterationText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.transliteration}
                  </Text>
                </View>

                {/* Symmetrical Spacer to keep Arabic centered */}
                <View style={styles.playButtonPlaceholder} />
              </View>
            );
          })}
        </View>

        {/* Optional Recording Button */}
        {recordingEnabled && (
          <View style={styles.bottomSection}>
            <AnimatedPressable
              onPress={handleRecord}
              haptic="medium"
              style={[
                styles.recordButton,
                {
                  backgroundColor: isDark
                    ? 'rgba(212, 167, 69, 0.15)'
                    : 'rgba(212, 167, 69, 0.12)',
                  borderColor: colors.secondary,
                  borderRadius: radius.md,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('learn.recordSelf', { defaultValue: 'Запиши себя' })}
            >
              <Text
                style={[
                  styles.recordButtonText,
                  { color: isDark ? '#E4BF6A' : '#A27008' },
                ]}
              >
                🎤 {t('learn.recordSelf', { defaultValue: 'Запиши себя' })}
              </Text>
            </AnimatedPressable>
          </View>
        )}
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
    marginBottom: 20,
  },
  cameraBanner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cameraBannerText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
  itemsList: {
    gap: 12,
    marginBottom: 24,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  playButtonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonPlaceholder: {
    width: 48,
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabicText: {
    fontSize: 36,
    writingDirection: 'rtl',
    textAlign: 'center',
    lineHeight: 52,
  },
  transliterationText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  bottomSection: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  recordButton: {
    height: 48,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonText: {
    fontSize: 15,
    fontWeight: '700',
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
