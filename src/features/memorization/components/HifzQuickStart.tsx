import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable, GlassView } from '@/shared/components';

export interface QuickSurahOption {
  id: string;
  surahId: number;
  fromAyah: number;
  toAyah: number;
  titleRu: string;
  titleUz: string;
  arabicName: string;
  badgeRu: string;
  badgeUz: string;
  ayahCount: number;
  icon: keyof typeof Ionicons.glyphMap;
}

export const RECOMMENDED_START_SURAHS: QuickSurahOption[] = [
  {
    id: 'fatiha',
    surahId: 1,
    fromAyah: 1,
    toAyah: 7,
    titleRu: 'Аль-Фатиха',
    titleUz: 'Fotiha',
    arabicName: 'الفاتحة',
    badgeRu: 'Рекомендуется для старта',
    badgeUz: 'Boshlash uchun tavsiya',
    ayahCount: 7,
    icon: 'star',
  },
  {
    id: 'ikhlas',
    surahId: 112,
    fromAyah: 1,
    toAyah: 4,
    titleRu: 'Аль-Ихлас',
    titleUz: 'Ixlos',
    arabicName: 'الإخلاص',
    badgeRu: '1/3 Корана',
    badgeUz: 'Qur\'onning 1/3 qismi',
    ayahCount: 4,
    icon: 'heart',
  },
  {
    id: 'falaq',
    surahId: 113,
    fromAyah: 1,
    toAyah: 5,
    titleRu: 'Аль-Фаляк',
    titleUz: 'Falaq',
    arabicName: 'الفلق',
    badgeRu: 'Защитные аяты',
    badgeUz: 'Himoya oyatlari',
    ayahCount: 5,
    icon: 'shield-checkmark',
  },
  {
    id: 'nas',
    surahId: 114,
    fromAyah: 1,
    toAyah: 6,
    titleRu: 'Ан-Нас',
    titleUz: 'Nos',
    arabicName: 'الناس',
    badgeRu: 'Защитные аяты',
    badgeUz: 'Himoya oyatlari',
    ayahCount: 6,
    icon: 'shield-checkmark',
  },
  {
    id: 'kursi',
    surahId: 2,
    fromAyah: 255,
    toAyah: 255,
    titleRu: 'Аят аль-Курси',
    titleUz: 'Oyatul Kursiy',
    arabicName: 'آية الكرسي',
    badgeRu: 'Величайший аят',
    badgeUz: 'Ulug\'vor oyat',
    ayahCount: 1,
    icon: 'ribbon',
  },
];

export interface HifzQuickStartProps {
  onSelectQuickSurah: (surahId: number, fromAyah: number, toAyah: number) => void;
  onOpenCustomPicker: () => void;
}

export const HifzQuickStart: React.FC<HifzQuickStartProps> = ({
  onSelectQuickSurah,
  onOpenCustomPicker,
}) => {
  const { colors, spacing, radius, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const isUz = i18n.language === 'uz';

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.container}>
      <View style={[styles.titleSection, { marginBottom: spacing.sm }]}>
        <View style={styles.titleRow}>
          <Ionicons name="compass-outline" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text, marginStart: 6 }]}>
            {t('hifz.quickStartTitle', { defaultValue: 'С чего начнём заучивание?' })}
          </Text>
        </View>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginTop: 2 }]}>
          {t('hifz.quickStartSubtitle', {
            defaultValue: 'Выберите суру — и сразу начнется интерактивный тренажёр:',
          })}
        </Text>
      </View>

      <View style={styles.cardsList}>
        {RECOMMENDED_START_SURAHS.map((item, index) => {
          const title = isUz ? item.titleUz : item.titleRu;
          const badge = isUz ? item.badgeUz : item.badgeRu;

          return (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(index * 60).duration(350)}
              style={{ marginBottom: spacing.sm }}
            >
              <GlassView
                borderRadius={radius.lg}
                style={[
                  styles.surahCard,
                  {
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)',
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(255, 255, 255, 0.90)',
                    padding: spacing.md,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: `${colors.primary}18`,
                          borderRadius: radius.full,
                        },
                      ]}
                    >
                      <Ionicons name={item.icon} size={18} color={colors.primary} />
                    </View>

                    <View style={{ marginStart: spacing.sm }}>
                      <Text style={[styles.surahTitle, { color: colors.text }]}>
                        {title}
                      </Text>
                      <Text style={[styles.badgeText, { color: colors.secondary }]}>
                        {badge} • {item.ayahCount}{' '}
                        {t('hifz.ayahsWord', { defaultValue: 'аят(ов)' })}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.arabicCalligraphy, { color: colors.text }]}>
                    {item.arabicName}
                  </Text>
                </View>

                {/* Start Learning Button */}
                <AnimatedPressable
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onSelectQuickSurah(item.surahId, item.fromAyah, item.toAyah);
                  }}
                  style={[
                    styles.startBtn,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: radius.md,
                      marginTop: spacing.sm,
                    },
                  ]}
                >
                  <Text style={styles.startBtnText}>
                    {t('hifz.startLearningBtn', { defaultValue: 'Начать заучивание' })}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginStart: 4 }} />
                </AnimatedPressable>
              </GlassView>
            </Animated.View>
          );
        })}
      </View>

      {/* Custom Surah Picker CTA */}
      <AnimatedPressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onOpenCustomPicker();
        }}
        style={[
          styles.customPickerBtn,
          {
            borderColor: colors.primary,
            borderRadius: radius.md,
            marginTop: spacing.xs,
          },
        ]}
      >
        <Ionicons name="search" size={16} color={colors.primary} />
        <Text style={[styles.customPickerText, { color: colors.primary, marginStart: 6 }]}>
          {t('hifz.chooseOtherSurah', { defaultValue: 'Выбрать другую суру из Корана...' })}
        </Text>
      </AnimatedPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  titleSection: {},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  cardsList: {
    width: '100%',
  },
  surahCard: {
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  arabicCalligraphy: {
    fontSize: 20,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  customPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  customPickerText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
