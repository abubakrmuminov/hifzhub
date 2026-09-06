import { useRef, useCallback } from 'react';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useTabBarStore } from '@/stores/tabBarStore';

export interface UseScrollTabBarOptions {
  threshold?: number;
}

export function useScrollTabBar(options?: UseScrollTabBarOptions) {
  const threshold = options?.threshold ?? 10;
  const lastScrollY = useRef(0);
  const setTabBarVisible = useTabBarStore((s) => s.setTabBarVisible);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const diff = currentY - lastScrollY.current;

      // When near the top of the page, always show the tab bar
      if (currentY <= 30) {
        setTabBarVisible(true);
      } else if (diff > threshold && currentY > 60) {
        // Scrolling DOWN -> smoothly hide tab bar
        setTabBarVisible(false);
      } else if (diff < -threshold) {
        // Scrolling UP -> smoothly restore tab bar
        setTabBarVisible(true);
      }

      lastScrollY.current = currentY;
    },
    [threshold, setTabBarVisible]
  );

  return {
    onScroll,
    scrollEventThrottle: 16,
  };
}
