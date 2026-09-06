import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components';

export interface StepProgressBarProps {
  currentStep: number; // 0-indexed
  totalSteps: number;
  onClose: () => void;
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStep,
  totalSteps,
  onClose,
}) => {
  const { isDark, colors, spacing } = useTheme();

  // 0-indexed step: step 0 of 10 displays "1/10"
  const stepDisplay =
    totalSteps > 0 ? Math.min(Math.max(currentStep + 1, 0), totalSteps) : 0;

  // Fraction for progress bar (clamped between 0 and 1)
  const progressFraction =
    totalSteps > 0
      ? Math.min(Math.max((currentStep + 1) / totalSteps, 0), 1)
      : 0;

  const animatedProgress = useSharedValue(progressFraction);

  useEffect(() => {
    animatedProgress.value = withTiming(progressFraction, { duration: 300 });
  }, [progressFraction, animatedProgress]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 12,
        },
      ]}
    >
      {/* Close (X) Button */}
      <AnimatedPressable
        onPress={onClose}
        haptic="light"
        accessibilityRole="button"
        accessibilityLabel="Close lesson"
        hitSlop={10}
        style={[
          styles.closeButton,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.05)',
          },
        ]}
      >
        <Feather name="x" size={20} color={colors.text} />
      </AnimatedPressable>

      {/* Progress Bar Track */}
      <View
        style={[
          styles.track,
          {
            backgroundColor: isDark ? '#1F2937' : '#E5E7EB',
            marginHorizontal: 14,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: colors.primary,
            },
            animatedFillStyle,
          ]}
        />
      </View>

      {/* Step Counter */}
      <Text
        style={[
          styles.counterText,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        {stepDisplay}/{totalSteps}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 38,
    textAlign: 'right',
  },
});
