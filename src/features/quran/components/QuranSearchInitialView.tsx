import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/shared/theme';

export interface QuranSearchInitialViewProps {
  recentSearches: string[];
  onSelectQuery: (query: string) => void;
  onRemoveRecentSearch: (query: string) => void;
  onClearRecentSearches: () => void;
  onSelectSurah: (surahId: number) => void;
  onSelectAyahReference: (surahId: number, ayahNumber: number) => void;
}

const POPULAR_SURAHS = [
  { id: 1, nameRu: 'Аль-Фатиха', nameUz: 'Fotiha', badge: '🌟 1' },
  { id: 2, nameRu: 'Аль-Бакара', nameUz: 'Baqara', badge: '📖 2' },
  { id: 36, nameRu: 'Йа Син', nameUz: 'Yosin', badge: '💚 36' },
  { id: 18, nameRu: 'Аль-Кахф', nameUz: 'Kahf', badge: '🛡️ 18' },
  { id: 67, nameRu: 'Аль-Мульк', nameUz: 'Mulk', badge: '👑 67' },
  { id: 55, nameRu: 'Ар-Рахман', nameUz: 'Rohman', badge: '💎 55' },
  { id: 112, nameRu: 'Аль-Ихлас', nameUz: 'Ixlos', badge: '🌙 112' },
];

const FAMOUS_AYAHS = [
  {
    titleRu: 'Аят аль-Курси',
    titleUz: 'Oyatul Kursiy',
    surahId: 2,
    ayahNumber: 255,
    subtitleRu: 'Сура 2, Аят 255 • Величайший аят Корана',
    subtitleUz: '2-sura, 255-oyat • Qur\'onning eng buyuk oyati',
    icon: 'shield-checkmark',
  },
  {
    titleRu: 'Аманар-Расулю',
    titleUz: 'Omanar-Rasulu',
    surahId: 2,
    ayahNumber: 285,
    subtitleRu: 'Сура 2, Аят 285 • Защита на ночь',
    subtitleUz: '2-sura, 285-oyat • Kechasi o\'qiladigan himoya',
    icon: 'moon',
  },
  {
    titleRu: 'Аят Света (Аят ан-Нур)',
    titleUz: 'Nur oyati',
    surahId: 24,
    ayahNumber: 35,
    subtitleRu: 'Сура 24, Аят 35 • «Аллах — Свет небес и земли»',
    subtitleUz: '24-sura, 35-oyat • «Alloh osmonlar va yerning nuridir»',
    icon: 'sunny',
  },
  {
    titleRu: 'Последние аяты Аль-Хашр',
    titleUz: 'Hashr surasi oxirgi oyatlari',
    surahId: 59,
    ayahNumber: 22,
    subtitleRu: 'Сура 59, Аят 22 • Имена Аллаха',
    subtitleUz: '59-sura, 22-oyat • Allohning go\'zal ismlari',
    icon: 'star',
  },
];

export const QuranSearchInitialView: React.FC<QuranSearchInitialViewProps> = React.memo(
  ({
    recentSearches,
    onSelectQuery,
    onRemoveRecentSearch,
    onClearRecentSearches,
    onSelectSurah,
    onSelectAyahReference,
  }) => {
    const { t, i18n } = useTranslation();
    const isUz = i18n.language === 'uz';
    const { colors, fontFamilies, spacing, radius, isDark } = useTheme();

    const handleChipPress = (term: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelectQuery(term);
    };

    const handleSurahPress = (id: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelectSurah(id);
    };

    const handleAyahPress = (surahId: number, ayahNumber: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSelectAyahReference(surahId, ayahNumber);
    };

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxl + 90,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Recent Searches */}
        {recentSearches.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.primary}
                  style={styles.sectionIcon}
                />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('quran.recentSearches', { defaultValue: 'Недавние поиски' })}
                </Text>
              </View>
              <Pressable
                onPress={onClearRecentSearches}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text style={[styles.clearBtnText, { color: colors.textTertiary }]}>
                  {t('quran.clearHistory', { defaultValue: 'Очистить' })}
                </Text>
              </Pressable>
            </View>

            <View style={styles.chipsWrap}>
              {recentSearches.map((item, idx) => (
                <View
                  key={`${item}_${idx}`}
                  style={[
                    styles.recentChip,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                      borderRadius: radius.full,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => handleChipPress(item)}
                    style={styles.recentChipContent}
                  >
                    <Ionicons
                      name="search-outline"
                      size={14}
                      color={colors.textSecondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[styles.chipText, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {item}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onRemoveRecentSearch(item)}
                    hitSlop={6}
                    style={styles.recentChipDelete}
                  >
                    <Ionicons
                      name="close"
                      size={14}
                      color={colors.textTertiary}
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* 2. Popular Surahs Quick Jump */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="sparkles-outline"
              size={18}
              color={colors.secondary}
              style={styles.sectionIcon}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('quran.popularSurahs', { defaultValue: 'Популярные суры' })}
            </Text>
          </View>

          <View style={styles.chipsWrap}>
            {POPULAR_SURAHS.map((s) => {
              const name = isUz ? s.nameUz : s.nameRu;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => handleSurahPress(s.id)}
                  style={[
                    styles.popularSurahChip,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.06)',
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.surahBadge,
                      { color: colors.primary, fontWeight: '600' },
                    ]}
                  >
                    {s.badge}
                  </Text>
                  <Text
                    style={[
                      styles.surahName,
                      { color: colors.text, fontWeight: '500' },
                    ]}
                  >
                    {name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 3. Famous Ayahs */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons
              name="bookmark-outline"
              size={18}
              color={colors.primary}
              style={styles.sectionIcon}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('quran.famousAyahs', { defaultValue: 'Известные аяты' })}
            </Text>
          </View>

          <View style={styles.famousList}>
            {FAMOUS_AYAHS.map((item, idx) => {
              const title = isUz ? item.titleUz : item.titleRu;
              const subtitle = isUz ? item.subtitleUz : item.subtitleRu;
              return (
                <Pressable
                  key={idx}
                  onPress={() => handleAyahPress(item.surahId, item.ayahNumber)}
                  style={[
                    styles.famousCard,
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
                      styles.famousIconWrap,
                      { backgroundColor: colors.primary + '18' },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.famousTextWrap}>
                    <Text
                      style={[
                        styles.famousTitle,
                        { color: colors.text, fontWeight: '600' },
                      ]}
                    >
                      {title}
                    </Text>
                    <Text
                      style={[styles.famousSubtitle, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {subtitle}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textTertiary}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    );
  }
);

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingStart: 12,
    paddingEnd: 8,
    paddingVertical: 7,
  },
  recentChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 200,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  recentChipDelete: {
    marginLeft: 6,
    padding: 2,
  },
  popularSurahChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 8,
  },
  surahBadge: {
    fontSize: 13,
  },
  surahName: {
    fontSize: 13,
  },
  famousList: {
    gap: 10,
  },
  famousCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
  },
  famousIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  famousTextWrap: {
    flex: 1,
  },
  famousTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  famousSubtitle: {
    fontSize: 12,
  },
});
