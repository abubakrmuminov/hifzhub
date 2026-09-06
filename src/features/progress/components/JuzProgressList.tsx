import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Animated, { FadeInDown, FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { GlassView } from '@/shared/components/GlassView';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useMemorizationStore } from '@/stores/memorizationStore';
import { JUZ_DATA, calculateJuzProgress } from '../data/juzData';
import type { JuzProgress, JuzFilter, JuzStatus, JuzSurahInfo } from '../types';

export interface JuzProgressListProps {
  juzProgressList?: JuzProgress[];
  onSelectSurah?: (surahId: number) => void;
  onSelectJuz?: (juzNumber: number) => void;
}

const getJuzNumber = (juz: JuzProgress): number => juz.juzNumber ?? juz.id;
const getJuzNameTransliteration = (juz: JuzProgress, isUz: boolean): string =>
  isUz ? `Pora ${juz.id} - ${juz.nameUz || juz.nameRu}` : (juz.nameTransliteration ?? `Джуз ${juz.id} - ${juz.nameRu}`);
const getJuzStatus = (juz: JuzProgress): JuzStatus =>
  juz.status ?? (juz.isCompleted ? 'completed' : juz.memorizedAyahs > 0 ? 'in_progress' : 'not_started');
const getJuzSurahs = (juz: JuzProgress): JuzSurahInfo[] => juz.surahs ?? [];


