import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme';

export interface SettingCardProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const SettingCard: React.FC<SettingCardProps> = ({
  title,
  icon,
  children,
  style,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceGlass,
          borderColor: colors.borderGlass,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.md,
          ...shadows.soft,
        },
        style,
      ]}
    >
      {title ? (
        <View style={[styles.header, { marginBottom: spacing.sm }]}>
          {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginEnd: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
});
