import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/theme';
import { useScrollTabBar } from '@/shared/hooks/useScrollTabBar';
import {
  HomeHeader,
  HomeStatsRow,
  HomeProgressCard,
  HomeTodayTasks,
  HomeAyahOfTheDay,
} from '@/features/home/components';

export interface HomeScreenProps {}

export function HomeScreen({}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const { onScroll, scrollEventThrottle } = useScrollTabBar();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + spacing.xl + 60,
          },
        ]}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        {/* 1. Header Section */}
        <HomeHeader />

        {/* 2. Stats Row (Daily Goal + Streak) */}
        <HomeStatsRow />

        {/* 3. My Progress Card (Dynamically tracks last read surah) */}
        <HomeProgressCard />

        {/* 4. Today's Tasks Checklist */}
        <HomeTodayTasks />

        {/* 5. Ayah of the Day ("Аят дня") with audio & read actions */}
        <HomeAyahOfTheDay />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default HomeScreen;
