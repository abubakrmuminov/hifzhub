import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme';
import { GlassView } from '@/shared/components/GlassView';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { TimingPresets } from '@/shared/constants/animations';
import { useSettingsStore } from '@/stores/settingsStore';
import { SURAHS_DATA } from '@/features/quran/data/surahsData';
import { getSurahName } from '@/features/quran/utils/quranUtils';

export interface HomeProgressCardProps {
  surahId?: number;
  surahName?: string;
  totalVerses?: number;
  memorizedVerses?: number;
}

export const HomeProgressCard: React.FC<HomeProgressCardProps> = ({
  surahId: propsSurahId,
  surahName: propsSurahName,
  totalVerses: propsTotalVerses,
  memorizedVerses: propsMemorizedVerses,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const { lastReadSurahId, lastReadAyahNumber, language } = useSettingsStore();

  const effectiveSurahId = propsSurahId ?? lastReadSurahId ?? 1;
  const surahMeta = useMemo(
    () => SURAHS_DATA.find((s) => s.id === effectiveSurahId),
    [effectiveSurahId]
  );

  const displayName = useMemo(() => {
    if (propsSurahName) return propsSurahName;
    if (surahMeta) {
      const name = getSurahName(surahMeta.nameTranslation, language);
      return name.startsWith('Сура') ? name : `Сура ${name}`;
    }
    return `Сура ${effectiveSurahId}`;
  }, [propsSurahName, surahMeta, language, effectiveSurahId]);

  const total = propsTotalVerses ?? surahMeta?.ayahCount ?? 7;
  const current = propsMemorizedVerses ?? lastReadAyahNumber ?? 1;
  const progressRatio = total > 0 ? Math.min(1, Math.max(0, current / total)) : 0;

  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(progressRatio, TimingPresets.slow);
  }, [progressRatio, animatedWidth]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${Math.round(animatedWidth.value * 100)}%`,
  }));

  const handleResume = () => {
    router.push({
      pathname: '/surah/[id]',
      params: { id: String(effectiveSurahId) },
    });
  };

  const handleRevision = () => {
    router.push('/memorize');
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(160).springify()}
      style={{ paddingHorizontal: spacing.md, marginTop: spacing.md }}
    >
      <GlassView borderRadius={radius.lg} style={styles.glassCard}>
        {/* Header */}
        <View style={styles.topRow}>
          <View style={styles.titleWithIcon}>
            <View style={[styles.iconPill, { backgroundColor: colors.primary + '18' }]}>
              <MaterialCommunityIcons
                name="book-open-page-variant"
                size={14}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('home.myProgress')}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.primary + '14' },
            ]}
          >
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {`Сура ${effectiveSurahId} • ${total} ${t('quran.ayah', { defaultValue: 'аятов' })}`}
            </Text>
          </View>
        </View>

        {/* Surah Details */}
        <View style={styles.surahInfoRow}>
          <Text style={[styles.surahName, { color: colors.text }]}>
            {displayName}
          </Text>
          <Text style={[styles.percentageText, { color: colors.primary }]}>
            {Math.round(progressRatio * 100)}%
          </Text>
        </View>

        {/* Animated Progress Bar */}
        <View
          style={[
            styles.progressBarTrack,
            { backgroundColor: colors.primary + '14' },
          ]}
        >
          <Animated.View
            style={[
              styles.progressBarFill,
              { backgroundColor: colors.primary },
              animatedBarStyle,
            ]}
          />
        </View>

        <Text style={[styles.verseCountText, { color: colors.textSecondary }]}>
          {`${current} из ${total} ${t('quran.ayah', { defaultValue: 'аятов' })} прочитано`}
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <AnimatedPressable
            onPress={handleResume}
            accessibilityLabel={t('home.resumeLearning')}
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
                borderRadius: radius.md,
              },
            ]}
          >
            <Feather
              name="play"
              size={15}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.primaryButtonText}>
              {t('home.resumeLearning')}
            </Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={handleRevision}
            accessibilityLabel={t('home.revision')}
            style={[
              styles.secondaryButton,
              {
                backgroundColor: colors.primary + '16',
                borderRadius: radius.md,
              },
            ]}
          >
            <Feather
              name="refresh-cw"
              size={14}
              color={colors.primary}
              style={styles.buttonIcon}
            />
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
              {t('home.revision')}
            </Text>
          </AnimatedPressable>
        </View>
      </GlassView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  glassCard: {
    padding: 16,
  },
  iconPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  surahInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 10,
    marginBottom: 6,
  },
  surahName: {
    fontSize: 18,
    fontWeight: '700',
  },
  percentageText: {
    fontSize: 15,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  verseCountText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontWeight: '700',
    fontSize: 13,
  },
  buttonIcon: {
    marginEnd: 6,
  },
});
