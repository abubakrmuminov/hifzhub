import React, { useRef, useEffect } from 'react';
import { Tabs, usePathname } from 'expo-router';
import { BottomTabBar, type BottomTabBarProps } from 'expo-router/tabs';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { GlobalMiniPlayer } from '@/features/audio';
import { useTabBarStore } from '@/stores/tabBarStore';

export interface TabLayoutProps {}

const TabBarBackground = React.memo<{ isDark: boolean }>(({ isDark }) => (
  <View
    style={[
      StyleSheet.absoluteFill,
      { borderRadius: 32, overflow: 'hidden' },
    ]}
  >
    <BlurView
      intensity={85}
      tint={isDark ? 'dark' : 'light'}
      style={StyleSheet.absoluteFill}
    />
    {/* Frosted glass diffusion layer */}
    <LinearGradient
      colors={
        isDark
          ? ['rgba(26, 26, 48, 0.72)', 'rgba(15, 15, 30, 0.80)']
          : ['rgba(255, 255, 255, 0.68)', 'rgba(242, 248, 244, 0.52)']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    {/* Top specular glaze line */}
    <LinearGradient
      colors={
        isDark
          ? ['rgba(255, 255, 255, 0.22)', 'rgba(255, 255, 255, 0)']
          : ['rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0)']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 14,
      }}
    />
  </View>
));

export function TabLayout({}: TabLayoutProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const pathname = usePathname();

  const isTabBarVisible = useTabBarStore((s) => s.isTabBarVisible);
  const setTabBarVisible = useTabBarStore((s) => s.setTabBarVisible);

  // Restore tab bar whenever active tab changes
  useEffect(() => {
    setTabBarVisible(true);
  }, [pathname, setTabBarVisible]);

  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(isTabBarVisible ? 0 : 130, {
      damping: 20,
      stiffness: 170,
      mass: 0.8,
    });
  }, [isTabBarVisible, translateY]);

  const animTabBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const renderTabBar = React.useCallback(
    (props: BottomTabBarProps) => (
      <Animated.View
        style={[styles.animatedTabBarWrapper, animTabBarStyle]}
        pointerEvents={isTabBarVisible ? 'auto' : 'none'}
      >
        <BottomTabBar {...props} />
      </Animated.View>
    ),
    [animTabBarStyle, isTabBarVisible]
  );

  const screenOptions = React.useMemo(
    () => ({
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: isDark ? '#A6A6BC' : '#52545A',
      tabBarShowLabel: true,
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '700' as const,
        letterSpacing: 0.2,
        marginTop: -2,
        marginBottom: 3,
      },
      tabBarItemStyle: {
        paddingTop: 6,
        paddingBottom: 2,
      },
      tabBarStyle: {
        position: 'absolute' as const,
        bottom: Math.max(insets.bottom, 10) + 6,
        left: 16,
        right: 16,
        height: 64,
        borderRadius: 32,
        borderWidth: 1.2,
        borderColor: isDark
          ? 'rgba(255, 255, 255, 0.16)'
          : 'rgba(255, 255, 255, 0.75)',
        backgroundColor: 'transparent' as const,
        elevation: 0,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.35 : 0.08,
        shadowRadius: 18,
      },
      tabBarBackground: () => <TabBarBackground isDark={isDark} />,
      headerShown: false,
    }),
    [colors.primary, isDark, insets.bottom]
  );

  return (
    <View style={styles.targetContainer}>
      <Tabs
        tabBar={renderTabBar}
        screenOptions={screenOptions}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ color, size, focused }) => (
              <Feather
                name="home"
                size={focused ? size + 1 : size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="learn"
          options={{
            title: t('tabs.learn'),
            tabBarIcon: ({ color, size, focused }) => (
              <Feather
                name="book-open"
                size={focused ? size + 1 : size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="quran"
          options={{
            title: t('tabs.quran'),
            tabBarIcon: ({ color, size, focused }) => (
              <Feather
                name="book"
                size={focused ? size + 1 : size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="memorize"
          options={{
            title: t('tabs.hifz'),
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons
                name="brain"
                size={focused ? size + 1 : size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: t('tabs.progress'),
            tabBarIcon: ({ color, size, focused }) => (
              <Feather
                name="bar-chart-2"
                size={focused ? size + 1 : size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
      <GlobalMiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  targetContainer: {
    flex: 1,
  },
  animatedTabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default TabLayout;
