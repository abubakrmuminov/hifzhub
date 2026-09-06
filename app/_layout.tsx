import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { useTranslation } from 'react-i18next';
import '@/i18n';
import { initializeDatabase } from '@/db/init';
import { FullScreenPlayer } from '@/features/audio/components/FullScreenPlayer';
import { useSettingsStore } from '@/stores/settingsStore';

export interface RootLayoutProps {}

void SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

export function RootLayout({}: RootLayoutProps) {
  const { t } = useTranslation();
  const [loaded, error] = useFonts({
    ...Feather.font,
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
    KFGQPC_HAFS: require('../assets/fonts/KFGQPC_HAFS.ttf'),
    Amiri: require('../assets/fonts/Amiri.ttf'),
  });
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    async function initDb() {
      try {
        setDbError(null);
        await initializeDatabase();
        setDbReady(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setDbError(err instanceof Error ? err : new Error(String(err)));
        void SplashScreen.hideAsync();
      }
    }
    initDb();
  }, [attempt]);

  useEffect(() => {
    if ((loaded || error) && dbReady) {
      SplashScreen.hideAsync();
      if (!hasCompletedOnboarding) {
        router.replace('/onboarding');
      }
    }
  }, [loaded, error, dbReady, hasCompletedOnboarding]);

  if (dbError) {
    return <View style={[styles.container, { justifyContent: 'center', padding: 24 }]}>
      <Text accessibilityRole="alert">{t('common.error')}</Text>
      <Button title={t('common.retry')} onPress={() => setAttempt((value) => value + 1)} />
    </View>;
  }

  if ((!loaded && !error) || !dbReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default RootLayout;
