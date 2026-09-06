import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import { initializeDatabase } from '@/db/init';
import { FullScreenPlayer } from '@/features/audio';
import { useSettingsStore } from '@/stores/settingsStore';

export interface RootLayoutProps {}

SplashScreen.preventAutoHideAsync();

export function RootLayout({}: RootLayoutProps) {
  const { t } = useTranslation();
  const [loaded, error] = useFonts({
    KFGQPC_HAFS: require('../assets/fonts/KFGQPC_HAFS.ttf'),
    Amiri: require('../assets/fonts/Amiri.ttf'),
  });
  const [dbReady, setDbReady] = useState(false);
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    async function initDb() {
      try {
        await initializeDatabase();
      } catch (err) {
        console.error('Failed to initialize database:', err);
      } finally {
        setDbReady(true);
      }
    }
    initDb();
  }, []);

  useEffect(() => {
    if ((loaded || error) && dbReady) {
      SplashScreen.hideAsync();
      if (!hasCompletedOnboarding) {
        router.replace('/onboarding');
      }
    }
  }, [loaded, error, dbReady, hasCompletedOnboarding]);

  if ((!loaded && !error) || !dbReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="settings"
          options={{ presentation: 'modal', title: t('common.settings') }}
        />
        <Stack.Screen
          name="surah/[id]"
          options={{
            headerShown: true,
            headerTintColor: '#0D6B4E',
            headerStyle: { backgroundColor: '#FFFFFF' },
            title: 'Surah',
          }}
        />
      </Stack>
      <FullScreenPlayer />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default RootLayout;
