import React from 'react';
import { View, Text, StyleSheet, Pressable, type DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAudioStore } from '@/stores/audioStore';
import { usePlayer, stopAudio } from '@/features/audio';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from '@/shared/components/GlassView';

export interface FloatingAudioPlayerProps {
  surahId?: number;
  surahName?: string;
  totalAyahs?: number;
}

const RECITERS_ARRAY = [
  { id: 'ar.alafasy', name: 'Мишари Рашид' },
  { id: 'ar.dussary', name: 'Ясир ад-Даусари' },
  { id: 'ar.abdulbasetmurattal', name: 'Абдул-Басит' },
  { id: 'ar.husary', name: 'Аль-Хусари' },
  { id: 'ar.abdurrahmaansudais', name: 'Ас-Судейс' },
];

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins + ':' + (secs < 10 ? '0' : '') + secs;
};

export const FloatingAudioPlayer: React.FC<FloatingAudioPlayerProps> = ({
  surahId,
  surahName,
  totalAyahs,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors, radius, spacing, isDark } = useTheme();

  const {
    isPlaying,
    currentTrack,
    position,
    duration,
    speed,
    cycleSpeed,
    repeatCount,
    currentRepeatIndex,
    cycleRepeatCount,
    play,
    pause,
    next,
    previous,
    playAyah,
    isReady,
  } = usePlayer();

  const defaultReciter = useSettingsStore((s) => s.defaultReciter);
  const setDefaultReciter = useSettingsStore((s) => s.setDefaultReciter);

  const isCurrentSurahPlaying = currentTrack?.surahId === surahId;
  const activePlaying = isCurrentSurahPlaying && isPlaying;
  const activeAyah = currentTrack?.ayahNumber ?? 1;

  const currentReciterObj =
    RECITERS_ARRAY.find((r) => r.id === defaultReciter) ?? RECITERS_ARRAY[0];

  const handleTogglePlayback = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activePlaying) {
      await pause();
    } else if (isReady && currentTrack?.surahId === surahId) {
      await play();
    } else if (surahId) {
      await playAyah(surahId, activeAyah, defaultReciter);
    }
  };

  const handlePrevious = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void previous();
  };

  const handleNext = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void next();
  };

  const handleCycleSpeed = () => {
    void Haptics.selectionAsync();
    void cycleSpeed();
  };

  const handleCycleRepeat = () => {
    void Haptics.selectionAsync();
    cycleRepeatCount();
  };

  const handleCycleReciter = () => {
    void Haptics.selectionAsync();
    const currIdx = RECITERS_ARRAY.findIndex((r) => r.id === defaultReciter);
    const nextIdx = (currIdx + 1) % RECITERS_ARRAY.length;
    const nextReciter = RECITERS_ARRAY[nextIdx];
    setDefaultReciter(nextReciter.id);
    if (activePlaying && surahId) {
      void playAyah(surahId, activeAyah, nextReciter.id);
    }
  };

  const handleOpenFullPlayer = () => {
    void Haptics.selectionAsync();
    const current = useAudioStore.getState().currentTrack;
    if (!current || (surahId && current.surahId !== surahId)) {
      if (surahId) {
        useAudioStore.getState().setCurrentTrack({
          surahId,
          ayahNumber: activeAyah,
          reciter: defaultReciter,
        });
      }
    }
    useAudioStore.getState().setFullScreenPlayerVisible(true);
  };

  const progress =
    duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;

  const repeatLabel = repeatCount === Infinity ? '∞' : repeatCount + 'x';
  const isRepeating = repeatCount > 1;

  const isClosing = React.useRef(false);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleClose = () => {
    if (isClosing.current) return;
    isClosing.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    translateY.value = withTiming(100, { duration: 240 });
    opacity.value = withTiming(0, { duration: 240 });

    setTimeout(async () => {
      await stopAudio();
      translateY.value = 0;
      opacity.value = 1;
      isClosing.current = false;
    }, 250);
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          bottom: Math.max(insets.bottom, 12) + 6,
          paddingHorizontal: spacing.sm,
        },
        animStyle,
      ]}
    >
      <GlassView borderRadius={radius.xl} style={styles.container}>
        {/* Top Info Row */}
        <View style={styles.topRow}>
          <Pressable
            onPress={handleOpenFullPlayer}
            style={styles.reciterButton}
            accessibilityLabel={t('quran.openPlayer', 'Открыть плеер')}
            accessibilityRole="button"
          >
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleCycleReciter();
              }}
              hitSlop={8}
              style={[
                styles.iconBadge,
                { backgroundColor: colors.primary + '18' },
              ]}
              accessibilityLabel="Сменить чтеца"
            >
              <Ionicons name="headset" size={13} color={colors.primary} />
            </Pressable>
            <View style={{ flexShrink: 1 }}>
              <View style={styles.reciterTitleRow}>
                <Text
                  style={[styles.reciterName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {currentReciterObj.name}
                </Text>
                <Ionicons
                  name="chevron-up"
                  size={12}
                  color={colors.primary}
                  style={{ marginStart: 3 }}
                />
              </View>
              <Text
                style={[styles.ayahIndicator, { color: colors.textSecondary }]}
              >
                {surahName ? surahName + ' • ' : ''}
                {t('quran.ayah')} {activeAyah}
                {totalAyahs ? ' / ' + totalAyahs : ''}
              </Text>
            </View>
          </Pressable>

          {/* Speed & Repeat Quick Controls */}
          <View style={styles.quickOptionsRow}>
            {/* Speed Badge */}
            <Pressable
              onPress={handleCycleSpeed}
              style={[
                styles.optionPill,
                {
                  backgroundColor:
                    speed !== 1.0
                      ? colors.secondary + '26'
                      : isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.05)',
                  borderColor:
                    speed !== 1.0 ? colors.secondary : 'transparent',
                },
              ]}
            >
              <Ionicons
                name="speedometer-outline"
                size={12}
                color={speed !== 1.0 ? colors.secondary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.optionPillText,
                  {
                    color:
                      speed !== 1.0 ? colors.secondary : colors.textSecondary,
                  },
                ]}
              >
                {speed}x
              </Text>
            </Pressable>

            {/* Repeat Count Badge */}
            <Pressable
              onPress={handleCycleRepeat}
              style={[
                styles.optionPill,
                {
                  backgroundColor: isRepeating
                    ? colors.primary + '22'
                    : isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.05)',
                  borderColor: isRepeating ? colors.primary : 'transparent',
                },
              ]}
            >
              <Ionicons
                name="repeat"
                size={12}
                color={isRepeating ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.optionPillText,
                  {
                    color: isRepeating ? colors.primary : colors.textSecondary,
                    fontWeight: isRepeating ? '700' : '600',
                  },
                ]}
              >
                {repeatLabel}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Timeline Progress Bar */}
        <Pressable
          onPress={handleOpenFullPlayer}
          style={styles.progressSection}
          accessibilityLabel="Открыть таймлайн плеера"
        >
          <Text style={[styles.timeText, { color: colors.textTertiary }]}>
            {formatTime(position)}
          </Text>
          <View
            style={[
              styles.progressBarTrack,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.06)',
              },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: ((progress * 100) + '%') as DimensionValue,
                  backgroundColor: colors.secondary,
                },
              ]}
            />
          </View>
          <Text style={[styles.timeText, { color: colors.textTertiary }]}>
            {formatTime(duration)}
          </Text>
        </Pressable>

        {/* Playback Controls Row */}
        <View style={styles.controlsRow}>
          {/* Active Repeat Indicator */}
          <View style={styles.leftStatusCol}>
            {isRepeating && (
              <View
                style={[
                  styles.repeatStatusBadge,
                  { backgroundColor: colors.primary + '18' },
                ]}
              >
                <Text
                  style={[styles.repeatStatusText, { color: colors.primary }]}
                >
                  {repeatCount === Infinity
                    ? 'Повтор ∞'
                    : 'Повтор ' + currentRepeatIndex + '/' + repeatCount}
                </Text>
              </View>
            )}
          </View>

          {/* Center Playback Buttons: Prev, Play/Pause, Next */}
          <View style={styles.centerButtons}>
            <AnimatedPressable
              onPress={handlePrevious}
              style={styles.skipButton}
              accessibilityLabel="Previous ayah"
            >
              <Ionicons
                name="play-skip-back"
                size={20}
                color={colors.text}
              />
            </AnimatedPressable>

            {/* Main Play / Pause Button */}
            <AnimatedPressable onPress={handleTogglePlayback}>
              <LinearGradient
                colors={['#1DCF90', '#0D6B4E', '#06422F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.playButton, { borderRadius: radius.full }]}
              >
                <Ionicons
                  name={activePlaying ? 'pause' : 'play'}
                  size={22}
                  color="#FFFFFF"
                  style={!activePlaying && styles.playIconOffset}
                />
              </LinearGradient>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={handleNext}
              style={styles.skipButton}
              accessibilityLabel="Next ayah"
            >
              <Ionicons
                name="play-skip-forward"
                size={20}
                color={colors.text}
              />
            </AnimatedPressable>
          </View>

          {/* Close button on right */}
          <View style={styles.rightStatusCol}>
            <AnimatedPressable
              onPress={handleClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.05)',
                },
              ]}
              accessibilityLabel="Stop audio"
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </AnimatedPressable>
          </View>
        </View>
      </GlassView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    start: 0,
    end: 0,
    zIndex: 999,
  },
  container: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reciterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginEnd: 8,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 8,
  },
  reciterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reciterName: {
    fontSize: 13,
    fontWeight: '700',
  },
  ayahIndicator: {
    fontSize: 11,
    marginTop: 1,
  },
  quickOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
  },
  optionPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    width: 28,
  },
  progressBarTrack: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftStatusCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  repeatStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  repeatStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  centerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rightStatusCol: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D6B4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  playIconOffset: {
    marginStart: 2,
  },
});
