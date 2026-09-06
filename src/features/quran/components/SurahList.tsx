import React, { useState, useDeferredValue, useMemo, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme';
import { SurahListSkeleton } from '@/shared/components/Skeleton';
import { useSurahs } from '@/features/quran/hooks/useSurahs';
import { SurahListItem } from '@/features/quran/components/SurahListItem';
import { getSurahName } from '@/features/quran/utils/quranUtils';
import { useScrollTabBar } from '@/shared/hooks/useScrollTabBar';
import type { Surah } from '@/db/schema';

export interface SurahListProps {}

export const SurahList: React.FC<SurahListProps> = () => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors, fontFamilies, spacing, radius, isDark } = useTheme();
  const { onScroll, scrollEventThrottle } = useScrollTabBar();
  const router = useRouter();
  const { surahs, isLoading } = useSurahs();
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);

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

  const filteredSurahs = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter((s) => {
      const arabicMatch = s.nameArabic.includes(q);
      const idMatch = s.id.toString() === q;
      const trans = getSurahName(s.nameTranslation, lang).toLowerCase();
      return arabicMatch || idMatch || trans.includes(q);
    });
  }, [surahs, deferredSearch, lang]);

  const handleSelectSurah = useCallback(
    (surahId: number) => {
      router.push({
        pathname: '/surah/[id]',
        params: { id: surahId.toString() },
      });
    },
    [router]
  );

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
        style={[styles.header, { paddingTop: insets.top + spacing.sm, paddingBottom: spacing.md }]}
      >
        <Text style={[styles.headerCalligraphy, { fontFamily: fontFamilies.arabic }]}>
          القرآن الكريم
        </Text>
        <View style={[styles.searchBar, { borderRadius: radius.md, backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('quran.searchSurah')}
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>

      {isLoading ? (
        <SurahListSkeleton count={8} />
      ) : (
        <FlashList<Surah>
          data={filteredSurahs}
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
  searchBar: {
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
});
