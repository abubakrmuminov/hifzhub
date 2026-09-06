import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useAudioStore } from '@/stores/audioStore';

import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from '@/shared/components/GlassView';

export interface HomeMiniAudioPlayerProps {}

export const HomeMiniAudioPlayer: React.FC<HomeMiniAudioPlayerProps> = () => {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();

  const isPlaying = useAudioStore((state) => state.isPlaying);
  const setIsPlaying = useAudioStore((state) => state.setIsPlaying);

  return (
    <Animated.View
      entering={FadeInDown.delay(480).springify()}
      style={[
        styles.wrapper,
        {
          paddingHorizontal: spacing.md,
          marginTop: spacing.md,
          marginBottom: spacing.lg,
        },
      ]}
    >
      <GlassView
        borderRadius={radius.lg}
        style={[
          styles.container,
          {
            padding: spacing.sm + 2,
          },
        ]}
      >
        {/* Play/Pause Button */}
        <AnimatedPressable
          onPress={() => setIsPlaying(!isPlaying)}
          accessibilityLabel={isPlaying ? t('audio.pause') : t('audio.play')}
        >
          <LinearGradient
            colors={['#1DCF90', '#0D6B4E', '#06422F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.playButton}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={18}
              color="#FFFFFF"
              style={{ marginStart: isPlaying ? 0 : 2 }}
            />
          </LinearGradient>
        </AnimatedPressable>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          <Text
            style={[styles.trackTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {t('home.miniPlayerTitle')}
          </Text>
          <Text
            style={[styles.reciterName, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {t('home.miniPlayerReciter')}
          </Text>
        </View>

        {/* Action Controls */}
        <View style={styles.controls}>
          <AnimatedPressable
            accessibilityLabel={t('audio.next')}
            style={styles.iconButton}
          >
            <Feather name="skip-forward" size={18} color={colors.textSecondary} />
          </AnimatedPressable>

          <View style={[styles.activeIndicator, { backgroundColor: colors.secondary }]} />
        </View>
      </GlassView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 12,
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  trackTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  reciterName: {
    fontSize: 11,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginStart: 8,
  },
  iconButton: {
    padding: 6,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
