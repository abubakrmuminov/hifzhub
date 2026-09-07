import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components';

export interface SurahItem {
  id: number;
  name: string;
  arabicName: string;
  ayahCount: number;
}

export interface SurahPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (surahId: number, fromAyah: number, toAyah: number) => void;
  surahs: SurahItem[];
  alreadyMemorized?: Set<string>;
}

interface SurahPickerItemProps {
  item: SurahItem;
  isSelected: boolean;
  memorized: number;
  isFullyMemorized: boolean;
  onSelect: (surah: SurahItem) => void;
  colors: any;
  radius: any;
  spacing: any;
  isDark: boolean;
  ayahsCountText: string;
  memorizedText: string;
}

const SurahPickerItem = React.memo<SurahPickerItemProps>(({
  item,
  isSelected,
  memorized,
  isFullyMemorized,
  onSelect,
  colors,
  radius,
  spacing,
  isDark,
  ayahsCountText,
  memorizedText,
}) => {
  return (
    <AnimatedPressable
      onPress={() => onSelect(item)}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.arabicName}`}
      style={[
        styles.surahItem,
        {
          borderRadius: radius.md,
          borderColor: isSelected
            ? colors.primary
            : isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.06)',
          backgroundColor: isSelected
            ? isDark
              ? 'rgba(13, 107, 78, 0.18)'
              : 'rgba(13, 107, 78, 0.08)'
            : isDark
            ? 'rgba(255, 255, 255, 0.03)'
            : 'rgba(0, 0, 0, 0.02)',
          opacity: isFullyMemorized && !isSelected ? 0.6 : 1,
          marginBottom: spacing.xs,
        },
      ]}
    >
      {/* Left: ID badge and Names */}
      <View style={styles.surahLeft}>
        <View
          style={[
            styles.surahIdBadge,
            {
              borderRadius: radius.sm,
              backgroundColor: isSelected
                ? colors.primary
                : isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <Text
            style={[
              styles.surahIdText,
              {
                color: isSelected ? '#FFFFFF' : colors.textSecondary,
              },
            ]}
          >
            {item.id}
          </Text>
        </View>

        <View style={[styles.surahNames, { marginStart: spacing.sm }]}>
          <Text
            style={[
              styles.surahName,
              {
                color: colors.text,
                fontWeight: isSelected ? '700' : '600',
              },
            ]}
          >
            {item.name}
          </Text>
          <Text style={[styles.ayahCountText, { color: colors.textTertiary }]}>
            {ayahsCountText}
            {memorized > 0 && (
              <Text style={{ color: colors.secondary }}>
                {` • ${memorizedText}`}
              </Text>
            )}
          </Text>
        </View>
      </View>

      {/* Right: Arabic Name */}
      <View style={styles.surahRight}>
        <Text
          style={[
            styles.arabicNameText,
            {
              color: isSelected ? colors.primary : colors.textSecondary,
              fontFamily: undefined,
            },
          ]}
        >
          {item.arabicName}
        </Text>
        {isFullyMemorized && (
          <View style={[styles.memorizedCheck, { marginStart: spacing.xs }]}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={colors.success}
            />
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
});

export const SurahPickerSheet: React.FC<SurahPickerSheetProps> = ({
  visible,
  onClose,
  onConfirm,
  surahs,
  alreadyMemorized,
}) => {
  const { colors, spacing, radius, isDark } = useTheme();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSurahId, setSelectedSurahId] = useState<number | null>(null);
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(5);

  const selectedSurah = useMemo(
    () => surahs.find((s) => s.id === selectedSurahId) || null,
    [surahs, selectedSurahId]
  );

  // Initialize selection when sheet becomes visible
  useEffect(() => {
    if (visible && surahs.length > 0 && selectedSurahId === null) {
      const firstSurah = surahs[0];
      setSelectedSurahId(firstSurah.id);
      setFromAyah(1);
      setToAyah(Math.min(3, firstSurah.ayahCount));
    }
  }, [visible, surahs, selectedSurahId]);

  // Handle selecting a different surah
  const handleSelectSurah = React.useCallback((surah: SurahItem) => {
    setSelectedSurahId(surah.id);
    setFromAyah(1);
    setToAyah(Math.min(3, surah.ayahCount));
  }, []);

  // Filter surahs by search query
  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return surahs;
    const q = searchQuery.toLowerCase().trim();
    return surahs.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.arabicName.includes(q) ||
        String(s.id) === q
    );
  }, [surahs, searchQuery]);

  // Precompute memorized counts by surahId in a single pass O(K) where K = memorized count
  const memorizedCountsBySurah = useMemo(() => {
    const counts: Record<number, number> = {};
    if (!alreadyMemorized || alreadyMemorized.size === 0) return counts;
    for (const key of alreadyMemorized) {
      const idx = key.indexOf('_');
      if (idx > 0) {
        const sId = Number(key.slice(0, idx));
        counts[sId] = (counts[sId] || 0) + 1;
      }
    }
    return counts;
  }, [alreadyMemorized]);

  // Check how many ayahs in current selected range are already memorized
  const memorizedInRangeCount = useMemo(() => {
    if (!selectedSurah || !alreadyMemorized) return 0;
    let count = 0;
    for (let i = fromAyah; i <= toAyah; i++) {
      if (alreadyMemorized.has(`${selectedSurah.id}_${i}`)) {
        count++;
      }
    }
    return count;
  }, [selectedSurah, alreadyMemorized, fromAyah, toAyah]);

  const ayahCountToAdd = Math.max(0, toAyah - fromAyah + 1);

  // Step adjusters
  const updateFrom = (delta: number) => {
    if (!selectedSurah) return;
    const nextVal = Math.min(Math.max(1, fromAyah + delta), toAyah);
    setFromAyah(nextVal);
  };

  const updateTo = (delta: number) => {
    if (!selectedSurah) return;
    const nextVal = Math.min(Math.max(fromAyah, toAyah + delta), selectedSurah.ayahCount);
    setToAyah(nextVal);
  };

  const setPresetRange = (count: number) => {
    if (!selectedSurah) return;
    if (count === -1) {
      // Entire surah
      setFromAyah(1);
      setToAyah(selectedSurah.ayahCount);
    } else {
      setToAyah(Math.min(selectedSurah.ayahCount, fromAyah + count - 1));
    }
  };

  const handleConfirm = () => {
    if (!selectedSurah) return;
    onConfirm(selectedSurah.id, fromAyah, toAyah);
    onClose();
  };

  const renderSurahItem = React.useCallback(
    ({ item }: { item: SurahItem }) => {
      const isSelected = item.id === selectedSurahId;
      const memorized = memorizedCountsBySurah[item.id] || 0;
      const isFullyMemorized = memorized === item.ayahCount && item.ayahCount > 0;

      return (
        <SurahPickerItem
          item={item}
          isSelected={isSelected}
          memorized={memorized}
          isFullyMemorized={isFullyMemorized}
          onSelect={handleSelectSurah}
          colors={colors}
          radius={radius}
          spacing={spacing}
          isDark={isDark}
          ayahsCountText={t('hifz.ayahsCount', {
            defaultValue: `${item.ayahCount} аятов`,
            count: item.ayahCount,
          })}
          memorizedText={t('hifz.memorizedCount', {
            defaultValue: `${memorized} выучено`,
            count: memorized,
          })}
        />
      );
    },
    [selectedSurahId, memorizedCountsBySurah, handleSelectSurah, colors, radius, spacing, isDark, t]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
            },
          ]}
        >
          {/* Top Handle / Drag indicator */}
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.handleBar,
                {
                  borderRadius: radius.full,
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.20)'
                    : 'rgba(0, 0, 0, 0.15)',
                },
              ]}
            />
          </View>

          {/* Header */}
          <View style={[styles.headerRow, { paddingHorizontal: spacing.md }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {t('hifz.selectSurahTitle', { defaultValue: 'Выбор суры для заучивания' })}
            </Text>
            <AnimatedPressable
              onPress={onClose}
              haptic="light"
              accessibilityRole="button"
              accessibilityLabel={t('hifz.close', { defaultValue: 'Закрыть' })}
              style={[
                styles.closeButton,
                {
                  borderRadius: radius.full,
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </AnimatedPressable>
          </View>

          {/* Search bar */}
          <View style={[styles.searchContainer, { marginHorizontal: spacing.md, marginVertical: spacing.sm }]}>
            <View
              style={[
                styles.searchInputWrapper,
                {
                  borderRadius: radius.md,
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.04)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={18}
                color={colors.textTertiary}
                style={styles.searchIcon}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('hifz.searchSurah', {
                  defaultValue: 'Поиск суры по названию или номеру...',
                })}
                placeholderTextColor={colors.textTertiary}
                style={[styles.searchInput, { color: colors.text }]}
                returnKeyType="search"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  style={styles.clearSearchBtn}
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={colors.textTertiary}
                  />
                </Pressable>
              )}
            </View>
          </View>

          {/* Surah List */}
          <FlatList
            data={filteredSurahs}
            keyExtractor={(item) => `surah-${item.id}`}
            contentContainerStyle={[styles.listContent, { paddingHorizontal: spacing.md }]}
            style={styles.list}
            renderItem={renderSurahItem}
          />

          {/* Ayah Range Picker Section for Selected Surah */}
          {selectedSurah && (
            <View
              style={[
                styles.rangeSection,
                {
                  padding: spacing.md,
                  borderTopColor: isDark
                    ? 'rgba(255, 255, 255, 0.10)'
                    : 'rgba(0, 0, 0, 0.08)',
                  backgroundColor: isDark
                    ? 'rgba(30, 30, 52, 0.95)'
                    : 'rgba(255, 255, 255, 0.98)',
                },
              ]}
            >
              <View style={styles.rangeHeaderRow}>
                <Text style={[styles.rangeSectionTitle, { color: colors.text }]}>
                  {t('hifz.ayahRangeTitle', { defaultValue: 'Диапазон аятов:' })}{' '}
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>
                    {selectedSurah.name}
                  </Text>
                </Text>
                <Text style={[styles.maxAyahInfo, { color: colors.textTertiary }]}>
                  {`1 – ${selectedSurah.ayahCount}`}
                </Text>
              </View>

              {/* Steppers row: From Ayah ... To Ayah */}
              <View style={[styles.steppersRow, { marginVertical: spacing.sm }]}>
                {/* From Ayah */}
                <View style={styles.stepperGroup}>
                  <Text style={[styles.stepperLabel, { color: colors.textSecondary }]}>
                    {t('hifz.fromAyah', { defaultValue: 'С аята' })}
                  </Text>
                  <View
                    style={[
                      styles.stepperBox,
                      {
                        borderRadius: radius.md,
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.12)'
                          : 'rgba(0, 0, 0, 0.10)',
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                      },
                    ]}
                  >
                    <AnimatedPressable
                      onPress={() => updateFrom(-1)}
                      disabled={fromAyah <= 1}
                      style={styles.stepBtn}
                    >
                      <Ionicons
                        name="remove"
                        size={18}
                        color={fromAyah <= 1 ? colors.textTertiary : colors.text}
                      />
                    </AnimatedPressable>
                    <Text style={[styles.stepperValue, { color: colors.text }]}>
                      {fromAyah}
                    </Text>
                    <AnimatedPressable
                      onPress={() => updateFrom(1)}
                      disabled={fromAyah >= toAyah}
                      style={styles.stepBtn}
                    >
                      <Ionicons
                        name="add"
                        size={18}
                        color={fromAyah >= toAyah ? colors.textTertiary : colors.text}
                      />
                    </AnimatedPressable>
                  </View>
                </View>

                {/* Arrow indicator */}
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={colors.textTertiary}
                  style={styles.stepperArrow}
                />

                {/* To Ayah */}
                <View style={styles.stepperGroup}>
                  <Text style={[styles.stepperLabel, { color: colors.textSecondary }]}>
                    {t('hifz.toAyah', { defaultValue: 'По аят' })}
                  </Text>
                  <View
                    style={[
                      styles.stepperBox,
                      {
                        borderRadius: radius.md,
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.12)'
                          : 'rgba(0, 0, 0, 0.10)',
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                      },
                    ]}
                  >
                    <AnimatedPressable
                      onPress={() => updateTo(-1)}
                      disabled={toAyah <= fromAyah}
                      style={styles.stepBtn}
                    >
                      <Ionicons
                        name="remove"
                        size={18}
                        color={toAyah <= fromAyah ? colors.textTertiary : colors.text}
                      />
                    </AnimatedPressable>
                    <Text style={[styles.stepperValue, { color: colors.text }]}>
                      {toAyah}
                    </Text>
                    <AnimatedPressable
                      onPress={() => updateTo(1)}
                      disabled={toAyah >= selectedSurah.ayahCount}
                      style={styles.stepBtn}
                    >
                      <Ionicons
                        name="add"
                        size={18}
                        color={
                          toAyah >= selectedSurah.ayahCount
                            ? colors.textTertiary
                            : colors.text
                        }
                      />
                    </AnimatedPressable>
                  </View>
                </View>
              </View>

              {/* Preset range shortcuts */}
              <View style={styles.presetsRow}>
                {[3, 5, 10].map((preset) => (
                  <AnimatedPressable
                    key={`preset-${preset}`}
                    onPress={() => setPresetRange(preset)}
                    style={[
                      styles.presetChip,
                      {
                        borderRadius: radius.full,
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.12)'
                          : 'rgba(0, 0, 0, 0.10)',
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                        marginEnd: spacing.xs,
                      },
                    ]}
                  >
                    <Text style={[styles.presetText, { color: colors.textSecondary }]}>
                      {`+${preset} ${t('hifz.ayahsShort', { defaultValue: 'аятов' })}`}
                    </Text>
                  </AnimatedPressable>
                ))}

                <AnimatedPressable
                  onPress={() => setPresetRange(-1)}
                  style={[
                    styles.presetChip,
                    {
                      borderRadius: radius.full,
                      borderColor: isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : 'rgba(0, 0, 0, 0.10)',
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.03)',
                    },
                  ]}
                >
                  <Text style={[styles.presetText, { color: colors.textSecondary }]}>
                    {t('hifz.allSurah', { defaultValue: 'Вся сура' })}
                  </Text>
                </AnimatedPressable>
              </View>

              {/* Notice if already memorized ayahs are included */}
              {memorizedInRangeCount > 0 && (
                <View style={[styles.memorizedWarning, { marginTop: spacing.xs }]}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.warning}
                    style={styles.warningIcon}
                  />
                  <Text
                    style={[styles.warningText, { color: colors.warning }]}
                  >
                    {memorizedInRangeCount === ayahCountToAdd
                      ? t('hifz.allSelectedAlreadyInPlan', {
                          defaultValue: 'Все выбранные аяты уже в вашем плане заучивания',
                        })
                      : t('hifz.alreadyMemorizedNotice', {
                          defaultValue: `${memorizedInRangeCount} из выбранных аятов уже в вашем плане`,
                          count: memorizedInRangeCount,
                        })}
                  </Text>
                </View>
              )}

              {/* Confirm button */}
              {(() => {
                const newAyahsCount = Math.max(0, ayahCountToAdd - memorizedInRangeCount);
                const isFullyAdded = newAyahsCount === 0 && ayahCountToAdd > 0;

                return (
                  <AnimatedPressable
                    onPress={handleConfirm}
                    disabled={ayahCountToAdd <= 0 || isFullyAdded}
                    haptic="medium"
                    accessibilityRole="button"
                    style={[
                      styles.confirmButton,
                      {
                        borderRadius: radius.md,
                        backgroundColor: isFullyAdded ? colors.textTertiary : colors.primary,
                        marginTop: spacing.md,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isFullyAdded ? 'checkmark-circle-outline' : 'add-outline'}
                      size={20}
                      color="#FFFFFF"
                      style={styles.confirmIcon}
                    />
                    <Text style={styles.confirmText}>
                      {isFullyAdded
                        ? t('hifz.alreadyAddedInPlan', { defaultValue: 'Уже добавлены в план' })
                        : t('hifz.addAyahsCount', {
                            defaultValue: `Добавить ${newAyahsCount} аятов в план`,
                            count: newAyahsCount,
                          })}
                    </Text>
                  </AnimatedPressable>
                );
              })()}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheetContainer: {
    maxHeight: '90%',
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: 6,
  },
  searchContainer: {},
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    height: 44,
  },
  searchIcon: {
    marginEnd: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  clearSearchBtn: {
    padding: 4,
  },
  list: {
    maxHeight: 250,
  },
  listContent: {
    paddingVertical: 4,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
  },
  surahLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  surahIdBadge: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahIdText: {
    fontSize: 12,
    fontWeight: '700',
  },
  surahNames: {
    flex: 1,
  },
  surahName: {
    fontSize: 15,
  },
  ayahCountText: {
    fontSize: 12,
    marginTop: 2,
  },
  surahRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arabicNameText: {
    fontSize: 18,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  memorizedCheck: {
    marginStart: 6,
  },
  rangeSection: {
    borderTopWidth: 1,
  },
  rangeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  maxAyahInfo: {
    fontSize: 12,
  },
  steppersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperGroup: {
    flex: 1,
  },
  stepperLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    height: 42,
    paddingHorizontal: 6,
  },
  stepBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'center',
  },
  stepperArrow: {
    marginHorizontal: 10,
    marginTop: 18,
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '500',
  },
  memorizedWarning: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {
    marginEnd: 4,
  },
  warningText: {
    fontSize: 11,
    flex: 1,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmIcon: {
    marginEnd: 6,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
