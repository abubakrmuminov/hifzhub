import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GlassView } from '@/shared/components/GlassView';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useTheme } from '@/shared/theme';
import { useAudioStore } from '@/stores/audioStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTabBarStore } from '@/stores/tabBarStore';
import { usePlayer } from '../hooks/usePlayer';
import { stopAudio } from '../services/trackPlayer';
import { SURAHS_DATA } from '@/features/quran/data/surahsData';
import { getSurahName } from '@/features/quran/utils/quranUtils';

const RECITERS_DISPLAY_RU: Record<string, string> = {
  'ar.alafasy': 'Мишари Рашид',
  alafasy: 'Мишари Рашид',
  'ar.dussary': 'Ясир ад-Даусари',
  dussary: 'Ясир ад-Даусари',
  'ar.abdulbasetmurattal': 'Абдул-Басит',
  abdulbasetmurattal: 'Абдул-Басит',
  'ar.husary': 'Аль-Хусари',
  husary: 'Аль-Хусари',
  'ar.abdurrahmaansudais': 'Ас-Судейс',
  abdurrahmaansudais: 'Ас-Судейс',
};

const RECITERS_DISPLAY_UZ: Record<string, string> = {
  'ar.alafasy': 'Mishariy Roshid',
  alafasy: 'Mishariy Roshid',
  'ar.dussary': 'Yosir ad-Davsariy',
  dussary: 'Yosir ad-Davsariy',
  'ar.abdulbasetmurattal': 'Abdulbosit Abdussamad',
  abdulbasetmurattal: 'Abdulbosit Abdussamad',
  'ar.husary': 'Mahmud Xalil al-Husoriy',
  husary: 'Mahmud Xalil al-Husoriy',
  'ar.abdurrahmaansudais': 'Abdurahmon as-Sudays',
  abdurrahmaansudais: 'Abdurahmon as-Sudays',
};

export const GlobalMiniPlayer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { colors, radius, isDark } = useTheme();

  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const isTabBarVisible = useTabBarStore((s) => s.isTabBarVisible);
  const language = useSettingsStore((s) => s.language);
  const { play, pause } = usePlayer();

  const isClosing = React.useRef(false);
  const translateY = useSharedValue(0);
  const scrollTranslateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    scrollTranslateY.value = withSpring(isTabBarVisible ? 0 : 130, {
      damping: 20,
      stiffness: 170,
      mass: 0.8,
    });
  }, [isTabBarVisible, scrollTranslateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + scrollTranslateY.value }],
    opacity: opacity.value,
  }));

  const isOnSurahDetail = pathname.startsWith('/surah/');
  const shouldShowMini = Boolean(currentTrack && !isOnSurahDetail);

  const surahMeta = currentTrack
    ? SURAHS_DATA.find((s) => s.id === currentTrack.surahId)
    : null;
  const rawSurahName = surahMeta
    ? getSurahName(surahMeta.nameTranslation, language)
    : currentTrack
    ? 'Сура ' + currentTrack.surahId
    : '';
  const surahTitle = rawSurahName.startsWith('Сура')
    ? rawSurahName
    : language === 'uz'
    ? `${rawSurahName} surasi`
    : `Сура ${rawSurahName}`;

  const reciterMap = language === 'uz' ? RECITERS_DISPLAY_UZ : RECITERS_DISPLAY_RU;
  const reciterName = currentTrack
    ? reciterMap[currentTrack.reciter] ??
      reciterMap[currentTrack.reciter.replace('ar.', '')] ??
      currentTrack.reciter
    : '';

  const handleToggle = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  };

  const handleClose = () => {
    if (isClosing.current) return;
    isClosing.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    translateY.value = withTiming(90, { duration: 220 });
    opacity.value = withTiming(0, { duration: 220 });

    setTimeout(async () => {
      await stopAudio();
      translateY.value = 0;
      opacity.value = 1;
      isClosing.current = false;
    }, 240);
  };

  const handleOpenFullPlayer = () => {
    void Haptics.selectionAsync();
    useAudioStore.getState().setFullScreenPlayerVisible(true);
  };

  return (
    <>
      {shouldShowMini && currentTrack && (
        <Animated.View
          entering={SlideInDown.springify()}
          exiting={SlideOutDown.duration(180)}
          style={[
            styles.wrapper,
            {
              bottom: Math.max(insets.bottom, 10) + 76,
            },
            animStyle,
          ]}
        >
          <Pressable
            onPress={handleOpenFullPlayer}
            accessibilityLabel="Open Full Audio Player"
            accessibilityRole="button"
          >
            <GlassView borderRadius={radius.lg} style={styles.container}>
              <View style={styles.infoArea}>
                <View
                  style={[
                    styles.iconBadge,
                    { backgroundColor: colors.primary + '20' },
                  ]}
                >
                  <Ionicons
                    name={isPlaying ? 'volume-high' : 'volume-mute-outline'}
                    size={16}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.textColumn}>
                  <Text
                    style={[styles.trackTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {surahTitle +
                      ' • ' +
                      (language === 'uz'
                        ? `${currentTrack.ayahNumber}-oyat`
                        : `Аят ${currentTrack.ayahNumber}`)}
                  </Text>
                  <Text
                    style={[styles.reciterSubtitle, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {reciterName}
                  </Text>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <AnimatedPressable
                  onPress={handleToggle}
                  style={styles.playButtonWrapper}
                >
                  <LinearGradient
                    colors={['#1DCF90', '#0D6B4E', '#06422F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.playButton, { borderRadius: radius.full }]}
                  >
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={16}
                      color="#FFFFFF"
                      style={!isPlaying && styles.playIconOffset}
                    />
                  </LinearGradient>
                </AnimatedPressable>

                <AnimatedPressable
                  onPress={handleClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={[
                    styles.closeButton,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                  accessibilityLabel="Stop audio"
                >
                  <Ionicons name="close" size={17} color={colors.textSecondary} />
                </AnimatedPressable>
              </View>
            </GlassView>
          </Pressable>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    start: 16,
    end: 16,
    zIndex: 9999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  infoArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginEnd: 8,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 10,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  trackTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  reciterSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButtonWrapper: {
    width: 36,
    height: 36,
  },
  playButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D6B4E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  playIconOffset: {
    marginStart: 2,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});