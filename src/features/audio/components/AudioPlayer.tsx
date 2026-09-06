import React from 'react';
import { View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useMiniPlayer } from '@/features/audio/hooks/useMiniPlayer';
import { audioPlayerStyles as styles } from './audioPlayerStyles';

export interface AudioPlayerProps {
  bottomOffset?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ bottomOffset = 64 }) => {
  const { isDark, colors, shadows, radius } = useTheme();
  const {
    t,
    isPlaying,
    currentTrack,
    reciterName,
    next,
    previous,
    handlePlayPause,
    handleProgressLayout,
    handleProgressPress,
    progressPercent,
  } = useMiniPlayer();

  if (!currentTrack) return null;

  return (
    <View
      style={[
        styles.container,
        { bottom: bottomOffset, borderRadius: radius.lg },
        shadows.medium,
      ]}
    >
      <BlurView
        intensity={35}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? 'rgba(26, 26, 46, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
            borderRadius: radius.lg,
          },
        ]}
      >
        <View style={styles.contentRow}>
          <View style={styles.playButtonWrapper}>
            {isPlaying && (
              <MotiView
                from={{ opacity: 0.7, scale: 1 }}
                animate={{ opacity: 0, scale: 1.45 }}
                transition={{ type: 'timing', duration: 1200, loop: true }}
                style={styles.pulseRing}
              />
            )}
            <AnimatedPressable
              onPress={handlePlayPause}
              haptic="medium"
              style={[styles.playButton, { backgroundColor: colors.primary }]}
              accessibilityLabel={isPlaying ? t('audio.pause') : t('audio.play')}
            >
              <Feather name={isPlaying ? 'pause' : 'play'} size={22} color="#FFFFFF" />
            </AnimatedPressable>
          </View>

          <View style={styles.infoCol}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {t('quran.surah')} {currentTrack.surahId}, {t('quran.ayah')} {currentTrack.ayahNumber}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {reciterName}
            </Text>
          </View>

          <View style={styles.navRow}>
            <AnimatedPressable
              onPress={() => void previous()}
              haptic="light"
              style={styles.navButton}
              accessibilityLabel={t('audio.previous')}
            >
              <Feather name="skip-back" size={20} color={colors.primary} />
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => void next()}
              haptic="light"
              style={styles.navButton}
              accessibilityLabel={t('audio.next')}
            >
              <Feather name="skip-forward" size={20} color={colors.primary} />
            </AnimatedPressable>
          </View>
        </View>

        <View onLayout={handleProgressLayout}>
          <AnimatedPressable
            onPress={handleProgressPress}
            style={styles.progressTrack}
            haptic="none"
          >
            <View style={[styles.progressFill, { width: progressPercent }]} />
          </AnimatedPressable>
        </View>
      </BlurView>
    </View>
  );
};
