import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { toArabicDigits } from '@/features/quran/utils/quranUtils';

export interface PageDividerProps {
  pageNumber: number;
}

export const PageDivider: React.FC<PageDividerProps> = ({ pageNumber }) => {
  const { t } = useTranslation();
  const { colors, radius, spacing, fontFamilies } = useTheme();

  return (
    <View style={[styles.container, { marginVertical: spacing.md, paddingHorizontal: spacing.md }]}>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
      <View
        style={[
          styles.badge,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.full,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xxs + 2,
          },
        ]}
      >
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          {`${t('quran.page')} ${pageNumber}`}
          <Text style={[styles.arabicText, { color: colors.secondary, fontFamily: fontFamilies.arabic }]}>
            {` (${toArabicDigits(pageNumber)})`}
          </Text>
        </Text>
      </View>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
  },
  badge: {
    borderWidth: 1,
    marginHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  arabicText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
