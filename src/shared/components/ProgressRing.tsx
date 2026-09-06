import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/shared/theme/colors';
import { TimingPresets } from '@/shared/constants/animations';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  centerText?: string;
  centerSubtext?: string;
  textColor?: string;
  testID?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 64,
  strokeWidth = 6,
  color = Colors.secondary,
  backgroundColor = 'rgba(0, 0, 0, 0.08)',
  showPercentage = true,
  centerText,
  centerSubtext,
  textColor,
  testID,
}) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    animatedProgress.value = withTiming(clampedProgress, TimingPresets.slow);
  }, [progress, animatedProgress]);

  const animatedProps = useAnimatedProps(() => {
    'worklet';
    return {
      strokeDashoffset: circumference * (1 - animatedProgress.value),
    };
  });

  const displayPercentage = `${Math.round(Math.min(Math.max(progress, 0), 1) * 100)}%`;
  const resolvedTextColor = textColor ?? Colors.light.text;

  return (
    <View style={[styles.container, { width: size, height: size }]} testID={testID}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Background Track Circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Progress Circle */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={animatedProps}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>

      <View style={[StyleSheet.absoluteFill, styles.centerContent]} pointerEvents="none">
        {centerText !== undefined ? (
          <Text
            style={[
              styles.percentageText,
              { color: resolvedTextColor, fontSize: Math.max(size * 0.22, 10) },
            ]}
            numberOfLines={1}
          >
            {centerText}
          </Text>
        ) : showPercentage ? (
          <Text
            style={[
              styles.percentageText,
              { color: resolvedTextColor, fontSize: Math.max(size * 0.22, 10) },
            ]}
            numberOfLines={1}
          >
            {displayPercentage}
          </Text>
        ) : null}

        {centerSubtext ? (
          <Text
            style={[
              styles.subtext,
              { color: resolvedTextColor, fontSize: Math.max(size * 0.14, 8) },
            ]}
            numberOfLines={1}
          >
            {centerSubtext}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  percentageText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  subtext: {
    fontWeight: '500',
    opacity: 0.7,
    textAlign: 'center',
  },
});
