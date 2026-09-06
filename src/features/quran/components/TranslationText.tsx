import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme';

export interface TranslationTextProps {
  text: string;
  translator: string;
  style?: StyleProp<ViewStyle>;
}

export const TranslationText = React.memo<TranslationTextProps>(({
  text,
  translator,
  style,
}) => {
  const { colors, spacing, fontSizes } = useTheme();

  return (
    <View style={[styles.container, { marginTop: spacing.xs }, style]}>
      <Text
        style={[
          styles.translation,
          {
            color: colors.textSecondary,
            fontSize: fontSizes.sm,
          },
        ]}
      >
        {text}
      </Text>
      {translator ? (
        <Text
          style={[
            styles.translator,
            {
              color: colors.textTertiary,
              fontSize: fontSizes.xs,
              marginTop: spacing.xxs,
            },
          ]}
        >
          — {translator}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  translation: {
    lineHeight: 22,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  translator: {
    fontStyle: 'italic',
    textAlign: 'right',
  },
});
