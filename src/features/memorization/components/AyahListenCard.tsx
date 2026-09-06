import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable, GlassView } from '@/shared/components';
import { playAyah, stopAudio, preloadAyahAudio } from '@/features/audio/services/trackPlayer';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAudioStore } from '@/stores/audioStore';

export interface AyahListenCardProps {
  arabicText: string;
  surahId: number;
  ayahNumber: number;
  surahName?: string;
  translation?: string;
  onReadyToTrain: () => void;
}

export const AyahListenCard: React.FC<AyahListenCardProps> = ({
  arabicText,
  surahId,
  ayahNumber,
  surahName,
  translation,
  onReadyToTrain,
}) => {
  const { colors, spacing, radius, isDark } = useTheme();
  const { t } = useTranslation();
  const defaultReciter = useSettingsStore((s) => s.defaultReciter);

  const isStorePlaying = useAudioStore((s) => s.isPlaying);
  const currentTrack = useAudioStore((s) => s.currentTrack);

  const isCurrentAyahPlaying =
    isStorePlaying &&
    currentTrack?.surahId === surahId &&
    currentTrack?.ayahNumber === ayahNumber;

  const [listenCount, setListenCount] = useState(0);

  // Preload audio and stop audio on unmount
  useEffect(() => {
    void preloadAyahAudio(surahId, ayahNumber, defaultReciter);
    return () => {
      void stopAudio();
    };
  }, [surahId, ayahNumber, defaultReciter]);

  const handleAudioPress = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isCurrentAyahPlaying) {
      await stopAudio();
      return;
    }

    try {
      setListenCount((prev) => prev + 1);
      // explicitly pass autoPlayNext: false so it stops after THIS ayah!
      await playAyah(surahId, ayahNumber, defaultReciter, { autoPlayNext: false });
    } catch (err) {
      console.warn('Failed to play single ayah audio:', err);
    }
  }, [isCurrentAyahPlaying, surahId, ayahNumber, defaultReciter]);

  const handleProceed = useCallback(() => {
    void stopAudio();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onReadyToTrain();
  }, [onReadyToTrain]);

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={[styles.headerRow, { marginBottom: spacing.sm }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.stepBadge, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="volume-high-outline" size={14} color={colors.primary} />
            <Text style={[styles.stepBadgeText, { color: colors.primary, marginStart: 4 }]}>
              {t('hifz.step1Title', { defaultValue: 'Шаг 1: Ознакомление' })}
            </Text>
          </View>
        </View>

        {Boolean(surahName) && (
          <Text style={[styles.surahBadge, { color: colors.textSecondary }]}>
            {surahName} • {ayahNumber}
          </Text>
        )}
      </View>

      <Text style={[styles.instruction, { color: colors.text, marginBottom: spacing.md }]}>
        {t('hifz.listenInstruction', {
          defaultValue: 'Прочитайте и прослушайте аят 2-3 раза, чтобы запомнить:',
        })}
      </Text>

      {/* Main Reading Card */}
      <GlassView
        borderRadius={radius.lg}
        style={[
          styles.cardContainer,
          {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.90)',
          },
        ]}
      >
        {/* Arabic Quranic Text */}
        <Text
          style={[
            styles.arabicText,
            {
              color: colors.text,
              lineHeight: 48,
            },
          ]}
        >
          {arabicText}
        </Text>

        {/* Translation */}
        {Boolean(translation) && (
          <View
            style={[
              styles.translationBox,
              {
                borderTopColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
                marginTop: spacing.md,
                paddingTop: spacing.md,
              },
            ]}
          >
            <Text style={[styles.translationText, { color: colors.textSecondary }]}>
              {translation}
            </Text>
          </View>
        )}

        {/* Audio Recitation Row */}
        <View style={[styles.audioRow, { marginTop: spacing.md }]}>
          <AnimatedPressable
            onPress={handleAudioPress}
            style={[
              styles.audioBtn,
              {
                backgroundColor: isCurrentAyahPlaying
                  ? colors.secondary
                  : isDark
                  ? 'rgba(13, 107, 78, 0.25)'
                  : 'rgba(13, 107, 78, 0.12)',
                borderRadius: radius.full,
              },
            ]}
          >
            <Ionicons
              name={isCurrentAyahPlaying ? 'pause' : 'play'}
              size={18}
              color={isCurrentAyahPlaying ? '#FFFFFF' : colors.primary}
            />
            <Text
              style={[
                styles.audioBtnText,
                {
                  color: isCurrentAyahPlaying ? '#FFFFFF' : colors.primary,
                  marginStart: 6,
                },
              ]}
            >
              {isCurrentAyahPlaying
                ? t('hifz.pauseRecitation', { defaultValue: 'Остановить' })
                : t('hifz.listenReciter', { defaultValue: 'Слушать чтеца' })}
            </Text>
          </AnimatedPressable>

          {listenCount > 0 && (
            <View style={styles.listenCountBadge}>
              <Ionicons name="checkmark-done" size={14} color={colors.secondary} />
              <Text style={[styles.listenCountText, { color: colors.textTertiary, marginStart: 4 }]}>
                {t('hifz.listenedTimes', {
                  defaultValue: `Прослушано: ${listenCount} раз`,
                  count: listenCount,
                })}
              </Text>
            </View>
          )}
        </View>
      </GlassView>

      {/* CTA Ready Button */}
      <View style={[styles.ctaContainer, { marginTop: spacing.xl }]}>
        <AnimatedPressable
          onPress={handleProceed}
          style={[
            styles.readyBtn,
            { backgroundColor: colors.primary, borderRadius: radius.md },
          ]}
        >
          <Text style={styles.readyBtnText}>
            {t('hifz.readyToTest', { defaultValue: 'Я запомнил, проверить себя ➔' })}
          </Text>
        </AnimatedPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  surahBadge: {
    fontSize: 13,
    fontWeight: '600',
  },
  instruction: {
    fontSize: 15,
    fontWeight: '500',
  },
  cardContainer: {
    padding: 18,
    borderWidth: 1.5,
  },
  arabicText: {
    fontSize: 28,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  translationBox: {
    borderTopWidth: 1,
  },
  translationText: {
    fontSize: 15,
    lineHeight: 22,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  audioBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listenCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listenCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ctaContainer: {
    width: '100%',
  },
  readyBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D6B4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  readyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
