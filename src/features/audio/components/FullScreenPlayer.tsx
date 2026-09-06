import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  PanResponder,
  StyleSheet,
  Platform,
  BackHandler,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing,
  FadeIn,
  FadeOut,
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
import { getAyahCountForSurah } from '../services/trackPlayer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

// Mini-player capsule geometric bounds (bottom: 80, left: 16, right: 16, height: 64, borderRadius: 28)
const MINI_BOTTOM = 80;
const MINI_LEFT = 16;
const MINI_RIGHT = 16;
const MINI_HEIGHT = 64;
const MINI_WIDTH = SCREEN_WIDTH - (MINI_LEFT + MINI_RIGHT);
const MINI_TOP = SCREEN_HEIGHT - (MINI_BOTTOM + MINI_HEIGHT);
const MINI_RADIUS = 28;

// Liquid surface tension spring physics - tuned for ultra-smooth fluid expansion
const LIQUID_SPRING_CONFIG = {
  damping: 24,
  stiffness: 85,
  mass: 1.0,
} as const;

const DISMISS_SPRING_CONFIG = {
  damping: 26,
  stiffness: 95,
  mass: 0.9,
} as const;

const REPEAT_CYCLE = [1, 2, 3, 5, 10, Infinity] as const;

interface SleepOption {
  value: number | null;
  labelRu: string;
  labelUz: string;
}

const SLEEP_OPTIONS: SleepOption[] = [
  { value: null, labelRu: 'Выключен', labelUz: "O'chirilgan" },
  { value: 15, labelRu: '15 минут', labelUz: '15 daqiqa' },
  { value: 30, labelRu: '30 минут', labelUz: '30 daqiqa' },
  { value: 45, labelRu: '45 минут', labelUz: '45 daqiqa' },
  { value: 60, labelRu: '60 минут', labelUz: '60 daqiqa' },
  { value: -1, labelRu: 'Конец суры', labelUz: 'Sura oxirigacha' },
];

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

export const FullScreenPlayer: React.FC = () => {
  const visible = useAudioStore((s) => s.isFullScreenPlayerVisible || s.isFullPlayerVisible);
  const [retained, setRetained] = useState(false);
  useEffect(() => {
    if (visible) { setRetained(true); return; }
    const timeout = setTimeout(() => setRetained(false), 300);
    return () => clearTimeout(timeout);
  }, [visible]);
  return visible || retained ? <FullScreenPlayerContent /> : null;
};

