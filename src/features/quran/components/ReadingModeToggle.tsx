import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme';
import type { ReadingMode } from '@/stores/settingsStore';

import { LinearGradient } from 'expo-linear-gradient';

export interface ReadingModeToggleProps {
  mode: ReadingMode;
  onModeChange: (mode: ReadingMode) => void;
}

export const ReadingModeToggle = React.memo<ReadingModeToggleProps>(({
  mode,
  onModeChange,
}) => {
  const { t } = useTranslation();
  const { colors, radius, shadows, isDark } = useTheme();

  // 0 = translation, 1 = mushaf
  const activeIndex = mode === 'translation' ? 0 : 1;
  const slideAnim = useSharedValue(activeIndex);
  const [tabWidth, setTabWidth] = useState(0);

  useEffect(() => {
    slideAnim.value = withSpring(activeIndex, {
      damping: 20,
      stiffness: 220,
      mass: 0.7,
    });
  }, [activeIndex, slideAnim]);

  const handlePress = (targetMode: ReadingMode) => {
    if (targetMode !== mode) {
      void Haptics.selectionAsync();
      onModeChange(targetMode);
    }
  };

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const totalWidth = e.nativeEvent.layout.width - 8; // minus 4px padding on each side
    if (totalWidth > 0) {
      setTabWidth(totalWidth / 2);
    }
  };

  const pillStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: slideAnim.value * tabWidth }],
      width: tabWidth,
    };
  });

  return (
    <View
      onLayout={onContainerLayout}
      style={[
        styles.container,
        shadows.soft,
        {
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.18)'
            : 'rgba(255, 255, 255, 0.95)',
          borderRadius: radius.full,
        },
      ]}
    >
      {/* Glossy Glass Track Gradient */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(45, 45, 78, 0.88)', 'rgba(25, 25, 45, 0.88)']
            : ['rgba(255, 255, 255, 0.96)', 'rgba(238, 244, 240, 0.88)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.full }]}
      />

      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.slidingPill,
            pillStyle,
          ]}
        >
          <LinearGradient
            colors={['#18C28A', '#0D6B4E', '#084834']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: radius.full,
                shadowColor: '#0D6B4E',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
              },
            ]}
          />
        </Animated.View>
      )}

      <Pressable
        onPress={() => handlePress('translation')}
        style={styles.button}
      >
        <Ionicons
          name="book-outline"
          size={16}
          color={mode === 'translation' ? '#FFFFFF' : colors.textSecondary}
          style={styles.icon}
        />
        <Text
          style={[
            styles.label,
            {
              color: mode === 'translation' ? '#FFFFFF' : colors.textSecondary,
              fontWeight: mode === 'translation' ? '700' : '500',
            },
          ]}
        >
          {t('quran.translationMode')}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => handlePress('mushaf')}
        style={styles.button}
      >
        <Ionicons
          name="reader-outline"
          size={16}
          color={mode === 'mushaf' ? '#FFFFFF' : colors.textSecondary}
          style={styles.icon}
        />
        <Text
          style={[
            styles.label,
            {
              color: mode === 'mushaf' ? '#FFFFFF' : colors.textSecondary,
              fontWeight: mode === 'mushaf' ? '700' : '500',
            },
          ]}
        >
          {t('quran.mushafMode')}
        </Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'center',
    padding: 4,
    borderWidth: 1.5,
    marginVertical: 12,
    position: 'relative',
    minWidth: 280,
    overflow: 'hidden',
  },
  slidingPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 1,
  },
  icon: {
    marginEnd: 6,
  },
  label: {
    fontSize: 13,
  },
});
