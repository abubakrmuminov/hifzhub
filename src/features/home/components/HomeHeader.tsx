import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';

export interface HomeHeaderProps {}

export const HomeHeader: React.FC<HomeHeaderProps> = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { fontFamilies, spacing } = useTheme();

  return (
    <LinearGradient
      colors={['#063828', '#0D6B4E', '#128762']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16) + spacing.xs,
          paddingBottom: spacing.xl,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      {/* Subtle Islamic Geometric Pattern Overlay */}
      <View style={styles.patternOverlay} pointerEvents="none">
        <Svg width="100%" height="100%" opacity={0.08} viewBox="0 0 100 100">
          <Path
            d="M 50 0 L 100 50 L 50 100 L 0 50 Z"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          <Rect
            x="20"
            y="20"
            width="60"
            height="60"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1"
          />
          <Path
            d="M 25 0 L 75 100 M 75 0 L 25 100 M 0 25 L 100 75 M 0 75 L 100 25"
            stroke="#FFFFFF"
            strokeWidth="0.5"
          />
        </Svg>
      </View>

      <View style={styles.topRow}>
        <View style={styles.brandingContainer}>
          {/* Gold Arabic Calligraphy */}
          <Text
            style={[
              styles.arabicTitle,
              { fontFamily: fontFamilies.arabic },
            ]}
          >
            {t('home.arabicTitle')}
          </Text>

          {/* App Title */}
          <Text style={styles.appTitle}>{t('home.appName')}</Text>
        </View>

        {/* Settings Button */}
        <AnimatedPressable
          onPress={() => router.push('/settings')}
          accessibilityLabel={t('common.settings')}
          style={styles.settingsButton}
        >
          <Feather name="settings" size={20} color="#FFFFFF" />
        </AnimatedPressable>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFill,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  brandingContainer: {
    flex: 1,
  },
  arabicTitle: {
    fontSize: 20,
    color: '#D4A745',
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: 1,
    textAlign: 'left',
  },
  appTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: 16,
  },
});
