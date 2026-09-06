import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components';

export type RatingValue = 'again' | 'hard' | 'good' | 'easy';

export interface RatingButtonsProps {
  onRate: (rating: RatingValue) => void;
  disabled?: boolean;
}

interface RatingConfig {
  rating: RatingValue;
  labelKey: string;
  defaultLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  colorKey: 'error' | 'warning' | 'primary' | 'info';
}

const RATING_CONFIGS: RatingConfig[] = [
  {
    rating: 'again',
    labelKey: 'hifz.ratingAgain',
    defaultLabel: 'Повторить',
    icon: 'refresh-outline',
    colorKey: 'error',
  },
  {
    rating: 'hard',
    labelKey: 'hifz.ratingHard',
    defaultLabel: 'Трудно',
    icon: 'alert-circle-outline',
    colorKey: 'warning',
  },
  {
    rating: 'good',
    labelKey: 'hifz.ratingGood',
    defaultLabel: 'Хорошо',
    icon: 'checkmark-circle-outline',
    colorKey: 'primary',
  },
  {
    rating: 'easy',
    labelKey: 'hifz.ratingEasy',
    defaultLabel: 'Легко',
    icon: 'rocket-outline',
    colorKey: 'info',
  },
];

export const RatingButtons: React.FC<RatingButtonsProps> = ({
  onRate,
  disabled = false,
}) => {
  const { colors, spacing, radius, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {RATING_CONFIGS.map((config, index) => {
        const itemColor = colors[config.colorKey];
        const label = t(config.labelKey, { defaultValue: config.defaultLabel });

        return (
          <Animated.View
            key={config.rating}
            entering={FadeInDown.delay(index * 80).duration(300)}
            style={[
              styles.buttonWrapper,
              index < RATING_CONFIGS.length - 1 && { marginEnd: spacing.xs },
            ]}
          >
            <AnimatedPressable
              onPress={() => onRate(config.rating)}
              disabled={disabled}
              haptic="medium"
              accessibilityRole="button"
              accessibilityLabel={label}
              style={[
                styles.button,
                {
                  borderRadius: radius.md,
                  backgroundColor: isDark
                    ? `${itemColor}1F`
                    : `${itemColor}14`,
                  borderColor: isDark
                    ? `${itemColor}40`
                    : `${itemColor}30`,
                  opacity: disabled ? 0.45 : 1,
                  paddingVertical: spacing.sm,
                },
              ]}
            >
              <Ionicons
                name={config.icon}
                size={22}
                color={itemColor}
                style={styles.icon}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  {
                    color: itemColor,
                  },
                ]}
              >
                {label}
              </Text>
            </AnimatedPressable>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  buttonWrapper: {
    flex: 1,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 4,
    minHeight: 68,
  },
  icon: {
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
