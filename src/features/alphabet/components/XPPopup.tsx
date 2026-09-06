import React, { useEffect } from 'react';
import { StyleSheet, Text, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/theme';

export interface XPPopupProps {
  xp: number;
  visible: boolean;
}

export const XPPopup: React.FC<XPPopupProps> = ({ xp, visible }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Haptic feedback on appear
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset values to initial state
      opacity.value = 0;
      translateY.value = 30;
      scale.value = 1;

      // 1. FadeIn + 3. After 1.5s FadeOut
      opacity.value = withSequence(
        withTiming(1, { duration: 250 }),
        withDelay(1500, withTiming(0, { duration: 300 }))
      );

      // 1. SlideInUp from 30px below + 3. After 1.5s SlideOutUp
      translateY.value = withSequence(
        withTiming(0, { duration: 250 }),
        withDelay(1500, withTiming(-30, { duration: 300 }))
      );

      // 2. Small scale bounce (1.0 -> 1.2 -> 1.0 using withSequence + withSpring)
      scale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 200 }),
        withSpring(1.0, { damping: 14, stiffness: 160 })
      );
    } else {
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, xp, opacity, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { top: Math.max(insets.top, 16) + 12 },
        animatedStyle,
      ]}
    >
      <Animated.View
        style={[
          styles.pill,
          { backgroundColor: colors.secondary },
        ]}
      >
        <Text style={styles.text}>+{xp} XP</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  pill: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#D4A745',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
  },
});