const FullScreenPlayerContent: React.FC = () => {
  const insets = useSafeAreaInsets();
  const miniBottom = Math.max(insets.bottom, 10) + 76;
  const miniTop = SCREEN_HEIGHT - (miniBottom + MINI_HEIGHT);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useTranslation();
  const { colors, radius, shadows, fontFamilies, isDark } = useTheme();

  const isFullScreenPlayerVisible = useAudioStore(
    (s) => s.isFullScreenPlayerVisible || s.isFullPlayerVisible
  );
  const setFullScreenPlayerVisible = useAudioStore(
    (s) => s.setFullScreenPlayerVisible
  );
  const currentTrack = useAudioStore((s) => s.currentTrack);
  const repeatAyahTarget = useAudioStore((s) => s.repeatAyahTarget);
  const setRepeatAyahTarget = useAudioStore((s) => s.setRepeatAyahTarget);
  const currentRepeatIndex = useAudioStore((s) => s.currentRepeatIndex);
  const sleepTimerMinutes = useAudioStore((s) => s.sleepTimerMinutes);
  const sleepTimerEndTime = useAudioStore((s) => s.sleepTimerEndTime);
  const setSleepTimer = useAudioStore((s) => s.setSleepTimer);
  const loopRange = useAudioStore((s) => s.loopRange);
  const setLoopRange = useAudioStore((s) => s.setLoopRange);

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

  // Lifecycle states
  const [isMounted, setIsMounted] = useState(false);
  const [isReciterPickerVisible, setIsReciterPickerVisible] = useState(false);
  const [isSleepModalVisible, setIsSleepModalVisible] = useState(false);
  const [isRangeModalVisible, setIsRangeModalVisible] = useState(false);

  // Range loop temporary states
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(5);

  // Animation shared values: 0 = collapsed in mini-player capsule, 1 = full screen droplet
  const expandProgress = useSharedValue(0);
  const squeezeScale = useSharedValue(1);

  // Timeline Scrubbing state
  const [isScrubbing, setIsScrubbing] = useState(false);
  const isScrubbingRef = useRef(false);
  const [scrubPosition, setScrubPosition] = useState(0);
  const scrubPositionRef = useRef(0);
  const trackWidthRef = useRef<number>(SCREEN_WIDTH - 40);
  const startScrubX = useRef<number>(0);

  // Sleep Timer countdown calculation
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  useEffect(() => {
    if (!sleepTimerEndTime || sleepTimerMinutes === -1) {
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
  }, [sleepTimerEndTime, sleepTimerMinutes, setSleepTimer]);

  // Touch squeeze impulse: scale down briefly to 0.96 with liquid surface tension physics
  const triggerSqueeze = useCallback(() => {
    squeezeScale.value = withTiming(0.96, { duration: 60 }, () => {
      squeezeScale.value = withSpring(1, LIQUID_SPRING_CONFIG);
    });
  }, [squeezeScale]);

  // Core dismiss function with custom duration, easing & safety timeout
  const executeDismiss = useCallback(
    (customDuration: number = 220) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
      expandProgress.value = withTiming(
        0,
        { duration: customDuration, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) {
            runOnJS(setFullScreenPlayerVisible)(false);
            runOnJS(setIsMounted)(false);
          }
        }
      );
      // Instant safety fallback: force unmount so no ghost capsule lingers
      dismissTimeoutRef.current = setTimeout(() => {
        setFullScreenPlayerVisible(false);
        setIsMounted(false);
      }, customDuration + 50);
    },
    [expandProgress, setFullScreenPlayerVisible]
  );

  // Zero-argument handler for onPress / BackHandler / backdrop
  const handleDismiss = useCallback(() => {
    executeDismiss(220);
  }, [executeDismiss]);

  // Synchronize modal mounting and expansion
  useEffect(() => {
    if (isFullScreenPlayerVisible) {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
      setIsMounted(true);
      expandProgress.value = 0;
      squeezeScale.value = 1;
      expandProgress.value = withSpring(1, LIQUID_SPRING_CONFIG);
    } else if (isMounted) {
      handleDismiss();
    }
    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [isFullScreenPlayerVisible, isMounted, handleDismiss]);

  // Android Back Handler: closes sub-modals or full player smoothly
  useEffect(() => {
    if (!isMounted || !isFullScreenPlayerVisible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isReciterPickerVisible) {
        setIsReciterPickerVisible(false);
        return true;
      }
      if (isSleepModalVisible) {
        setIsSleepModalVisible(false);
        return true;
      }
      if (isRangeModalVisible) {
        setIsRangeModalVisible(false);
        return true;
      }
      handleDismiss();
      return true;
    });
    return () => sub.remove();
  }, [
    isMounted,
    isFullScreenPlayerVisible,
    isReciterPickerVisible,
    isSleepModalVisible,
    isRangeModalVisible,
    handleDismiss,
  ]);

  // Screen Pan Responder: allows swiping down anywhere on the screen (header, artwork, body) to dismiss
  const screenPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponderCapture: (_, gesture) => {
          if (isScrubbingRef.current) return false;
          if (isReciterPickerVisible || isSleepModalVisible || isRangeModalVisible) return false;
          return gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.2;
        },
        onMoveShouldSetPanResponder: (_, gesture) => {
          if (isScrubbingRef.current) return false;
          if (isReciterPickerVisible || isSleepModalVisible || isRangeModalVisible) return false;
          return gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.2;
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            const p = Math.max(0, Math.min(1, 1 - gesture.dy / (SCREEN_HEIGHT * 0.45)));
            expandProgress.value = p;
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 80 || gesture.vy > 0.5) {
            const duration = gesture.vy > 1.0 ? 160 : 220;
            executeDismiss(duration);
          } else {
            expandProgress.value = withSpring(1, LIQUID_SPRING_CONFIG);
          }
        },
        onPanResponderTerminate: () => {
          expandProgress.value = withSpring(1, LIQUID_SPRING_CONFIG);
        },
      }),
    [
      expandProgress,
      executeDismiss,
      isReciterPickerVisible,
      isSleepModalVisible,
      isRangeModalVisible,
    ]
  );

  const scrubberPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          if (!duration || duration <= 0) return;
          isScrubbingRef.current = true;
          setIsScrubbing(true);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          const touchX = Math.max(0, Math.min(trackWidthRef.current, evt.nativeEvent.locationX));
          startScrubX.current = touchX;
          const trackWidth = trackWidthRef.current;
          if (trackWidth > 0) {
            const ratio = Math.max(0, Math.min(1, touchX / trackWidth));
            const target = ratio * duration;
            scrubPositionRef.current = target;
            setScrubPosition(target);
          }
        },
        onPanResponderMove: (_, gestureState) => {
          if (!duration || duration <= 0) return;
          const trackWidth = trackWidthRef.current;
          if (trackWidth > 0) {
            const currentX = Math.max(
              0,
              Math.min(trackWidth, startScrubX.current + gestureState.dx)
            );
            const ratio = Math.max(0, Math.min(1, currentX / trackWidth));
            const target = ratio * duration;
            scrubPositionRef.current = target;
            setScrubPosition(target);
          }
        },
        onPanResponderRelease: async () => {
          isScrubbingRef.current = false;
          if (!duration || duration <= 0) {
            setIsScrubbing(false);
            return;
          }
          setIsScrubbing(false);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await seekTo(scrubPositionRef.current);
        },
        onPanResponderTerminate: () => {
          isScrubbingRef.current = false;
          setIsScrubbing(false);
        },
      }),
    [duration, seekTo]
  );

  // Playback control handlers
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

  const handleRewind10 = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const target = Math.max(0, position - 10);
    await seekTo(target);
  };

  const handleForward10 = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const target = Math.min(duration, position + 10);
    await seekTo(target);
  };

  // Cycle Repeat: 1x -> 2x -> 3x -> 5x -> 10x -> ∞
  const handleCycleRepeat = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = repeatAyahTarget || 1;
    const idx = REPEAT_CYCLE.indexOf(current as (typeof REPEAT_CYCLE)[number]);
    const nextIdx = (idx + 1) % REPEAT_CYCLE.length;
    const nextVal = REPEAT_CYCLE[nextIdx];
    setRepeatAyahTarget(nextVal);
  };

  // Cycle Speed: 0.75x -> 1.0x -> 1.25x -> 1.5x
  const handleCycleSpeed = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await cycleSpeed();
  };

  // Animated Droplet Morph Style: top/bottom/left/right/borderRadius morphing & crossfade
  const dropletAnimatedStyle = useAnimatedStyle(() => {
    const p = expandProgress.value;

    const top = interpolate(p, [0, 1], [miniTop, 0], Extrapolation.CLAMP);
    const bottom = interpolate(p, [0, 1], [miniBottom, 0], Extrapolation.CLAMP);
    const left = interpolate(p, [0, 1], [MINI_LEFT, 0], Extrapolation.CLAMP);
    const right = interpolate(p, [0, 1], [MINI_RIGHT, 0], Extrapolation.CLAMP);

    // Morphing borderRadius: 28 -> 36 -> 0
    const bRadius = interpolate(p, [0, 0.45, 1], [MINI_RADIUS, 36, 0], Extrapolation.CLAMP);

    // Fast dissolve near bottom: below 0.18 it crossfades smoothly into the real mini-player
    const opacity = interpolate(p, [0.03, 0.18], [0, 1], Extrapolation.CLAMP);

    return {
      position: 'absolute',
      top,
      bottom,
      left,
      right,
      borderRadius: bRadius,
      opacity,
      overflow: 'hidden',
    };
  });

  // Inner Content bloom & fade during expansion
  const contentAnimatedStyle = useAnimatedStyle(() => {
    const p = expandProgress.value;
    const opacity = interpolate(p, [0.35, 0.8, 1], [0, 0.5, 1], Extrapolation.CLAMP);
    const scale = interpolate(p, [0, 1], [0.93, 1], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  // Backdrop overlay fade
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expandProgress.value, [0, 1], [0, 0.7], Extrapolation.CLAMP),
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
    : language === 'uz'
    ? `${rawSurahName} surasi`
    : `Сура ${rawSurahName}`;

  // Reciter display name
  const reciterObj = RECITERS_LIST.find(
    (r) => r.id === currentTrack.reciter || r.id.replace('ar.', '') === currentTrack.reciter
  );
  const activeReciterName = reciterObj
    ? language === 'uz'
      ? reciterObj.uzbekName
      : reciterObj.russianName
    : currentTrack.reciter;

  // Juz Number
  const juzNumber = surah?.juzStart ?? 1;
  const juzDisplay =
    language === 'uz' ? `${juzNumber}-juz` : `${juzNumber}-й Джуз`;

  // Revelation type
  const revelationDisplay = surah?.revelationType
    ? surah.revelationType === 'Meccan'
      ? language === 'uz'
        ? 'Makkiy'
        : 'Мекканская'
      : language === 'uz'
      ? 'Madaniy'
      : 'Мединская'
    : '';

  // Active Ayah text display
  const ayahIndicatorText =
    language === 'uz'
      ? `${currentTrack.ayahNumber} / ${totalAyahs} oyat`
      : `Аят ${currentTrack.ayahNumber} из ${totalAyahs}`;

  // Scrubber display values
  const displayPos = isScrubbing ? scrubPosition : position;
  const progressRatio = duration > 0 ? Math.max(0, Math.min(1, displayPos / duration)) : 0;
  const progressPercent = `${Math.round(progressRatio * 1000) / 10}%` as const;

  // Repeat Badge
  const repeatBadge = repeatAyahTarget === Infinity ? '∞' : `${repeatAyahTarget}x`;
  const isRepeatingActive = repeatAyahTarget > 1;

  // Sleep Timer Badge
  const sleepTimerBadge =
    sleepTimerMinutes === -1
      ? language === 'uz'
        ? 'Sura oxiri'
        : 'Конец суры'
      : sleepTimerMinutes
      ? remainingSeconds > 0
        ? `${Math.ceil(remainingSeconds / 60)}м`
        : `${sleepTimerMinutes}м`
      : language === 'uz'
      ? "O'chiq"
      : 'Выкл';

  // Range Loop Active Badge
  const isRangeActive = Boolean(loopRange && loopRange.startAyah && loopRange.endAyah);
  const rangeBadge = isRangeActive
    ? `${loopRange!.startAyah}-${loopRange!.endAyah}`
    : language === 'uz'
    ? 'Oraliq'
    : 'Диапазон';

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 99999,
          elevation: Platform.OS === 'android' ? 99999 : undefined,
        },
      ]}
      pointerEvents="auto"
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop Scrim */}
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        </Animated.View>

        {/* Liquid Droplet Capsule (Morphs from bottom mini capsule to full-screen) */}
        <Animated.View
          style={[
            styles.dropletContainer,
            {
              backgroundColor: isDark ? '#0A1118' : '#FAFCFB',
            },
            dropletAnimatedStyle,
          ]}
        >
          {/* Spiritual Ambient Background Gradients */}
          <LinearGradient
            colors={
              isDark
                ? [
                    'rgba(13, 107, 78, 0.35)',
                    'rgba(212, 175, 55, 0.12)',
                    'rgba(10, 17, 24, 0.95)',
                    '#070D12',
                  ]
                : [
                    'rgba(29, 207, 144, 0.22)',
                    'rgba(212, 175, 55, 0.10)',
                    'rgba(242, 252, 247, 0.98)',
                    '#FFFFFF',
                  ]
            }
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Inner Content Area - responsive to swipe down anywhere to dismiss */}
          <Animated.View
            style={[
              styles.contentWrapper,
              {
                paddingTop: Math.max(insets.top, 38) + 10,
                paddingBottom: Math.max(insets.bottom, 24) + 16,
              },
              contentAnimatedStyle,
            ]}
            {...screenPanResponder.panHandlers}
          >
            {/* Header with Gesture Handle & Sleep Timer */}
            <View style={styles.headerArea}>
              <View style={styles.dragPillWrapper}>
                <View
                  style={[
                    styles.dragPill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.25)'
                        : 'rgba(0, 0, 0, 0.18)',
                    },
                  ]}
                />
              </View>

              <View style={styles.headerBar}>
                <AnimatedPressable
                  onPress={handleDismiss}
                  haptic="light"
                  style={[
                    styles.circleHeaderButton,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                  accessibilityLabel="Close audio player"
                >
                  <Ionicons name="chevron-down" size={22} color={colors.text} />
                </AnimatedPressable>

                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {language === 'uz' ? 'Ijro' : 'Воспроизведение'}
                </Text>

                {/* Sleep Timer Quick Access Badge */}
                <AnimatedPressable
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsSleepModalVisible(true);
                  }}
                  haptic="light"
                  style={[
                    styles.sleepHeaderBadge,
                    {
                      backgroundColor: sleepTimerMinutes
                        ? isDark
                          ? 'rgba(139, 92, 246, 0.25)'
                          : 'rgba(139, 92, 246, 0.15)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                      borderColor: sleepTimerMinutes ? '#8B5CF6' : 'transparent',
                    },
                  ]}
                >
                  <Ionicons
                    name={sleepTimerMinutes ? 'moon' : 'moon-outline'}
                    size={13}
                    color={sleepTimerMinutes ? '#8B5CF6' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.sleepHeaderBadgeText,
                      { color: sleepTimerMinutes ? '#8B5CF6' : colors.textSecondary },
                    ]}
                  >
                    {sleepTimerBadge}
                  </Text>
                </AnimatedPressable>
              </View>
            </View>

            {/* Center Glassmorphic Ornamental Ring with Arabic Calligraphy */}
            <View style={styles.centerArtworkArea}>
              <View style={[styles.ornamentalRingOuter, shadows.medium]}>
                {/* Concentric Double Border */}
                <View
                  style={[
                    styles.ornamentalRingBorder,
                    {
                      borderColor: isDark
                        ? 'rgba(212, 175, 55, 0.35)'
                        : 'rgba(212, 175, 55, 0.45)',
                    },
                  ]}
                >
                  <LinearGradient
                    colors={
                      isDark
                        ? ['#0D2B22', '#0A1E18', '#071210']
                        : ['#E6F7F0', '#F2FBF7', '#FFFFFF']
                    }
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.8, y: 1 }}
                    style={styles.artworkInnerCircle}
                  >
                    {/* Gold Aura Ambient Highlight */}
                    <LinearGradient
                      colors={['rgba(212, 175, 55, 0.18)', 'transparent']}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 0.55 }}
                      style={StyleSheet.absoluteFill}
                      pointerEvents="none"
                    />

                    {/* Tag Row: Surah Number & Juz info */}
                    <View style={styles.surahTagPill}>
                      <Ionicons name="sparkles" size={11} color="#D4AF37" />
                      <Text style={styles.surahTagPillText}>
                        {language === 'uz'
                          ? `${currentTrack.surahId}-SURA • ${juzDisplay.toUpperCase()}`
                          : `СУРА ${currentTrack.surahId} • ${juzDisplay.toUpperCase()}`}
                      </Text>
                    </View>

                    {/* Big Surah Arabic Calligraphy */}
                    <View style={styles.arabicCalligraphyBox}>
                      <Text
                        style={[
                          styles.arabicCalligraphyText,
                          {
                            color: isDark ? '#1DCF90' : '#0D6B4E',
                            fontFamily: fontFamilies.arabic,
                          },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {surah?.nameArabic ?? ''}
                      </Text>
                    </View>

                    {/* Localized Surah Name */}
                    <Text
                      style={[styles.surahLocalizedTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {localizedSurahName}
                    </Text>

                    {/* Revelation & Ayah Info */}
                    <View style={styles.subInfoRow}>
                      <Text
                        style={[
                          styles.ayahIndicatorText,
                          { color: colors.primary },
                        ]}
                      >
                        {ayahIndicatorText}
                      </Text>
                      {revelationDisplay ? (
                        <>
                          <Text style={{ color: colors.textTertiary }}>•</Text>
                          <Text
                            style={[
                              styles.revelationTypeText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {revelationDisplay}
                          </Text>
                        </>
                      ) : null}
                    </View>
                  </LinearGradient>
                </View>
              </View>

              {/* Reciter Selector Pill */}
              <AnimatedPressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsReciterPickerVisible(true);
                }}
                haptic="light"
                style={[
                  styles.reciterPill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(13, 107, 78, 0.08)',
                    borderColor: isDark
                      ? 'rgba(212, 175, 55, 0.25)'
                      : 'rgba(13, 107, 78, 0.15)',
                  },
                ]}
              >
                <Ionicons name="mic" size={14} color={colors.primary} />
                <Text
                  style={[styles.reciterPillText, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {activeReciterName}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={12}
                  color={colors.textTertiary}
                />
              </AnimatedPressable>
            </View>

            {/* Gold Animated Scrubber Bar & Timeline */}
            <View style={styles.scrubberContainer}>
              <View
                style={styles.progressTouchZone}
                onLayout={(e) => {
                  const w = e.nativeEvent.layout.width;
                  if (w > 0) trackWidthRef.current = w;
                }}
                {...scrubberPanResponder.panHandlers}
              >
                <View
                  pointerEvents="none"
                  style={[
                    styles.progressBaseTrack,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#1DCF90', '#0D6B4E', '#D4AF37']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFillGrad, { width: progressPercent }]}
                  />
                </View>

                {/* Gold glowing scrubber thumb */}
                <View
                  pointerEvents="none"
                  style={[
                    styles.scrubberThumb,
                    {
                      left: progressPercent,
                      transform: [{ translateX: -7.5 }],
                    },
                  ]}
                />
              </View>

              {/* Time Indicators */}
              <View style={styles.timeRow}>
                <Text
                  style={[styles.timeLabel, { color: colors.textSecondary }]}
                >
                  {formatTime(displayPos)}
                </Text>
                <Text
                  style={[styles.timeLabel, { color: colors.textTertiary }]}
                >
                  {formatRemainingTime(duration - displayPos)}
                </Text>
              </View>
            </View>

            {/* Main Controls Row: 10s CCW, Prev, Hero 72px Play/Pause, Next, 10s CW */}
            <View style={styles.controlsRow}>
              {/* 10s Rewind Button */}
              <AnimatedPressable
                onPress={handleRewind10}
                haptic="light"
                style={[
                  styles.skipTenButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}
                accessibilityLabel="Rewind 10 seconds"
              >
                <Feather name="rotate-ccw" size={20} color={colors.text} />
                <Text
                  style={[styles.skipTenText, { color: colors.textSecondary }]}
                >
                  10
                </Text>
              </AnimatedPressable>

              {/* Previous Ayah Button */}
              <AnimatedPressable
                onPress={handlePrevious}
                haptic="light"
                style={[
                  styles.navAyahButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
                accessibilityLabel="Previous Ayah"
              >
                <Feather name="skip-back" size={26} color={colors.text} />
              </AnimatedPressable>

              {/* Hero Play/Pause Button (72px, emerald-gold gradient with glowing shadow & pulse ring) */}
              <View style={styles.heroPlayWrapper}>
                {isPlaying && (
                  <MotiView
                    from={{ opacity: 0.65, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.42 }}
                    transition={{
                      type: 'timing',
                      duration: 1350,
                      loop: true,
                    }}
                    style={styles.heroPulseRing}
                  />
                )}
                <AnimatedPressable
                  onPress={handleTogglePlayPause}
                  haptic="medium"
                  scaleValue={0.93}
                  accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                >
                  <LinearGradient
                    colors={['#1DCF90', '#0D6B4E', '#D4AF37']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroPlayGradient}
                  >
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={32}
                      color="#FFFFFF"
                      style={!isPlaying && styles.heroPlayIconOffset}
                    />
                  </LinearGradient>
                </AnimatedPressable>
              </View>

              {/* Next Ayah Button */}
              <AnimatedPressable
                onPress={handleNext}
                haptic="light"
                style={[
                  styles.navAyahButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
                accessibilityLabel="Next Ayah"
              >
                <Feather name="skip-forward" size={26} color={colors.text} />
              </AnimatedPressable>

              {/* 10s Forward Button */}
              <AnimatedPressable
                onPress={handleForward10}
                haptic="light"
                style={[
                  styles.skipTenButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}
                accessibilityLabel="Forward 10 seconds"
              >
                <Feather name="rotate-cw" size={20} color={colors.text} />
                <Text
                  style={[styles.skipTenText, { color: colors.textSecondary }]}
                >
                  10
                </Text>
              </AnimatedPressable>
            </View>

            {/* Hifz Tools Bottom Bar: Speed, Repeat, Sleep Timer, Range Loop */}
            <View style={styles.hifzToolsBar}>
              {/* 1. Speed Pill */}
              <AnimatedPressable
                onPress={handleCycleSpeed}
                haptic="light"
                style={[
                  styles.hifzPill,
                  {
                    backgroundColor:
                      speed !== 1.0
                        ? isDark
                          ? 'rgba(212, 175, 55, 0.2)'
                          : 'rgba(212, 175, 55, 0.12)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : 'rgba(0, 0, 0, 0.04)',
                    borderColor: speed !== 1.0 ? '#D4AF37' : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name="speedometer-outline"
                  size={16}
                  color={speed !== 1.0 ? '#D4AF37' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.hifzPillValue,
                    { color: speed !== 1.0 ? '#D4AF37' : colors.text },
                  ]}
                >
                  {speed}x
                </Text>
                <Text
                  style={[
                    styles.hifzPillLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  {language === 'uz' ? 'Tezlik' : 'Скорость'}
                </Text>
              </AnimatedPressable>

              {/* 2. Repeat Pill */}
              <AnimatedPressable
                onPress={handleCycleRepeat}
                haptic="light"
                style={[
                  styles.hifzPill,
                  {
                    backgroundColor: isRepeatingActive
                      ? isDark
                        ? 'rgba(29, 207, 144, 0.2)'
                        : 'rgba(13, 107, 78, 0.12)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isRepeatingActive ? colors.primary : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name="repeat"
                  size={16}
                  color={isRepeatingActive ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.hifzPillValue,
                    { color: isRepeatingActive ? colors.primary : colors.text },
                  ]}
                >
                  {isRepeatingActive && currentRepeatIndex > 1
                    ? `${currentRepeatIndex}/${repeatBadge}`
                    : repeatBadge}
                </Text>
                <Text
                  style={[
                    styles.hifzPillLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  {language === 'uz' ? 'Takror' : 'Повтор'}
                </Text>
              </AnimatedPressable>

              {/* 3. Sleep Timer Pill */}
              <AnimatedPressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsSleepModalVisible(true);
                }}
                haptic="light"
                style={[
                  styles.hifzPill,
                  {
                    backgroundColor: sleepTimerMinutes
                      ? isDark
                        ? 'rgba(139, 92, 246, 0.2)'
                        : 'rgba(139, 92, 246, 0.12)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                    borderColor: sleepTimerMinutes ? '#8B5CF6' : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name={sleepTimerMinutes ? 'moon' : 'moon-outline'}
                  size={16}
                  color={sleepTimerMinutes ? '#8B5CF6' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.hifzPillValue,
                    { color: sleepTimerMinutes ? '#8B5CF6' : colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {sleepTimerBadge}
                </Text>
                <Text
                  style={[
                    styles.hifzPillLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  {language === 'uz' ? 'Taymer' : 'Таймер'}
                </Text>
              </AnimatedPressable>

              {/* 4. Range Loop Pill (Hifz A-B Ayah loop) */}
              <AnimatedPressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRangeStart(loopRange?.startAyah ?? Math.max(1, currentTrack.ayahNumber));
                  setRangeEnd(
                    loopRange?.endAyah ??
                      Math.min(totalAyahs, Math.max(1, currentTrack.ayahNumber + 4))
                  );
                  setIsRangeModalVisible(true);
                }}
                haptic="light"
                style={[
                  styles.hifzPill,
                  {
                    backgroundColor: isRangeActive
                      ? isDark
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(245, 158, 11, 0.12)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                    borderColor: isRangeActive ? '#F59E0B' : 'transparent',
                  },
                ]}
              >
                <Feather
                  name="git-commit"
                  size={16}
                  color={isRangeActive ? '#F59E0B' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.hifzPillValue,
                    { color: isRangeActive ? '#F59E0B' : colors.text },
                  ]}
                  numberOfLines={1}
                >
                  {rangeBadge}
                </Text>
                <Text
                  style={[
                    styles.hifzPillLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  {language === 'uz' ? 'Oraliq' : 'Диапазон'}
                </Text>
              </AnimatedPressable>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Reciter Picker Sheet Modal */}
        <ReciterPicker
          isVisible={isReciterPickerVisible}
          onClose={() => setIsReciterPickerVisible(false)}
        />

        {/* Sleep Timer Selection Modal */}
        {isSleepModalVisible && (
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(140)}
            style={[StyleSheet.absoluteFill, { zIndex: 100001 }]}
          >
            <Pressable
              style={styles.dialogOverlay}
              onPress={() => setIsSleepModalVisible(false)}
            >
              <Pressable
                style={[
                  styles.dialogCard,
                  {
                    backgroundColor: isDark ? '#141A24' : '#FFFFFF',
                  },
                  shadows.strong,
                ]}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.dialogCardHeader}>
                  <Text style={[styles.dialogCardTitle, { color: colors.text }]}>
                    {language === 'uz' ? 'Uyqu taymeri' : 'Таймер сна'}
                  </Text>
                  <AnimatedPressable
                    onPress={() => setIsSleepModalVisible(false)}
                    haptic="light"
                    style={styles.dialogCloseButton}
                  >
                    <Feather name="x" size={18} color={colors.textSecondary} />
                  </AnimatedPressable>
                </View>

                <View style={styles.dialogOptionsList}>
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
                          styles.dialogOptionRow,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? 'rgba(139, 92, 246, 0.22)'
                                : 'rgba(139, 92, 246, 0.1)'
                              : isDark
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'rgba(0, 0, 0, 0.03)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dialogOptionText,
                            {
                              color: isSelected ? '#8B5CF6' : colors.text,
                            },
                          ]}
                        >
                          {label}
                        </Text>
                        <View
                          style={[
                            styles.dialogRadioOuter,
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
                                styles.dialogRadioInner,
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
          </Animated.View>
        )}

        {/* Hifz Range Loop Configuration Dialog */}
        {isRangeModalVisible && (
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(140)}
            style={[StyleSheet.absoluteFill, { zIndex: 100001 }]}
          >
            <Pressable
              style={styles.dialogOverlay}
              onPress={() => setIsRangeModalVisible(false)}
            >
              <Pressable
                style={[
                  styles.dialogCard,
                  {
                    backgroundColor: isDark ? '#141A24' : '#FFFFFF',
                  },
                  shadows.strong,
                ]}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.dialogCardHeader}>
                  <View style={styles.dialogTitleRow}>
                    <Feather name="git-commit" size={18} color="#F59E0B" />
                    <Text
                      style={[styles.dialogCardTitle, { color: colors.text }]}
                    >
                      {language === 'uz'
                        ? 'Oyatlar oralig‘i'
                        : 'Диапазон повторения'}
                    </Text>
                  </View>
                  <AnimatedPressable
                    onPress={() => setIsRangeModalVisible(false)}
                    haptic="light"
                    style={styles.dialogCloseButton}
                  >
                    <Feather name="x" size={18} color={colors.textSecondary} />
                  </AnimatedPressable>
                </View>

                <Text
                  style={[
                    styles.dialogCardSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {language === 'uz'
                    ? 'Yodlash uchun takrorlanadigan oyatlar oralig‘ini belgilang'
                    : 'Задайте начальный и конечный аят для циклического заучивания'}
                </Text>

                <View style={styles.rangePickersRow}>
                  {/* Start Ayah */}
                  <View style={styles.rangeSelectorColumn}>
                    <Text
                      style={[styles.rangeColLabel, { color: colors.textSecondary }]}
                    >
                      {language === 'uz' ? 'Boshlang‘ich' : 'С аята'}
                    </Text>
                    <View style={styles.rangeStepperRow}>
                      <AnimatedPressable
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setRangeStart((prev) => Math.max(1, prev - 1));
                        }}
                        style={[
                          styles.stepperBtn,
                          { backgroundColor: isDark ? '#1F2733' : '#EAECEF' },
                        ]}
                      >
                        <Feather name="minus" size={16} color={colors.text} />
                      </AnimatedPressable>
                      <Text
                        style={[styles.stepperValueText, { color: colors.text }]}
                      >
                        {rangeStart}
                      </Text>
                      <AnimatedPressable
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setRangeStart((prev) => Math.min(rangeEnd, prev + 1));
                        }}
                        style={[
                          styles.stepperBtn,
                          { backgroundColor: isDark ? '#1F2733' : '#EAECEF' },
                        ]}
                      >
                        <Feather name="plus" size={16} color={colors.text} />
                      </AnimatedPressable>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.rangeDividerLine,
                      { backgroundColor: isDark ? '#2D3748' : '#CBD5E1' },
                    ]}
                  />

                  {/* End Ayah */}
                  <View style={styles.rangeSelectorColumn}>
                    <Text
                      style={[styles.rangeColLabel, { color: colors.textSecondary }]}
                    >
                      {language === 'uz' ? 'Oxirgi' : 'По аят'}
                    </Text>
                    <View style={styles.rangeStepperRow}>
                      <AnimatedPressable
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setRangeEnd((prev) => Math.max(rangeStart, prev - 1));
                        }}
                        style={[
                          styles.stepperBtn,
                          { backgroundColor: isDark ? '#1F2733' : '#EAECEF' },
                        ]}
                      >
                        <Feather name="minus" size={16} color={colors.text} />
                      </AnimatedPressable>
                      <Text
                        style={[styles.stepperValueText, { color: colors.text }]}
                      >
                        {rangeEnd}
                      </Text>
                      <AnimatedPressable
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setRangeEnd((prev) => Math.min(totalAyahs, prev + 1));
                        }}
                        style={[
                          styles.stepperBtn,
                          { backgroundColor: isDark ? '#1F2733' : '#EAECEF' },
                        ]}
                      >
                        <Feather name="plus" size={16} color={colors.text} />
                      </AnimatedPressable>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.dialogActionsRow}>
                  {isRangeActive && (
                    <AnimatedPressable
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setLoopRange(null);
                        setIsRangeModalVisible(false);
                      }}
                      style={[
                        styles.dialogCancelBtn,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.05)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dialogCancelText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {language === 'uz' ? 'Bekor qilish' : 'Сбросить'}
                      </Text>
                    </AnimatedPressable>
                  )}

                  <AnimatedPressable
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setLoopRange({ startAyah: rangeStart, endAyah: rangeEnd });
                      setIsRangeModalVisible(false);
                    }}
                    style={styles.dialogApplyBtn}
                  >
                    <LinearGradient
                      colors={['#1DCF90', '#0D6B4E']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.dialogApplyGradient}
                    >
                      <Text style={styles.dialogApplyText}>
                        {language === 'uz' ? 'Faollashtirish' : 'Применить'}
                      </Text>
                    </LinearGradient>
                  </AnimatedPressable>
                </View>
              </Pressable>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  dropletContainer: {
    // animatedDropletStyle handles position, top, left, width, height, borderRadius, scale
    zIndex: 9999,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  // Header
  headerArea: {
    width: '100%',
  },
  dragPillWrapper: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dragPill: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    marginTop: 2,
  },
  circleHeaderButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sleepHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  sleepHeaderBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Center Artwork
  centerArtworkArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  ornamentalRingOuter: {
    width: Math.min(SCREEN_WIDTH - 60, 276),
    height: Math.min(SCREEN_WIDTH - 60, 276),
    borderRadius: Math.min(SCREEN_WIDTH - 60, 276) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ornamentalRingBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 1.5,
    padding: 6,
  },
  artworkInnerCircle: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  surahTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
    marginBottom: 8,
  },
  surahTagPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.4,
  },
  arabicCalligraphyBox: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabicCalligraphyText: {
    fontSize: 38,
    textAlign: 'center',
  },
  surahLocalizedTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  ayahIndicatorText: {
    fontSize: 13,
    fontWeight: '700',
  },
  revelationTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reciterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 14,
    maxWidth: '85%',
  },
  reciterPillText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  // Timeline Scrubber
  scrubberContainer: {
    width: '100%',
    paddingVertical: 8,
  },
  progressTouchZone: {
    height: 32,
    justifyContent: 'center',
  },
  progressBaseTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFillGrad: {
    height: '100%',
    borderRadius: 3,
  },
  scrubberThumb: {
    position: 'absolute',
    top: 8.5,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#D4AF37',
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  // Controls
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 8,
  },
  skipTenButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipTenText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: -2,
  },
  navAyahButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlayWrapper: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(29, 207, 144, 0.4)',
  },
  heroPlayGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1DCF90',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  heroPlayIconOffset: {
    marginStart: 4,
  },
  // Hifz Tools Bottom Bar
  hifzToolsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 6,
  },
  hifzPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: 3,
  },
  hifzPillValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  hifzPillLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  // Dialog Overlays (Sleep Timer & Range Loop)
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
  },
  dialogCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dialogTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dialogCardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  dialogCardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  dialogCloseButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogOptionsList: {
    gap: 8,
  },
  dialogOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  dialogOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dialogRadioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // Range Loop Steppers
  rangePickersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  rangeDividerLine: {
    width: 1,
    height: 36,
  },
  rangeSelectorColumn: {
    alignItems: 'center',
  },
  rangeColLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  rangeStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueText: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  dialogActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  dialogCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dialogApplyBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  dialogApplyGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogApplyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
