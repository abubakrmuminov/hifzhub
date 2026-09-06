import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

export const STAGGER_DELAY = 80;

export const SpringPresets = {
  gentle: {
    damping: 15,
    stiffness: 120,
    mass: 1,
  },
  bouncy: {
    damping: 12,
    stiffness: 200,
    mass: 1,
  },
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },
} as const satisfies Record<string, WithSpringConfig>;

export const TimingPresets = {
  fast: {
    duration: 150,
  },
  normal: {
    duration: 300,
  },
  slow: {
    duration: 500,
  },
} as const satisfies Record<string, WithTimingConfig>;

export const Animations = {
  spring: SpringPresets,
  timing: TimingPresets,
  staggerDelay: STAGGER_DELAY,
} as const;

export type SpringPresetKey = keyof typeof SpringPresets;
export type TimingPresetKey = keyof typeof TimingPresets;
