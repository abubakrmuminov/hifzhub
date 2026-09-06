import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useDownload } from '@/features/audio/hooks/useDownload';
import { useAudioStore } from '@/stores/audioStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { playAyah, pauseAudio, playAudio } from '@/features/audio';
import { getSurahName } from '@/features/quran/utils/quranUtils';
import type { Surah } from '@/db/schema';

export interface SurahHeaderProps {
  surah: Surah;
  onPlaySurah?: () => void;
  onDownloadSurah?: () => void;
}

export const SurahHeader = React.memo<SurahHeaderProps>(({ surah, onPlaySurah, onDownloadSurah }) => {
  const { t, i18n } = useTranslation();
  const { colors, fontFamilies, spacing, radius } = useTheme();

  const transliterated = useMemo(
    () => getSurahName(surah.nameTranslation, i18n.language),
    [surah.nameTranslation, i18n.language]
  );
  const rev = surah.revelationType === 'Meccan' ? t('quran.meccan') : t('quran.medinan');
  const showBismillah = surah.id !== 9;

  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const defaultReciter = useSettingsStore((s) => s.defaultReciter);

  const isCurrentSurahPlaying = isPlaying && currentTrack?.surahId === surah.id;

  const handlePlaySurah = useCallback(() => {
    if (onPlaySurah) {
      onPlaySurah();
      return;
    }
    if (isCurrentSurahPlaying) {
      void pauseAudio();
    } else if (currentTrack?.surahId === surah.id) {
      void playAudio();
    } else {
      void playAyah(surah.id, 1, defaultReciter);
    }
  }, [onPlaySurah, isCurrentSurahPlaying, currentTrack?.surahId, surah.id, defaultReciter]);

  const { startDownload, cancelDownload, progress, status, isDownloaded } = useDownload({
    surahId: surah.id,
    ayahCount: surah.ayahCount,
  });

  const percent = Math.round(progress * 100);

  return (
    <LinearGradient
      colors={[colors.primaryDark, colors.primary, colors.primaryLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        {
          padding: spacing.md,
          borderRadius: radius.xl,
          marginHorizontal: spacing.md,
          marginTop: spacing.sm,
          marginBottom: spacing.md,
        },
      ]}
    >
      <Text style={[styles.arabicName, { fontFamily: fontFamilies.arabic, color: colors.secondary }]}>
        {surah.nameArabic}
      </Text>
      <Text style={styles.transName}>{surah.id}. {transliterated}</Text>

      <View style={styles.chips}>
        <View style={styles.chip}><Text style={styles.chipText}>{rev}</Text></View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{surah.ayahCount} {t('quran.verses')}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{t('quran.juz')} {surah.juzStart}</Text>
        </View>
      </View>

      {/* Quick Audio & Download Actions */}
      <View style={styles.actionRow}>
        <AnimatedPressable
          onPress={handlePlaySurah}
          haptic="medium"
          style={[styles.actionPill, isCurrentSurahPlaying && styles.actionPillActive]}
          accessibilityLabel={
            isCurrentSurahPlaying
              ? t('audio.pause', { defaultValue: 'Пауза' })
              : t('quran.listenSurah', { defaultValue: 'Слушать суру' })
          }
        >
          <Ionicons
            name={isCurrentSurahPlaying ? 'pause' : 'play'}
            size={13}
            color={isCurrentSurahPlaying ? colors.primaryDark : '#FFFFFF'}
          />
          <Text
            style={[
              styles.actionText,
              isCurrentSurahPlaying && { color: colors.primaryDark, fontWeight: '700' },
            ]}
          >
            {isCurrentSurahPlaying
              ? t('audio.pause', { defaultValue: 'Пауза' })
              : t('quran.listenSurah', { defaultValue: 'Слушать суру' })}
          </Text>
        </AnimatedPressable>

        {status === 'downloading' ? (
          <View style={styles.downloadingPill}>
            <Text style={styles.downloadingText}>{percent}%</Text>
            <AnimatedPressable
              onPress={cancelDownload}
              haptic="light"
              style={styles.cancelBtn}
              accessibilityLabel={t('common.cancel', { defaultValue: 'Отмена' })}
            >
              <Feather name="x" size={13} color="#FFFFFF" />
            </AnimatedPressable>
          </View>
        ) : isDownloaded || status === 'completed' ? (
          <View style={styles.downloadedPill}>
            <Feather name="check-circle" size={13} color="#0D6B4E" />
            <Text style={styles.downloadedText}>
              {t('quran.downloaded', { defaultValue: 'Скачано' })}
            </Text>
          </View>
        ) : (
          <AnimatedPressable
            onPress={() => (onDownloadSurah ? onDownloadSurah() : void startDownload())}
            haptic="medium"
            style={styles.actionPill}
            accessibilityLabel={t('quran.download', { defaultValue: 'Скачать' })}
          >
            <Feather name="download-cloud" size={13} color="#FFFFFF" />
            <Text style={styles.actionText}>
              {t('quran.download', { defaultValue: 'Скачать' })}
            </Text>
          </AnimatedPressable>
        )}
      </View>

      {showBismillah ? (
        <View style={styles.bismillahBox}>
          <View style={[styles.line, { backgroundColor: colors.secondary }]} />
          <Text style={[styles.bismillah, { fontFamily: fontFamilies.quran, color: colors.secondary }]}>
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </Text>
          <View style={[styles.line, { backgroundColor: colors.secondary }]} />
        </View>
      ) : null}
    </LinearGradient>
  );
});

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  arabicName: { fontSize: 34, textAlign: 'center', marginBottom: 2 },
  transName: { fontSize: 16, color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
  chips: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  actionPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#FFFFFF',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  downloadRow: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  downloadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  downloadedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  downloadedText: {
    color: '#0D6B4E',
    fontSize: 12,
    fontWeight: '700',
  },
  downloadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  downloadingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bismillahBox: { alignItems: 'center', width: '100%', marginTop: 12 },
  line: { width: 60, height: 1, opacity: 0.6, marginVertical: 3 },
  bismillah: { fontSize: 20, textAlign: 'center', marginVertical: 2 },
});
