import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/shared/theme';
import { SurahListSkeleton } from '@/shared/components/Skeleton';
import { useSurahs } from '@/features/quran/hooks/useSurahs';
import { SurahListItem } from '@/features/quran/components/SurahListItem';
import { useScrollTabBar } from '@/shared/hooks/useScrollTabBar';
import { useQuranSearch } from '@/features/quran/hooks/useQuranSearch';
import { QuranSearchResults } from '@/features/quran/components/QuranSearchResults';
import { QuranSearchInitialView } from '@/features/quran/components/QuranSearchInitialView';
import type { Surah } from '@/db/schema';

export interface SurahListProps {}

export const SurahList: React.FC<SurahListProps> = () => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, fontFamilies, spacing, radius, isDark } = useTheme();
  const { onScroll, scrollEventThrottle } = useScrollTabBar();
  const router = useRouter();
  const { surahs, isLoading } = useSurahs();

  const [isSearchActive, setIsSearchActive] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const {
    query,
    setQuery,
    clearQuery,
    activeFilter,
    setActiveFilter,
    results,
    isSearching,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useQuranSearch();

  const isSearchingView = isSearchActive || query.trim().length > 0;

  const lang = i18n.language;
  const meccanText = useMemo(() => t('quran.meccan', { defaultValue: 'Мекканская' }), [t]);
  const medinanText = useMemo(() => t('quran.medinan', { defaultValue: 'Мединская' }), [t]);
  const versesText = useMemo(() => t('quran.verses', { defaultValue: 'аятов' }), [t]);

  const itemColors = useMemo(
    () => ({
      primary: colors.primary,
      secondary: colors.secondary,
      text: colors.text,
      textSecondary: colors.textSecondary,
      textTertiary: colors.textTertiary,
    }),
    [
      colors.primary,
      colors.secondary,
      colors.text,
      colors.textSecondary,
      colors.textTertiary,
    ]
  );

  const handleSelectSurah = useCallback(
    (surahId: number) => {
      inputRef.current?.blur();
      Keyboard.dismiss();
      if (query.trim()) {
        addRecentSearch(query.trim());
      }
      router.push({
        pathname: '/surah/[id]',
        params: { id: surahId.toString() },
      });
    },
    [router, query, addRecentSearch]
  );

  const handleSelectAyah = useCallback(
    (surahId: number, ayahNumber: number) => {
      inputRef.current?.blur();
      Keyboard.dismiss();
      if (query.trim()) {
        addRecentSearch(query.trim());
      }
      router.push({
        pathname: '/surah/[id]',
        params: { id: surahId.toString(), ayah: ayahNumber.toString() },
      });
    },
    [router, query, addRecentSearch]
  );

  const handleCancelSearch = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearQuery();
    setIsSearchActive(false);
    Keyboard.dismiss();
  }, [clearQuery]);

  const renderItem = useCallback(
    ({ item }: { item: Surah }) => (
      <SurahListItem
        surah={item}
        onPress={handleSelectSurah}
        lang={lang}
        isDark={isDark}
        colors={itemColors}
        borderRadius={radius.md}
        fontFamilyArabic={fontFamilies.arabic}
        meccanText={meccanText}
        medinanText={medinanText}
        versesText={versesText}
      />
    ),
    [
      handleSelectSurah,
      lang,
      isDark,
      itemColors,
      radius.md,
      fontFamilies.arabic,
      meccanText,
      medinanText,
      versesText,
    ]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: isSearchingView ? spacing.sm : spacing.md,
          },
        ]}
      >
        {!isSearchingView ? (
          <Text style={[styles.headerCalligraphy, { fontFamily: fontFamilies.arabic }]}>
            القرآن الكريم
          </Text>
        ) : null}

        <View style={styles.searchBarRow}>
          <View
            style={[
              styles.searchBar,
              { borderRadius: radius.md, backgroundColor: colors.surface },
            ]}
          >
            <Ionicons
              name="search"
              size={18}
              color={colors.textTertiary}
              style={styles.searchIcon}
            />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setIsSearchActive(true)}
              placeholder={t('quran.searchPlaceholder', {
                defaultValue: 'Поиск по сурам, аятам, переводам или 2:255...',
              })}
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.text }]}
              returnKeyType="search"
              autoCorrect={false}
            />

            {isSearching ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginEnd: 4 }}
              />
            ) : query ? (
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  clearQuery();
                }}
                hitSlop={8}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textTertiary}
                />
              </Pressable>
            ) : null}
          </View>

          {isSearchingView ? (
            <Pressable
              onPress={handleCancelSearch}
              hitSlop={8}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>
                {t('common.cancel', { defaultValue: 'Отмена' })}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>

      {/* Main content: Search Results OR Initial Search View OR Standard Surahs List */}
      {isSearchingView ? (
        query.trim().length > 0 ? (
          <QuranSearchResults
            results={results}
            query={query}
            activeFilter={activeFilter}
            onChangeFilter={setActiveFilter}
            onSelectSurah={handleSelectSurah}
            onSelectAyah={handleSelectAyah}
          />
        ) : (
          <QuranSearchInitialView
            recentSearches={recentSearches}
            onSelectQuery={(term) => {
              setQuery(term);
              setIsSearchActive(true);
            }}
            onRemoveRecentSearch={removeRecentSearch}
            onClearRecentSearches={clearRecentSearches}
            onSelectSurah={handleSelectSurah}
            onSelectAyahReference={handleSelectAyah}
          />
        )
      ) : isLoading ? (
        <SurahListSkeleton count={8} />
      ) : (
        <FlashList<Surah>
          data={surahs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          getItemType={() => 'surah'}
          drawDistance={800}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xxl + 90,
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    borderBottomStartRadius: 24,
    borderBottomEndRadius: 24,
  },
  headerCalligraphy: {
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginEnd: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  cancelBtn: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

