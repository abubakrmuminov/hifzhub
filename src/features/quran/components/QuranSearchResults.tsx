import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/shared/theme';
import { useAudioStore } from '@/stores/audioStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { playAyah, pauseAudio } from '@/features/audio';
import { HighlightedText } from './HighlightedText';
import type {
  QuranSearchResults as ResultsType,
  AyahSearchResult,
  SurahSearchResult,
} from '@/features/quran/services/quranSearchService';
import type { SearchFilterType } from '@/features/quran/hooks/useQuranSearch';

export interface QuranSearchResultsProps {
  results: ResultsType;
  query: string;
  activeFilter: SearchFilterType;
  onChangeFilter: (filter: SearchFilterType) => void;
  onSelectSurah: (surahId: number) => void;
  onSelectAyah: (surahId: number, ayahNumber: number) => void;
}

export const QuranSearchResults: React.FC<QuranSearchResultsProps> = React.memo(
  ({
    results,
    query,
    activeFilter,
    onChangeFilter,
    onSelectSurah,
    onSelectAyah,
  }) => {
    const { t } = useTranslation();
    const { colors, fontFamilies, spacing, radius, isDark } = useTheme();

    const isPlaying = useAudioStore((s) => s.isPlaying);
    const currentTrack = useAudioStore((s) => s.currentTrack);
    const defaultReciter = useSettingsStore((s) => s.defaultReciter);

    const [copiedAyahId, setCopiedAyahId] = React.useState<number | null>(null);

    const handlePlayAudio = useCallback(
      (surahId: number, ayahNumber: number) => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (
          isPlaying &&
          currentTrack?.surahId === surahId &&
          currentTrack?.ayahNumber === ayahNumber
        ) {
          void pauseAudio();
        } else {
          void playAyah(surahId, ayahNumber, defaultReciter);
        }
      },
      [isPlaying, currentTrack, defaultReciter]
    );

    const handleCopyAyah = useCallback(
      async (ayah: AyahSearchResult) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const text = `${ayah.textUthmani}\n\n${ayah.translation}\n\n(${ayah.surahName}, ${ayah.ayahNumber})`;
        await Clipboard.setStringAsync(text);
        setCopiedAyahId(ayah.id);
        setTimeout(() => {
          setCopiedAyahId(null);
        }, 2000);
      },
      []
    );

    const surahsCount = results.surahs.length;
    const ayahsCount =
      results.ayahs.length + (results.referenceMatch ? 1 : 0);

    const renderHeader = useMemo(() => {
      return (
        <View style={styles.filterBar}>
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              onChangeFilter('all');
            }}
            style={[
              styles.filterTab,
              activeFilter === 'all' && [
                styles.filterTabActive,
                { backgroundColor: colors.primary },
              ],
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                {
                  color:
                    activeFilter === 'all' ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: '500',
                },
              ]}
            >
              {t('quran.allResults', { defaultValue: 'Все' })} ({results.totalMatches})
            </Text>
          </Pressable>

          {surahsCount > 0 ? (
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                onChangeFilter('surahs');
              }}
              style={[
                styles.filterTab,
                activeFilter === 'surahs' && [
                  styles.filterTabActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color:
                      activeFilter === 'surahs'
                        ? '#FFFFFF'
                        : colors.textSecondary,
                    fontWeight: '500',
                  },
                ]}
              >
                {t('quran.surahs', { defaultValue: 'Суры' })} ({surahsCount})
              </Text>
            </Pressable>
          ) : null}

          {ayahsCount > 0 ? (
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                onChangeFilter('ayahs');
              }}
              style={[
                styles.filterTab,
                activeFilter === 'ayahs' && [
                  styles.filterTabActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color:
                      activeFilter === 'ayahs'
                        ? '#FFFFFF'
                        : colors.textSecondary,
                    fontWeight: '500',
                  },
                ]}
              >
                {t('quran.ayahs', { defaultValue: 'Аяты' })} ({ayahsCount})
              </Text>
            </Pressable>
          ) : null}
        </View>
      );
    }, [
      activeFilter,
      colors.primary,
      colors.textSecondary,
      onChangeFilter,
      results.totalMatches,
      surahsCount,
      ayahsCount,
      t,
    ]);

    const renderSurahCard = useCallback(
      (item: SurahSearchResult) => {
        const surah = item.surah;
        return (
          <Pressable
            key={`surah_${surah.id}`}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelectSurah(surah.id);
            }}
            style={[
              styles.surahCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
                borderRadius: radius.md,
              },
            ]}
          >
            <View
              style={[
                styles.surahNumWrap,
                { backgroundColor: colors.primary + '15' },
              ]}
            >
              <Text style={[styles.surahNumText, { color: colors.primary }]}>
                {surah.id}
              </Text>
            </View>

            <View style={styles.surahInfoWrap}>
              <HighlightedText
                text={item.localizedName}
                highlight={query}
                style={[
                  styles.surahNameText,
                  { color: colors.text, fontWeight: '600' },
                ]}
              />
              <Text
                style={[styles.surahMetaText, { color: colors.textSecondary }]}
              >
                {surah.revelationType === 'Meccan'
                  ? t('quran.meccan', { defaultValue: 'Мекканская' })
                  : t('quran.medinan', { defaultValue: 'Мединская' })}{' '}
                • {surah.ayahCount} {t('quran.verses', { defaultValue: 'аятов' })}
              </Text>
            </View>

            <Text
              style={[
                styles.surahArabicText,
                { color: colors.primary, fontFamily: fontFamilies.arabic },
              ]}
            >
              {surah.nameArabic}
            </Text>
          </Pressable>
        );
      },
      [
        colors.surface,
        colors.primary,
        colors.text,
        colors.textSecondary,
        fontFamilies.arabic,
        isDark,
        onSelectSurah,
        query,
        radius.md,
        t,
      ]
    );

    const renderAyahCard = useCallback(
      (item: AyahSearchResult, isDirectRef = false) => {
        const isCurrentPlaying =
          isPlaying &&
          currentTrack?.surahId === item.surahId &&
          currentTrack?.ayahNumber === item.ayahNumber;
        const isCopied = copiedAyahId === item.id;

        return (
          <View
            key={`ayah_${item.id}`}
            style={[
              styles.ayahCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDirectRef
                  ? colors.primary
                  : isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
                borderRadius: radius.md,
              },
            ]}
          >
            {/* Clickable Card Body (Header + Arabic + Translation) */}
            <Pressable
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSelectAyah(item.surahId, item.ayahNumber);
              }}
              android_ripple={{ color: colors.primary + '15' }}
            >
              {/* Header / Badges */}
              <View style={styles.ayahCardHeader}>
                <View style={styles.ayahRefRow}>
                  {isDirectRef ? (
                    <View
                      style={[
                        styles.directRefBadge,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Ionicons name="star" size={12} color="#FFFFFF" />
                      <Text style={styles.directRefText}>
                        {t('quran.exactAyah', { defaultValue: 'Точный аят' })}
                      </Text>
                    </View>
                  ) : null}
                  <View
                    style={[
                      styles.surahTagBadge,
                      { backgroundColor: colors.primary + '18' },
                    ]}
                  >
                    <Text style={[styles.surahTagText, { color: colors.primary }]}>
                      {item.surahName} • {item.ayahNumber}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[styles.pageJuzTag, { color: colors.textTertiary }]}
                >
                  {t('quran.juz', { defaultValue: 'Джуз' })} {item.juz} • {t('quran.page', { defaultValue: 'Стр' })} {item.page}
                </Text>
              </View>

              {/* Arabic text */}
              <HighlightedText
                text={item.textUthmani}
                highlight={query}
                style={[
                  styles.ayahArabicText,
                  { color: colors.text, fontFamily: fontFamilies.arabic },
                ]}
              />

              {/* Translation text */}
              {item.translation ? (
                <HighlightedText
                  text={item.translation}
                  highlight={query}
                  style={[
                    styles.ayahTranslationText,
                    { color: colors.textSecondary },
                  ]}
                />
              ) : null}
            </Pressable>

            {/* Actions Bar */}
            <View style={styles.ayahCardFooter}>
              <View style={styles.footerLeftActions}>
                {/* Audio Button */}
                <Pressable
                  onPress={() => handlePlayAudio(item.surahId, item.ayahNumber)}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isCurrentPlaying
                        ? colors.primary
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                  hitSlop={6}
                >
                  <Ionicons
                    name={isCurrentPlaying ? 'pause' : 'play'}
                    size={15}
                    color={isCurrentPlaying ? '#FFFFFF' : colors.primary}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      {
                        color: isCurrentPlaying ? '#FFFFFF' : colors.text,
                        fontWeight: '500',
                      },
                    ]}
                  >
                    {isCurrentPlaying
                      ? t('quran.pause', { defaultValue: 'Пауза' })
                      : t('quran.listen', { defaultValue: 'Слушать' })}
                  </Text>
                </Pressable>

                {/* Copy Button */}
                <Pressable
                  onPress={() => handleCopyAyah(item)}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                  hitSlop={6}
                >
                  <Ionicons
                    name={isCopied ? 'checkmark' : 'copy-outline'}
                    size={14}
                    color={isCopied ? colors.success : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      {
                        color: isCopied ? colors.success : colors.textSecondary,
                        fontWeight: '500',
                      },
                    ]}
                  >
                    {isCopied
                      ? t('quran.copied', { defaultValue: 'Скопировано' })
                      : t('quran.copy', { defaultValue: 'Копировать' })}
                  </Text>
                </Pressable>
              </View>

              {/* Jump to Ayah Button */}
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onSelectAyah(item.surahId, item.ayahNumber);
                }}
                style={[
                  styles.jumpBtn,
                  { backgroundColor: colors.primary + '18' },
                ]}
              >
                <Text
                  style={[
                    styles.jumpBtnText,
                    { color: colors.primary, fontWeight: '600' },
                  ]}
                >
                  {t('quran.goToAyah', { defaultValue: 'Перейти' })}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={colors.primary}
                />
              </Pressable>
            </View>
          </View>
        );
      },
      [
        colors.surface,
        colors.primary,
        colors.text,
        colors.textSecondary,
        colors.textTertiary,
        colors.success,
        fontFamilies.arabic,
        handleCopyAyah,
        handlePlayAudio,
        isDark,
        isPlaying,
        currentTrack,
        copiedAyahId,
        onSelectAyah,
        query,
        radius.md,
        t,
      ]
    );

    // Empty state if nothing matches
    if (results.totalMatches === 0) {
      return (
        <View style={styles.emptyWrap}>
          <Ionicons
            name="search-outline"
            size={56}
            color={colors.textTertiary}
            style={{ marginBottom: 16 }}
          />
          <Text
            style={[
              styles.emptyTitle,
              { color: colors.text, fontWeight: '600' },
            ]}
          >
            {t('quran.noResults', { defaultValue: 'Ничего не найдено' })}
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
            {t('quran.noResultsHint', {
              defaultValue:
                'Попробуйте изменить запрос, ввести номер аята (например, 2:255) или название суры («Бакара»)',
            })}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={['content']}
        keyExtractor={() => 'search_content'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xxl + 90,
        }}
        keyboardShouldPersistTaps="handled"
        renderItem={() => (
          <View>
            {renderHeader}

            {/* Direct Reference match (e.g. 2:255) */}
            {results.referenceMatch && activeFilter !== 'surahs'
              ? renderAyahCard(results.referenceMatch, true)
              : null}

            {/* Surahs section */}
            {activeFilter !== 'ayahs' && results.surahs.length > 0 ? (
              <View style={styles.sectionWrap}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text, fontWeight: '700' },
                  ]}
                >
                  {t('quran.surahs', { defaultValue: 'Суры' })}
                </Text>
                <View style={styles.surahListWrap}>
                  {results.surahs.map(renderSurahCard)}
                </View>
              </View>
            ) : null}

            {/* Ayahs section */}
            {activeFilter !== 'surahs' && results.ayahs.length > 0 ? (
              <View style={styles.sectionWrap}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text, fontWeight: '700' },
                  ]}
                >
                  {t('quran.ayahs', { defaultValue: 'Аяты' })}
                </Text>
                <View style={styles.ayahListWrap}>
                  {results.ayahs.map((a) => renderAyahCard(a, false))}
                </View>
              </View>
            ) : null}
          </View>
        )}
      />
    );
  }
);

const styles = StyleSheet.create({
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  filterTabActive: {
    backgroundColor: '#10B981',
  },
  filterTabText: {
    fontSize: 13,
  },
  sectionWrap: {
    marginTop: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    marginBottom: 12,
  },
  surahListWrap: {
    gap: 10,
  },
  surahCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
  },
  surahNumWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  surahNumText: {
    fontSize: 14,
    fontWeight: '700',
  },
  surahInfoWrap: {
    flex: 1,
  },
  surahNameText: {
    fontSize: 15,
    marginBottom: 2,
  },
  surahMetaText: {
    fontSize: 12,
  },
  surahArabicText: {
    fontSize: 20,
  },
  ayahListWrap: {
    gap: 14,
  },
  ayahCard: {
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  ayahCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ayahRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  directRefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  directRefText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  surahTagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  surahTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pageJuzTag: {
    fontSize: 12,
  },
  ayahArabicText: {
    fontSize: 22,
    lineHeight: 38,
    textAlign: 'right',
    marginBottom: 12,
  },
  ayahTranslationText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  ayahCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
    paddingTop: 10,
  },
  footerLeftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5,
  },
  actionBtnText: {
    fontSize: 12,
  },
  jumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  jumpBtnText: {
    fontSize: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
