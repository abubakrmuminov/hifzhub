import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/theme';
import { SurahList } from '@/features/quran/components/SurahList';

export interface QuranScreenProps {}

export const QuranScreen: React.FC<QuranScreenProps> = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SurahList />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default QuranScreen;