const JuzProgressListComponent: React.FC<JuzProgressListProps> = ({
  juzProgressList: propJuzList,
  onSelectSurah,
  onSelectJuz,
}) => {
  const router = useRouter();
  const { colors, spacing, radius, shadows, fontFamilies, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const isUz = i18n.language === 'uz';

  const [activeFilter, setActiveFilter] = useState<JuzFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedJuz, setExpandedJuz] = useState<number | null>(null);

  // Store Fallbacks: Calculate memorized counts per Juz
  const storeCards = useMemorizationStore((s) => s.cards);

  const calculatedJuzList: JuzProgress[] = useMemo(() => {
    if (propJuzList) return propJuzList;

    const cardsArray = Object.values(storeCards);
    const hasAnyStored = cardsArray.length > 0;

    return JUZ_DATA.map((juz) => {
      let memorizedCount = 0;
      const surahs = juz.surahs ?? [];

      if (hasAnyStored) {
        // Match cards belonging to surahs and ayah ranges in this Juz
        for (const card of cardsArray) {
          const match = surahs.some(
            (s: JuzSurahInfo) =>
              s.id === card.surahId &&
              card.ayahNumber >= s.startAyah &&
              card.ayahNumber <= s.endAyah
          );
          if (match) {
            memorizedCount++;
          }
        }
      } else {
        // Realistic demo values for empty store: Juz 30 has 45 ayahs (8%), Juz 1 has 30 ayahs
        if (juz.id === 30 || juz.juzNumber === 30) {
          memorizedCount = 45; // 45 / 564 = 8%
        } else if (juz.id === 1 || juz.juzNumber === 1) {
          memorizedCount = 30; // 30 / 148 = 20%
        }
      }

      return calculateJuzProgress(juz, memorizedCount);
    });
  }, [propJuzList, storeCards]);

  // Filter & Search
  const filteredList = useMemo(() => {
    return calculatedJuzList.filter((juz) => {
      const status = getJuzStatus(juz);
      const jNum = getJuzNumber(juz);
      const translit = getJuzNameTransliteration(juz, isUz);
      const surahs = getJuzSurahs(juz);

      // 1. Filter match
      if (activeFilter === 'in_progress' && status !== 'in_progress') return false;
      if (activeFilter === 'completed' && status !== 'completed') return false;

      // 2. Search match
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const numMatch = jNum.toString() === query;
        const nameMatch = translit.toLowerCase().includes(query);
        const arabicMatch = juz.nameArabic.includes(query);
        const surahMatch = surahs.some((s) => (isUz && s.nameUz ? s.nameUz : s.nameRu).toLowerCase().includes(query));
        return numMatch || nameMatch || arabicMatch || surahMatch;
      }

      return true;
    });
  }, [calculatedJuzList, activeFilter, searchQuery, isUz]);

  // Counts for filters
  const completedCount = useMemo(
    () => calculatedJuzList.filter((j) => getJuzStatus(j) === 'completed').length,
    [calculatedJuzList]
  );
  const inProgressCount = useMemo(
    () => calculatedJuzList.filter((j) => getJuzStatus(j) === 'in_progress').length,
    [calculatedJuzList]
  );

  const toggleExpand = useCallback((juzId: number) => {
    setExpandedJuz((prev) => (prev === juzId ? null : juzId));
    onSelectJuz?.(juzId);
  }, [onSelectJuz]);

  const handlePressSurah = useCallback(
    (surahId: number) => {
      onSelectSurah?.(surahId);
      router.push(`/surah/${surahId}` as any);
    },
    [onSelectSurah, router]
  );

  const renderStatusBadge = (status: JuzStatus) => {
    switch (status) {
      case 'completed':
        return (
          <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(13, 107, 78, 0.12)' }]}>
            <Feather name="check-circle" size={11} color={isDark ? '#22C55E' : '#0D6B4E'} />
            <Text style={[styles.statusBadgeText, { color: isDark ? '#22C55E' : '#0D6B4E' }]}>
              {isUz ? 'Yakunlangan' : 'Завершён'}
            </Text>
          </View>
        );
      case 'in_progress':
        return (
          <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(212, 167, 69, 0.2)' : 'rgba(212, 167, 69, 0.12)' }]}>
            <Feather name="clock" size={11} color={colors.secondaryDark} />
            <Text style={[styles.statusBadgeText, { color: colors.secondaryDark }]}>
              {isUz ? 'Jarayonda' : 'В процессе'}
            </Text>
          </View>
        );
      case 'not_started':
      default:
        return (
          <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.04)' }]}>
            <View style={[styles.statusDotEmpty, { backgroundColor: colors.textTertiary }]} />
            <Text style={[styles.statusBadgeText, { color: colors.textTertiary }]}>
              {isUz ? 'Boshlanmagan' : 'Не начат'}
            </Text>
          </View>
        );
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(300).duration(600).springify()} style={styles.outerContainer}>
      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.titleWrap}>
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: isDark ? 'rgba(13, 107, 78, 0.25)' : 'rgba(13, 107, 78, 0.1)' },
            ]}
          >
            <MaterialCommunityIcons name="view-grid-outline" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isUz ? 'Poralar bo‘yicha rivojlanish (30)' : 'Прогресс по Джузам (30)'}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {isUz ? "Muqaddas Qur'onning barcha 30 porasi" : 'Все 30 разделов Священного Корана'}
            </Text>
          </View>
        </View>
      </View>

      {/* Search Input Bar */}
      <View
        style={[
          styles.searchBarContainer,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            borderWidth: isDark ? 1 : 0,
          },
        ]}
      >
        <Feather name="search" size={16} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={isUz ? 'Pora yoki surani qidirish...' : 'Поиск джуза или суры...'}
          placeholderTextColor={colors.textTertiary}
          style={[styles.searchInput, { color: colors.text }]}
        />
        {searchQuery.length > 0 && (
          <AnimatedPressable onPress={() => setSearchQuery('')} haptic="light">
            <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
          </AnimatedPressable>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersRow}>
        {/* All */}
        <AnimatedPressable
          scaleValue={0.94}
          haptic="light"
          onPress={() => setActiveFilter('all')}
          style={[
            styles.filterPill,
            activeFilter === 'all'
              ? [styles.filterPillActive, { backgroundColor: colors.primary }]
              : [
                  styles.filterPillInactive,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  },
                ],
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              { color: activeFilter === 'all' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            {isUz ? `Barchasi (${calculatedJuzList.length})` : `Все (${calculatedJuzList.length})`}
          </Text>
        </AnimatedPressable>

        {/* In Progress */}
        <AnimatedPressable
          scaleValue={0.94}
          haptic="light"
          onPress={() => setActiveFilter('in_progress')}
          style={[
            styles.filterPill,
            activeFilter === 'in_progress'
              ? [styles.filterPillActive, { backgroundColor: colors.secondary }]
              : [
                  styles.filterPillInactive,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  },
                ],
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              { color: activeFilter === 'in_progress' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            {isUz ? `Jarayonda (${inProgressCount})` : `В процессе (${inProgressCount})`}
          </Text>
        </AnimatedPressable>

        {/* Completed */}
        <AnimatedPressable
          scaleValue={0.94}
          haptic="light"
          onPress={() => setActiveFilter('completed')}
          style={[
            styles.filterPill,
            activeFilter === 'completed'
              ? [styles.filterPillActive, { backgroundColor: '#10B981' }]
              : [
                  styles.filterPillInactive,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                  },
                ],
          ]}
        >
          <Text
            style={[
              styles.filterPillText,
              { color: activeFilter === 'completed' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            {isUz ? `Yakunlangan (${completedCount})` : `Завершённые (${completedCount})`}
          </Text>
        </AnimatedPressable>
      </View>

      {/* Juz Cards List */}
      <View style={styles.listContainer}>
        {filteredList.map((juz) => {
          const jNum = getJuzNumber(juz);
          const translit = getJuzNameTransliteration(juz, isUz);
          const status = getJuzStatus(juz);
          const surahs = getJuzSurahs(juz);
          const isExpanded = expandedJuz === jNum;

          return (
            <Animated.View
              key={jNum}
              layout={Layout.springify()}
              style={styles.cardWrapper}
            >
              <AnimatedPressable
                scaleValue={0.98}
                haptic="light"
                onPress={() => toggleExpand(jNum)}
              >
                <GlassView
                  borderRadius={radius.lg}
                  style={[
                    styles.juzCard,
                    isExpanded && {
                      borderColor: isDark ? 'rgba(212, 167, 69, 0.4)' : 'rgba(212, 167, 69, 0.3)',
                      borderWidth: 1,
                    },
                  ]}
                >
                  {/* Top Row: Number badge, Name + Status */}
                  <View style={styles.cardMainRow}>
                    {/* Gold Octagon Badge */}
                    <View style={styles.octagonContainer}>
                      <LinearGradient
                        colors={['#E4BF6A', '#D4A745', '#B8912E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.octagonBackground}
                      >
                        <Text style={styles.octagonNumberText}>{jNum}</Text>
                      </LinearGradient>
                    </View>

                    {/* Titles */}
                    <View style={styles.namesColumn}>
                      <View style={styles.transliterationRow}>
                        <Text style={[styles.transliterationText, { color: colors.text }]}>
                          {translit}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.arabicNameText,
                          {
                            color: colors.secondary,
                            fontFamily: fontFamilies.arabic,
                          },
                        ]}
                      >
                        {juz.nameArabic}
                      </Text>
                    </View>

                    {/* Status Badge + Expand arrow */}
                    <View style={styles.statusAndArrow}>
                      {renderStatusBadge(status)}
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.textTertiary}
                        style={styles.expandChevron}
                      />
                    </View>
                  </View>

                  {/* Progress Bar & Ayah Count */}
                  <View style={styles.cardProgressSection}>
                    <View style={styles.progressLabels}>
                      <Text style={[styles.ayahsProgressText, { color: colors.textSecondary }]}>
                        {juz.memorizedAyahs}/{juz.totalAyahs} {t('progress.ayahs', { defaultValue: 'аятов' })}
                      </Text>
                      <Text
                        style={[
                          styles.percentageLabel,
                          {
                            color:
                              status === 'completed'
                                ? colors.primary
                                : status === 'in_progress'
                                ? colors.secondaryDark
                                : colors.textTertiary,
                          },
                        ]}
                      >
                        {juz.percentage}%
                      </Text>
                    </View>

                    {/* Bar track */}
                    <View
                      style={[
                        styles.track,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.05)',
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={
                          status === 'completed'
                            ? ['#10B981', '#0D6B4E']
                            : [colors.secondaryLight, colors.secondary]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.fill,
                          {
                            width: `${Math.max(juz.percentage > 0 ? 4 : 0, Math.min(100, juz.percentage))}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Expandable Surah List */}
                  {isExpanded && (
                    <Animated.View
                      entering={FadeIn.duration(250)}
                      exiting={FadeOut.duration(200)}
                      style={styles.surahExpansionBox}
                    >
                      <View
                        style={[
                          styles.expansionDivider,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.05)',
                          },
                        ]}
                      />

                      <Text style={[styles.expansionHeader, { color: colors.textSecondary }]}>
                        {isUz ? `Bu poradagi suralar (${surahs.length}):` : `Суры в этом джузе (${surahs.length}):`}
                      </Text>

                      <View style={styles.surahsGrid}>
                        {surahs.map((surah: JuzSurahInfo) => (
                          <AnimatedPressable
                            key={surah.id}
                            scaleValue={0.96}
                            haptic="light"
                            onPress={() => handlePressSurah(surah.id)}
                            style={[
                              styles.surahChip,
                              {
                                backgroundColor: isDark
                                  ? 'rgba(255, 255, 255, 0.06)'
                                  : 'rgba(13, 107, 78, 0.05)',
                                borderColor: isDark
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(13, 107, 78, 0.12)',
                              },
                            ]}
                          >
                            <View style={styles.surahChipRow}>
                              <View style={styles.surahIdPill}>
                                <Text style={[styles.surahIdText, { color: colors.primary }]}>
                                  {surah.id}
                                </Text>
                              </View>
                              <View style={styles.surahChipNames}>
                                <Text style={[styles.surahRuName, { color: colors.text }]}>
                                  {isUz && surah.nameUz ? surah.nameUz : surah.nameRu}
                                </Text>
                                <Text
                                  style={[
                                    styles.surahArName,
                                    {
                                      color: colors.secondary,
                                      fontFamily: fontFamilies.arabic,
                                    },
                                  ]}
                                >
                                  {surah.nameArabic}
                                </Text>
                              </View>
                              <Text style={[styles.surahAyahSpan, { color: colors.textTertiary }]}>
                                {surah.startAyah}–{surah.endAyah} ({surah.totalAyahs ?? (surah.endAyah - surah.startAyah + 1)})
                              </Text>
                            </View>
                          </AnimatedPressable>
                        ))}
                      </View>
                    </Animated.View>
                  )}
                </GlassView>
              </AnimatedPressable>
            </Animated.View>
          );
        })}
      </View>

    </Animated.View>
  );
};

export const JuzProgressList = React.memo(JuzProgressListComponent);

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 14,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterPillActive: {},
  filterPillInactive: {},
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    gap: 10,
  },
  cardWrapper: {
    marginBottom: 2,
  },
  juzCard: {
    padding: 14,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  octagonContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  octagonBackground: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4A745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  octagonNumberText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  namesColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  transliterationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transliterationText: {
    fontSize: 14,
    fontWeight: '700',
  },
  arabicNameText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'left',
  },
  statusAndArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusDotEmpty: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  expandChevron: {
    marginLeft: 2,
  },
  cardProgressSection: {
    marginTop: 10,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  ayahsProgressText: {
    fontSize: 11,
    fontWeight: '500',
  },
  percentageLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  surahExpansionBox: {
    marginTop: 8,
  },
  expansionDivider: {
    height: 1,
    marginBottom: 10,
  },
  expansionHeader: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  surahsGrid: {
    gap: 6,
  },
  surahChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  surahChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  surahIdPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(13, 107, 78, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  surahIdText: {
    fontSize: 10,
    fontWeight: '800',
  },
  surahChipNames: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  surahRuName: {
    fontSize: 12,
    fontWeight: '600',
  },
  surahArName: {
    fontSize: 14,
    fontWeight: '600',
  },
  surahAyahSpan: {
    fontSize: 11,
    fontWeight: '500',
  },
});
