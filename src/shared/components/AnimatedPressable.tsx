import React, { useCallback } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
  type AccessibilityRole,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SpringPresets } from '@/shared/constants/animations';

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'none';

export interface AnimatedPressableProps {
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
  haptic?: HapticFeedbackType;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  hitSlop?: import('react-native').Insets | number;
  onLayout?: (event: import('react-native').LayoutChangeEvent) => void;
  testID?: string;
}

const triggerHaptic = (haptic: HapticFeedbackType): void => {
  switch (haptic) {
    case 'light':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'medium':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'heavy':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'none':
    default:
      break;
  }
};

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  onPress,
  onLongPress,
  children,
  style,
  scaleValue = 0.97,
  haptic = 'light',
  disabled = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  hitSlop,
  onLayout,
  testID,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(scaleValue, SpringPresets.snappy);
  }, [disabled, scale, scaleValue]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(1, SpringPresets.snappy);
  }, [disabled, scale]);

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) return;
      triggerHaptic(haptic);
      onPress?.(event);
    },
    [disabled, haptic, onPress]
  );

  const handleLongPress = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) return;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onLongPress?.(event);
    },
    [disabled, onLongPress]
  );

  return (
    <AnimatedPressableBase
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      hitSlop={hitSlop}
      onLayout={onLayout}
      testID={testID}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressableBase>
  );
};
