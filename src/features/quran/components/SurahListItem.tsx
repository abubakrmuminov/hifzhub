import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getSurahName } from '@/features/quran/utils/quranUtils';
import { useDownloadStore } from '@/stores/downloadStore';
import { startSurahDownload } from '@/features/audio/hooks/useDownload';
import type { Surah } from '@/db/schema';

export interface SurahListItemProps {
  surah: Surah;
  onPress: (id: number) => void;
  lang: string;
  isDark: boolean;
  colors: {
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
  };
  borderRadius: number;
  fontFamilyArabic: string;
  meccanText: string;
  medinanText: string;
  versesText: string;
}

export const SurahListItem = React.memo<SurahListItemProps>(
  ({
    surah,
    onPress,
    lang,
    isDark,
    colors,
    borderRadius,
    fontFamilyArabic,
    meccanText,
    medinanText,
    versesText,
  }) => {
    const transliteratedName = getSurahName(surah.nameTranslation, lang);
    const isDownloaded = useDownloadStore((s) => s.isSurahDownloaded(surah.id));
    const downloadInfo = useDownloadStore((s) => s.downloads[surah.id]);
    const isDownloading = downloadInfo?.status === 'downloading';
    const downloadProgress = downloadInfo?.progress ?? 0;

    const revelation =
      surah.revelationType === 'Meccan' || surah.revelationType === 'meccan'
        ? meccanText
        : medinanText;

    const handlePress = () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(surah.id);
    };

    const handleDownloadPress = (e: any) => {
      e?.stopPropagation?.();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void startSurahDownload(surah.id);
    };

    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: isDark
              ? pressed
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(255, 255, 255, 0.06)'
              : pressed
              ? 'rgba(240, 236, 226, 0.95)'
              : 'rgba(255, 255, 255, 0.92)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.05)',
            borderRadius,
          },
        ]}
      >
        <View style={styles.row}>
          {/* Surah Number Circle */}
          <View
            style={[
              styles.circle,
              {
                borderColor: colors.secondary,
                backgroundColor: isDark
                  ? 'rgba(212, 167, 69, 0.18)'
                  : 'rgba(212, 167, 69, 0.12)',
              },
            ]}
          >
            <Text style={[styles.num, { color: colors.secondary }]}>{surah.id}</Text>
          </View>

          {/* Surah Details */}
          <View style={styles.details}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {transliteratedName}
              </Text>
              {isDownloaded && (
                <View style={styles.offlineBadge}>
                  <Feather name="check-circle" size={13} color="#10B981" />
                </View>
              )}
            </View>
            <View style={styles.chipRow}>
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: isDark
                      ? 'rgba(13, 107, 78, 0.25)'
                      : 'rgba(13, 107, 78, 0.10)',
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: colors.primary }]}>{revelation}</Text>
              </View>
              <Text style={[styles.dot, { color: colors.textTertiary }]}>•</Text>
              <Text style={[styles.count, { color: colors.textSecondary }]}>
                {surah.ayahCount} {versesText}
              </Text>

              {isDownloaded ? (
                <>
                  <Text style={[styles.dot, { color: colors.textTertiary }]}>•</Text>
                  <View
                    style={[
                      styles.offlinePill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(16, 185, 129, 0.20)'
                          : 'rgba(16, 185, 129, 0.12)',
                        borderColor: isDark
                          ? 'rgba(16, 185, 129, 0.40)'
                          : 'rgba(16, 185, 129, 0.25)',
                      },
                    ]}
                  >
                    <Feather name="check" size={10} color="#10B981" />
                    <Text style={styles.offlinePillText}>Offline ✓</Text>
                  </View>
                </>
              ) : isDownloading ? (
                <>
                  <Text style={[styles.dot, { color: colors.textTertiary }]}>•</Text>
                  <View
                    style={[
                      styles.downloadingPill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(212, 167, 69, 0.20)'
                          : 'rgba(212, 167, 69, 0.12)',
                        borderColor: isDark
                          ? 'rgba(212, 167, 69, 0.35)'
                          : 'rgba(212, 167, 69, 0.25)',
                      },
                    ]}
                  >
                    <ActivityIndicator size={9} color={colors.secondary} />
                    <Text style={[styles.downloadingPillText, { color: colors.secondary }]}>
                      {downloadProgress}%
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.dot, { color: colors.textTertiary }]}>•</Text>
                  <Pressable
                    onPress={handleDownloadPress}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={({ pressed }) => [
                      styles.downloadButton,
                      {
                        opacity: pressed ? 0.5 : 0.8,
                      },
                    ]}
                    accessibilityLabel="Download surah audio"
                  >
                    <Feather name="download" size={12} color={colors.textTertiary} />
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* Arabic Calligraphy Name */}
          <Text
            style={[
              styles.arabic,
              { fontFamily: fontFamilyArabic, color: colors.primary },
            ]}
            numberOfLines={1}
          >
            {surah.nameArabic}
          </Text>
        </View>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    height: 68,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 6,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: {
    fontSize: 13,
    fontWeight: '700',
  },
  details: {
    flex: 1,
    marginStart: 12,
    marginEnd: 8,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  offlineBadge: {
    marginStart: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  dot: {
    marginHorizontal: 4,
    fontSize: 10,
  },
  count: {
    fontSize: 11,
  },
  arabic: {
    fontSize: 21,
    textAlign: 'right',
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  offlinePillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#10B981',
  },
  downloadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  downloadingPillText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
});
