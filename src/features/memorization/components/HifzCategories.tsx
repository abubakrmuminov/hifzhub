import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { GlassView, AnimatedPressable } from '@/shared/components';
import type { MemorizationCategory } from '../types';

export interface HifzCategoriesProps {
  sabaqCount: number;
  sabqiCount: number;
  manzilCount: number;
  onCategoryPress: (category: MemorizationCategory, count: number) => void;
}

export const HifzCategories: React.FC<HifzCategoriesProps> = ({
  sabaqCount,
  sabqiCount,
  manzilCount,
  onCategoryPress,
}) => {
  const { isDark, colors, spacing, radius } = useTheme();
  const { t } = useTranslation();

  const items: Array<{
    category: MemorizationCategory;
    count: number;
    titleKey: string;
    defaultTitle: string;
    descKey: string;
    defaultDesc: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }> = [
    {
      category: 'sabaq',
      count: sabaqCount,
      titleKey: 'hifz.sabaq',
      defaultTitle: 'Сабак',
      descKey: 'hifz.sabaqDesc',
      defaultDesc: 'Новые аяты',
      icon: 'book-outline',
      color: colors.primary,
    },
    {
      category: 'sabqi',
      count: sabqiCount,
      titleKey: 'hifz.sabqi',
      defaultTitle: 'Сабки',
      descKey: 'hifz.sabqiDesc',
      defaultDesc: 'Недавно выученные',
      icon: 'sync-outline',
      color: colors.secondary,
    },
    {
      category: 'manzil',
      count: manzilCount,
      titleKey: 'hifz.manzil',
      defaultTitle: 'Манзиль',
      descKey: 'hifz.manzilDesc',
      defaultDesc: 'Закреплённые',
      icon: 'shield-checkmark-outline',
      color: '#3498DB',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.sm }]}>
        {t('hifz.myProgress', { defaultValue: 'Мой прогресс' })}
      </Text>

      <View style={styles.grid}>
        {items.map((item) => (
          <AnimatedPressable
            key={item.category}
            onPress={() => onCategoryPress(item.category, item.count)}
            style={styles.cardWrapper}
          >
            <GlassView borderRadius={radius.md} style={styles.glass}>
              <View style={[styles.content, { padding: spacing.md }]}>
                <View style={styles.topRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        borderRadius: radius.full,
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.04)',
                      },
                    ]}
                  >
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={[styles.countText, { color: colors.text }]}>{item.count}</Text>
                </View>
                <Text style={[styles.titleText, { color: colors.text, marginTop: spacing.xs }]}>
                  {t(item.titleKey, { defaultValue: item.defaultTitle })}
                </Text>
                <Text style={[styles.descText, { color: colors.textSecondary }]}>
                  {t(item.descKey, { defaultValue: item.defaultDesc })}
                </Text>
              </View>
            </GlassView>
          </AnimatedPressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  cardWrapper: {
    flex: 1,
  },
  glass: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    minHeight: 112,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 18,
    fontWeight: '800',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  descText: {
    fontSize: 11,
    lineHeight: 14,
    minHeight: 28,
    marginTop: 2,
  },
});
