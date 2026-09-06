import React from 'react';
import { View, StyleSheet, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/shared/theme';

export interface GlassViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
}

export const GlassView: React.FC<GlassViewProps> = ({
  children,
  style,
  borderRadius = 24,
}) => {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.outerContainer,
        {
          borderRadius,
          borderWidth: isDark ? 1 : 0,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
        },
        style,
      ]}
    >
      {/* Frosted Glass Body Gradient */}
      <LinearGradient
        colors={
          isDark
            ? [
                'rgba(45, 45, 78, 0.88)',
                'rgba(30, 30, 54, 0.80)',
                'rgba(22, 22, 40, 0.88)',
              ]
            : [
                'rgba(255, 255, 255, 0.98)',
                'rgba(255, 255, 255, 0.88)',
                'rgba(246, 250, 248, 0.94)',
              ]
        }
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />

      {/* Top Specular Glaze / Light Sheen */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0)']
            : ['rgba(255, 255, 255, 0.90)', 'rgba(255, 255, 255, 0.05)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.7 }}
        style={[
          styles.topSheen,
          {
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
          },
        ]}
      />

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    overflow: 'hidden',
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#0D6B4E',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  topSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 18,
    pointerEvents: 'none',
  },
});
