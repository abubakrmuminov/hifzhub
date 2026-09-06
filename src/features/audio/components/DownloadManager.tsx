import React from 'react';
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useDownload } from '@/features/audio/hooks/useDownload';
import { downloadManagerStyles as styles } from './downloadManagerStyles';

export interface DownloadManagerProps {
  surahId: number;
  reciterId?: string;
  ayahCount?: number;
  style?: StyleProp<ViewStyle>;
}

export const DownloadManager: React.FC<DownloadManagerProps> = ({
  surahId,
  reciterId,
  ayahCount,
  style,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    progress,
    status,
    isDownloaded,
  } = useDownload({
    surahId,
    reciterId,
    ayahCount,
  });

  const percent = Math.round(progress * 100);

  if (status === 'downloading') {
    return (
      <View
        style={[
          styles.container,
          styles.downloadingBox,
          {
            backgroundColor: 'rgba(212, 167, 69, 0.08)',
            borderColor: 'rgba(212, 167, 69, 0.3)',
          },
          style,
        ]}
      >
        <View style={styles.downloadingHeader}>
          <Text style={[styles.statusText, { color: colors.text }]}>
            {t('audio.downloading', { defaultValue: t('quran.downloading') })}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.percentText, { color: colors.secondaryDark }]}>
              {percent}%
            </Text>
            <View style={styles.controlButtonsRow}>
              <AnimatedPressable
                onPress={pauseDownload}
                haptic="light"
                style={styles.controlButton}
                accessibilityLabel={t('audio.pause', { defaultValue: 'Пауза' })}
              >
                <Feather name="pause" size={15} color={colors.secondaryDark} />
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => void cancelDownload()}
                haptic="light"
                style={styles.controlButton}
                accessibilityLabel={t('common.cancel')}
              >
                <Feather name="x" size={15} color={colors.textSecondary} />
              </AnimatedPressable>
            </View>
          </View>
        </View>

        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
        </View>
      </View>
    );
  }

  if (status === 'paused') {
    return (
      <View
        style={[
          styles.container,
          styles.downloadingBox,
          {
            backgroundColor: 'rgba(212, 167, 69, 0.05)',
            borderColor: 'rgba(212, 167, 69, 0.25)',
          },
          style,
        ]}
      >
        <View style={styles.downloadingHeader}>
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            {t('audio.paused', { defaultValue: 'Пауза' })}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.percentText, { color: colors.secondaryDark }]}>
              {percent}%
            </Text>
            <View style={styles.controlButtonsRow}>
              <AnimatedPressable
                onPress={() => void resumeDownload()}
                haptic="light"
                style={styles.controlButton}
                accessibilityLabel={t('audio.resume', { defaultValue: 'Возобновить' })}
              >
                <Feather name="play" size={15} color={colors.primary} />
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => void cancelDownload()}
                haptic="light"
                style={styles.controlButton}
                accessibilityLabel={t('common.cancel')}
              >
                <Feather name="x" size={15} color={colors.textSecondary} />
              </AnimatedPressable>
            </View>
          </View>
        </View>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${percent}%`, opacity: 0.6 },
            ]}
          />
        </View>
      </View>
    );
  }

  if (isDownloaded || status === 'completed') {
    return (
      <View
        style={[
          styles.container,
          styles.actionButton,
          {
            backgroundColor: 'rgba(13, 107, 78, 0.1)',
            borderColor: 'rgba(13, 107, 78, 0.25)',
          },
          style,
        ]}
      >
        <Feather name="check" size={18} color={colors.primary} />
        <Text style={[styles.buttonText, { color: colors.primary }]}>
          {t('quran.downloaded')}
        </Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[styles.container, style]}>
        <AnimatedPressable
          onPress={() => void startDownload()}
          haptic="medium"
          style={[
            styles.actionButton,
            {
              backgroundColor: 'rgba(231, 76, 60, 0.08)',
              borderColor: 'rgba(231, 76, 60, 0.25)',
            },
          ]}
          accessibilityLabel={t('common.retry')}
        >
          <Feather name="alert-circle" size={18} color={colors.error} />
          <Text style={[styles.buttonText, { color: colors.error }]}>
            {t('common.retry')}
          </Text>
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <AnimatedPressable
        onPress={() => void startDownload()}
        haptic="medium"
        style={[
          styles.actionButton,
          {
            backgroundColor: 'rgba(13, 107, 78, 0.08)',
            borderColor: 'rgba(13, 107, 78, 0.25)',
          },
        ]}
        accessibilityLabel={t('audio.downloadAudio', { defaultValue: t('quran.downloadSurah') })}
      >
        <Feather name="download" size={18} color={colors.primary} />
        <Text style={[styles.buttonText, { color: colors.primary }]}>
          {t('audio.downloadAudio', { defaultValue: t('quran.downloadSurah') })}
        </Text>
      </AnimatedPressable>
    </View>
  );
};
