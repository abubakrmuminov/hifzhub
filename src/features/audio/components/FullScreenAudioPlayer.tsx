import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Dimensions,
  PanResponder,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useAudioStore } from '@/stores/audioStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePlayer } from '../hooks/usePlayer';
import { ReciterPicker, RECITERS_LIST } from './ReciterPicker';
import { SURAHS_DATA } from '@/features/quran/data/surahsData';
import { getSurahName } from '@/features/quran/utils/quranUtils';
import { getAyahCountForSurah, setSleepTimer } from '../services/trackPlayer';
import { fullScreenAudioPlayerStyles as styles } from './fullScreenAudioPlayerStyles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const REPEAT_CYCLE = [1, 2, 3, 5, 10, Infinity] as const;

const SLEEP_OPTIONS = [
  { value: null, labelRu: 'Выключен', labelUz: "O'chirilgan" },
  { value: 15, labelRu: '15 минут', labelUz: '15 daqiqa' },
  { value: 30, labelRu: '30 минут', labelUz: '30 daqiqa' },
  { value: 45, labelRu: '45 минут', labelUz: '45 daqiqa' },
  { value: 60, labelRu: '60 минут', labelUz: '60 daqiqa' },
] as const;

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const formatRemainingTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '-0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `-${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const FullScreenAudioPlayer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors, radius, shadows, fontFamilies, isDark } = useTheme();

  const isFullPlayerVisible = useAudioStore((s) => s.isFullPlayerVisible);
  const setFullPlayerVisible = useAudioStore((s) => s.setFullPlayerVisible);
  const currentTrack = useAudioStore((s) => s.currentTrack);
  const repeatAyahTarget = useAudioStore((s) => s.repeatAyahTarget);
  const setRepeatAyahTarget = useAudioStore((s) => s.setRepeatAyahTarget);
  const currentRepeatIndex = useAudioStore((s) => s.currentRepeatIndex);
  const sleepTimerMinutes = useAudioStore((s) => s.sleepTimerMinutes);
  const sleepTimerEndTime = useAudioStore((s) => s.sleepTimerEndTime);
  const setSleepTimer = useAudioStore((s) => s.setSleepTimer);

  const language = useSettingsStore((s) => s.language);

  const {
    isPlaying,
    position,
    duration,
    speed,
    cycleSpeed,
    play,
    pause,
    next,
    previous,
    seekTo,
  } = usePlayer();

  // Lifecycle & Animation Values
  const [isMounted, setIsMounted] = useState(false);
  const [isReciterPickerVisible, setIsReciterPickerVisible] = useState(false);
  const [isSleepModalVisible, setIsSleepModalVisible] = useState(false);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // Scrubber scrubbing state
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);
  const scrubPositionRef = useRef(0);
  scrubPositionRef.current = scrubPosition;

  const trackMeasurements = useRef({ pageX: 0, width: 1 });
  const trackViewRef = useRef<View>(null);

  // Sleep Timer countdown calculation
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  useEffect(() => {
    if (!sleepTimerEndTime) {
      setRemainingSeconds(0);
      return;
    }
    const update = () => {
      const diff = Math.max(0, Math.floor((sleepTimerEndTime - Date.now()) / 1000));
      setRemainingSeconds(diff);
      if (diff <= 0) {
        setSleepTimer(null);
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [sleepTimerEndTime, setSleepTimer]);

  const handleDismiss = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    backdropOpacity.value = withTiming(0, { duration: 220 });
    translateY.value = withTiming(
      SCREEN_HEIGHT,
      { duration: 260, easing: Easing.in(Easing.cubic) },
      () => {
        runOnJS(setFullPlayerVisible)(false);
        runOnJS(setIsMounted)(false);
      }
    );
  }, [backdropOpacity, translateY, setFullPlayerVisible]);

  useEffect(() => {
    if (isFullPlayerVisible) {
      setIsMounted(true);
      translateY.value = SCREEN_HEIGHT;
      translateY.value = withTiming(0, {
        duration: 320,
        easing: Easing.out(Easing.cubic),
      });
      backdropOpacity.value = withTiming(1, { duration: 280 });
    } else if (isMounted) {
      handleDismiss();
    }
  }, [isFullPlayerVisible]);

  // Pan Responder on Drag Handle / Header to dismiss on swipe down
  const headerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            translateY.value = gesture.dy;
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 120 || gesture.vy > 0.8) {
            handleDismiss();
          } else {
            translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
          }
        },
      }),
    [translateY, handleDismiss]
  );

  // Scrubber measure and Pan Responder for Seek
  const measureTrack = useCallback(() => {
    trackViewRef.current?.measure((x, y, width, height, pageX) => {
      if (width > 0) {
        trackMeasurements.current = { pageX, width };
      }
    });
  }, []);

  const scrubberPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          if (!duration || duration <= 0) return;
          measureTrack();
          setIsScrubbing(true);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          const touchX = evt.nativeEvent.pageX - trackMeasurements.current.pageX;
          const ratio = Math.max(0, Math.min(1, touchX / trackMeasurements.current.width));
          const target = ratio * duration;
          setScrubPosition(target);
        },
        onPanResponderMove: (evt) => {
          if (!duration || duration <= 0) return;
          const touchX = evt.nativeEvent.pageX - trackMeasurements.current.pageX;
          const ratio = Math.max(0, Math.min(1, touchX / trackMeasurements.current.width));
          const target = ratio * duration;
          setScrubPosition(target);
        },
        onPanResponderRelease: async () => {
          if (!duration || duration <= 0) {
            setIsScrubbing(false);
            return;
          }
          setIsScrubbing(false);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await seekTo(scrubPositionRef.current);
        },
      }),
    [duration, seekTo, measureTrack]
  );

  // Playback handlers
  const handleTogglePlayPause = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  };

  const handlePrevious = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await previous();
  };

  const handleNext = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await next();
  };

  // Hifz Repeat cycling: 1x -> 2x -> 3x -> 5x -> 10x -> ∞
  const handleCycleRepeat = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = repeatAyahTarget || 1;
    const idx = REPEAT_CYCLE.indexOf(current as (typeof REPEAT_CYCLE)[number]);
    const nextIdx = (idx + 1) % REPEAT_CYCLE.length;
    const nextVal = REPEAT_CYCLE[nextIdx];
    setRepeatAyahTarget(nextVal);
  };

  // Speed cycling: 0.75x -> 1.0x -> 1.25x -> 1.5x
  const handleCycleSpeed = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await cycleSpeed();
  };

  // Animated Styles
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!isMounted || !currentTrack) {
    return null;
  }

  // Surah & Track Metadata
  const surah = SURAHS_DATA.find((s) => s.id === currentTrack.surahId) ?? null;
  const totalAyahs = surah?.ayahCount ?? getAyahCountForSurah(currentTrack.surahId);
  const rawSurahName = surah
    ? getSurahName(surah.nameTranslation, language)
    : `Сура ${currentTrack.surahId}`;
  const localizedSurahName = rawSurahName.startsWith('Сура')
    ? rawSurahName
    : `Сура ${rawSurahName}`;

  const reciterObj = RECITERS_LIST.find(
    (r) => r.id === currentTrack.reciter || r.id.replace('ar.', '') === currentTrack.reciter
  );
  const activeReciterName = reciterObj
    ? language === 'uz'
      ? reciterObj.uzbekName
      : reciterObj.russianName
    : currentTrack.reciter;

  // Active Ayah text display
  const ayahIndicatorText =
    language === 'uz'
      ? `${currentTrack.ayahNumber} / ${totalAyahs} oyat`
      : `Аят ${currentTrack.ayahNumber} из ${totalAyahs}`;

  // Scrubber positions
  const displayPos = isScrubbing ? scrubPosition : position;
  const progressRatio = duration > 0 ? Math.max(0, Math.min(1, displayPos / duration)) : 0;
  const progressPercent = `${Math.round(progressRatio * 1000) / 10}%` as const;

  // Repeat Badge
  const repeatBadge = repeatAyahTarget === Infinity ? '∞' : `${repeatAyahTarget}x`;
  const isRepeatingActive = repeatAyahTarget > 1;

  // Sleep Timer Badge
  const sleepTimerBadge = sleepTimerMinutes
    ? remainingSeconds > 0
      ? `${Math.ceil(remainingSeconds / 60)}м`
      : `${sleepTimerMinutes}м`
    : language === 'uz'
    ? "O'chiq"
    : 'Выкл';

  return (
    <Modal
      visible={isMounted}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop Scrim */}
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        </Animated.View>

        {/* Slide-Up Sheet Container */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? '#0C101A' : '#FAFCFB',
              borderTopLeftRadius: 36,
              borderTopRightRadius: 36,
            },
            sheetAnimatedStyle,
          ]}
        >
          {/* Background Spiritual Ambient Gradients */}
          <LinearGradient
            colors={
              isDark
                ? ['rgba(13, 107, 78, 0.28)', 'rgba(212, 175, 55, 0.08)', 'transparent']
                : ['rgba(29, 207, 144, 0.18)', 'rgba(212, 175, 55, 0.08)', 'transparent']
            }
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.6 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View
            style={[
              styles.safeArea,
              {
                paddingTop: Math.max(insets.top, 14) + 6,
                paddingBottom: Math.max(insets.bottom, 16) + 12,
              },
            ]}
          >
            {/* Drag Handle & Header */}
            <View {...headerPanResponder.panHandlers}>
              <View style={styles.dragHandleArea}>
                <View
                  style={[
                    styles.dragHandleIndicator,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.22)'
                        : 'rgba(0, 0, 0, 0.15)',
                    },
                  ]}
                />
              </View>

              <View style={styles.header}>
                <AnimatedPressable
                  onPress={handleDismiss}
                  haptic="light"
                  style={[
                    styles.dismissButton,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                  accessibilityLabel="Close player"
                >
                  <Ionicons name="chevron-down" size={24} color={colors.text} />
                </AnimatedPressable>

                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {language === 'uz' ? 'Ijro' : 'Воспроизведение'}
                </Text>

                <View style={styles.headerRightSpacer} />
              </View>
            </View>

            {/* Center Visual: Emerald / Gold Glass Card */}
            <View style={styles.centerVisualContainer}>
              <View style={[styles.visualCardOuter, shadows.medium]}>
                <LinearGradient
                  colors={
                    isDark
                      ? [
                          'rgba(18, 38, 32, 0.95)',
                          'rgba(14, 26, 24, 0.92)',
                          'rgba(10, 16, 20, 0.96)',
                        ]
                      : [
                          'rgba(240, 253, 248, 0.98)',
                          'rgba(246, 252, 248, 0.95)',
                          'rgba(255, 255, 255, 0.98)',
                        ]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.visualCardGradient,
                    {
                      borderColor: isDark
                        ? 'rgba(212, 175, 55, 0.28)'
                        : 'rgba(13, 107, 78, 0.14)',
                    },
                  ]}
                >
                  {/* Subtle Gold Aura Sheen */}
                  <LinearGradient
                    colors={
                      isDark
                        ? ['rgba(212, 175, 55, 0.12)', 'transparent']
                        : ['rgba(212, 175, 55, 0.16)', 'transparent']
                    }
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />

                  {/* Top Tag: Surah Number & Revelation */}
                  <View style={styles.surahTagRow}>
                    <View
                      style={[
                        styles.surahTagPill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(212, 175, 55, 0.16)'
                            : 'rgba(212, 175, 55, 0.14)',
                        },
                      ]}
                    >
                      <Ionicons name="sparkles" size={12} color="#D4AF37" />
                      <Text style={styles.surahTagText}>
                        {language === 'uz'
                          ? `${currentTrack.surahId}-SURA`
                          : `СУРА ${currentTrack.surahId}`}
                      </Text>
                    </View>

                    {surah?.revelationType ? (
                      <Text
                        style={[
                          styles.revelationText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {surah.revelationType === 'Meccan'
                          ? language === 'uz'
                            ? 'Makkiy'
                            : 'Мекканская'
                          : language === 'uz'
                          ? 'Madaniy'
                          : 'Мединская'}
                      </Text>
                    ) : null}
                  </View>

                  {/* Big Surah Arabic Calligraphy */}
                  <View style={styles.arabicNameContainer}>
                    <Text
                      style={[
                        styles.arabicSurahName,
                        {
                          color: isDark ? '#1DCF90' : '#0D6B4E',
                          fontFamily: fontFamilies.arabic,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {surah?.nameArabic ?? ''}
                    </Text>
                  </View>

                  {/* Localized Surah Title */}
                  <Text
                    style={[styles.surahLocalizedTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {localizedSurahName}
                  </Text>

                  {/* Ayah Indicator */}
                  <Text
                    style={[styles.ayahCountText, { color: colors.primary }]}
                  >
                    {ayahIndicatorText}
                  </Text>

                  {/* Reciter Badge with Microphone Icon */}
                  <AnimatedPressable
                    onPress={() => setIsReciterPickerVisible(true)}
                    haptic="light"
                    style={[
                      styles.reciterBadgePill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(13, 107, 78, 0.08)',
                      },
                    ]}
                  >
                    <Ionicons name="mic" size={14} color={colors.primary} />
                    <Text
                      style={[styles.reciterBadgeText, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {activeReciterName}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={13}
                      color={colors.textTertiary}
                    />
                  </AnimatedPressable>
                </LinearGradient>
              </View>
            </View>

            {/* Interactive Scrubber Section */}
            <View style={styles.scrubberSection}>
              <View
                style={styles.progressTouchArea}
                onLayout={measureTrack}
                {...scrubberPanResponder.panHandlers}
              >
                <View
                  ref={trackViewRef}
                  style={[
                    styles.progressTrack,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.14)'
                        : 'rgba(0, 0, 0, 0.07)',
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#1DCF90', '#0D6B4E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.progressFill,
                      { width: progressPercent },
                    ]}
                  />
                </View>

                {/* Scrubber Knob */}
                <View
                  style={[
                    styles.scrubberThumb,
                    {
                      left: progressPercent,
                      transform: [{ translateX: -7 }],
                    },
                  ]}
                />
              </View>

              {/* Time Indicators */}
              <View style={styles.timeLabelsRow}>
                <Text
                  style={[styles.timeText, { color: colors.textSecondary }]}
                >
                  {formatTime(displayPos)}
                </Text>
                <Text
                  style={[styles.timeText, { color: colors.textTertiary }]}
                >
                  {formatRemainingTime(duration - displayPos)}
                </Text>
              </View>
            </View>

            {/* Core Controls: Previous, Big Play/Pause, Next */}
            <View style={styles.coreControlsRow}>
              <AnimatedPressable
                onPress={handlePrevious}
                haptic="light"
                style={[
                  styles.secondaryControlButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
                accessibilityLabel="Previous ayah"
              >
                <Ionicons
                  name="play-skip-back"
                  size={26}
                  color={colors.text}
                />
              </AnimatedPressable>

              {/* Big Emerald 64px Play / Pause Button with Pulsing Glow */}
              <View style={styles.playButtonWrapper}>
                {isPlaying && (
                  <MotiView
                    from={{ opacity: 0.6, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.4 }}
                    transition={{
                      type: 'timing',
                      duration: 1300,
                      loop: true,
                    }}
                    style={styles.playPulseRing}
                  />
                )}
                <AnimatedPressable
                  onPress={handleTogglePlayPause}
                  haptic="medium"
                  scaleValue={0.93}
                  accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                >
                  <LinearGradient
                    colors={['#1DCF90', '#0D6B4E', '#06422F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.playButtonGradient}
                  >
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={28}
                      color="#FFFFFF"
                      style={!isPlaying && styles.playIconOffset}
                    />
                  </LinearGradient>
                </AnimatedPressable>
              </View>

              <AnimatedPressable
                onPress={handleNext}
                haptic="light"
                style={[
                  styles.secondaryControlButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
                accessibilityLabel="Next ayah"
              >
                <Ionicons
                  name="play-skip-forward"
                  size={26}
                  color={colors.text}
                />
              </AnimatedPressable>
            </View>

            {/* Hifz & Utility Row: Repeat, Speed, Sleep Timer, Reciter */}
            <View style={styles.utilityRow}>
              {/* 1. Hifz Repeat */}
              <AnimatedPressable
                onPress={handleCycleRepeat}
                haptic="light"
                style={[
                  styles.utilityPill,
                  {
                    backgroundColor: isRepeatingActive
                      ? isDark
                        ? 'rgba(29, 207, 144, 0.18)'
                        : 'rgba(13, 107, 78, 0.10)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isRepeatingActive
                      ? colors.primary
                      : 'transparent',
                  },
                ]}
              >
                <View style={styles.utilityIconWrapper}>
                  <Ionicons
                    name="repeat"
                    size={18}
                    color={isRepeatingActive ? colors.primary : colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.utilityBadgeText,
                    {
                      color: isRepeatingActive ? colors.primary : colors.text,
                    },
                  ]}
                >
                  {isRepeatingActive && currentRepeatIndex > 1
                    ? `${currentRepeatIndex}/${repeatBadge}`
                    : repeatBadge}
                </Text>
                <Text
                  style={[
                    styles.utilityLabelText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {language === 'uz' ? 'Takror' : 'Повтор'}
                </Text>
              </AnimatedPressable>

              {/* 2. Speed */}
              <AnimatedPressable
                onPress={handleCycleSpeed}
                haptic="light"
                style={[
                  styles.utilityPill,
                  {
                    backgroundColor:
                      speed !== 1.0
                        ? isDark
                          ? 'rgba(212, 175, 55, 0.18)'
                          : 'rgba(212, 175, 55, 0.12)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(0, 0, 0, 0.04)',
                    borderColor:
                      speed !== 1.0 ? '#D4AF37' : 'transparent',
                  },
                ]}
              >
                <View style={styles.utilityIconWrapper}>
                  <Ionicons
                    name="speedometer-outline"
                    size={18}
                    color={speed !== 1.0 ? '#D4AF37' : colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.utilityBadgeText,
                    {
                      color: speed !== 1.0 ? '#D4AF37' : colors.text,
                    },
                  ]}
                >
                  {speed}x
                </Text>
                <Text
                  style={[
                    styles.utilityLabelText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {language === 'uz' ? 'Tezlik' : 'Скорость'}
                </Text>
              </AnimatedPressable>

              {/* 3. Sleep Timer */}
              <AnimatedPressable
                onPress={() => setIsSleepModalVisible(true)}
                haptic="light"
                style={[
                  styles.utilityPill,
                  {
                    backgroundColor: sleepTimerMinutes
                      ? isDark
                        ? 'rgba(139, 92, 246, 0.22)'
                        : 'rgba(139, 92, 246, 0.12)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                    borderColor: sleepTimerMinutes
                      ? '#8B5CF6'
                      : 'transparent',
                  },
                ]}
              >
                <View style={styles.utilityIconWrapper}>
                  <Ionicons
                    name={sleepTimerMinutes ? 'moon' : 'moon-outline'}
                    size={18}
                    color={sleepTimerMinutes ? '#8B5CF6' : colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.utilityBadgeText,
                    {
                      color: sleepTimerMinutes ? '#8B5CF6' : colors.text,
                    },
                  ]}
                >
                  {sleepTimerBadge}
                </Text>
                <Text
                  style={[
                    styles.utilityLabelText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {language === 'uz' ? 'Taymer' : 'Таймер'}
                </Text>
              </AnimatedPressable>

              {/* 4. Reciter */}
              <AnimatedPressable
                onPress={() => setIsReciterPickerVisible(true)}
                haptic="light"
                style={[
                  styles.utilityPill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}
              >
                <View style={styles.utilityIconWrapper}>
                  <Ionicons
                    name="headset-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>
                <Text
                  style={[styles.utilityBadgeText, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {reciterObj?.id.replace('ar.', '') ?? 'Qori'}
                </Text>
                <Text
                  style={[
                    styles.utilityLabelText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {language === 'uz' ? 'Qori' : 'Чтец'}
                </Text>
              </AnimatedPressable>
            </View>
          </View>
        </Animated.View>

        {/* Reciter Picker Modal */}
        <ReciterPicker
          isVisible={isReciterPickerVisible}
          onClose={() => setIsReciterPickerVisible(false)}
        />

        {/* Interactive Sleep Timer Selector Dialog */}
        <Modal
          visible={isSleepModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsSleepModalVisible(false)}
        >
          <Pressable
            style={styles.sleepModalOverlay}
            onPress={() => setIsSleepModalVisible(false)}
          >
            <Pressable
              style={[
                styles.sleepCard,
                {
                  backgroundColor: isDark ? '#1A1E2E' : '#FFFFFF',
                },
                shadows.strong,
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.sleepCardHeader}>
                <Text
                  style={[styles.sleepCardTitle, { color: colors.text }]}
                >
                  {language === 'uz' ? 'Uyqu taymeri' : 'Таймер сна'}
                </Text>
                <AnimatedPressable
                  onPress={() => setIsSleepModalVisible(false)}
                  haptic="light"
                >
                  <Feather
                    name="x"
                    size={20}
                    color={colors.textSecondary}
                  />
                </AnimatedPressable>
              </View>

              <View style={styles.sleepOptionsList}>
                {SLEEP_OPTIONS.map((opt) => {
                  const isSelected = sleepTimerMinutes === opt.value;
                  const label = language === 'uz' ? opt.labelUz : opt.labelRu;

                  return (
                    <AnimatedPressable
                      key={String(opt.value)}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSleepTimer(opt.value);
                        setIsSleepModalVisible(false);
                      }}
                      haptic="light"
                      style={[
                        styles.sleepOptionRow,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(139, 92, 246, 0.2)'
                              : 'rgba(139, 92, 246, 0.08)'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.03)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sleepOptionText,
                          {
                            color: isSelected ? '#8B5CF6' : colors.text,
                          },
                        ]}
                      >
                        {label}
                      </Text>
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor: isSelected
                              ? '#8B5CF6'
                              : colors.textTertiary,
                          },
                        ]}
                      >
                        {isSelected && (
                          <View
                            style={[
                              styles.radioInner,
                              { backgroundColor: '#8B5CF6' },
                            ]}
                          />
                        )}
                      </View>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </Modal>
  );
};
