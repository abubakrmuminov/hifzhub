import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Platform,
  BackHandler,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  TAJWEED_FAMILY_GUIDES,
  type TajweedFamilyGuide,
} from '../services/tajweedParser';

export interface TajweedLegendModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TajweedLegendModal: React.FC<TajweedLegendModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, spacing, radius, shadows, fontFamilies, isDark } = useTheme();
  const language = useSettingsStore((s) => s.language);
  const showTajweed = useSettingsStore((s) => s.showTajweed);
  const setShowTajweed = useSettingsStore((s) => s.setShowTajweed);

  const isUz = language === 'uz';

  const [activeVisible, setActiveVisible] = useState(visible);
  const isClosingRef = useRef(false);

  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(600);

  // Sync state and run enter animation
  useEffect(() => {
    if (visible) {
      setActiveVisible(true);
      isClosingRef.current = false;
      backdropOpacity.value = 0;
      sheetTranslateY.value = 600;

      backdropOpacity.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.quad),
      });
      sheetTranslateY.value = withTiming(0, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [visible, backdropOpacity, sheetTranslateY]);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    backdropOpacity.value = withTiming(0, {
      duration: 180,
      easing: Easing.in(Easing.quad),
    });
    sheetTranslateY.value = withTiming(
      600,
      {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(onClose)();
        }
      }
    );
  }, [onClose, backdropOpacity, sheetTranslateY]);

  // Hardware back button on Android
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, handleClose]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  if (!visible && !activeVisible) return null;

  const handleToggle = (value: boolean) => {
    void Haptics.selectionAsync();
    setShowTajweed(value);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.modalAligner}>
        {/* Fixed stationary backdrop that dims in place without sliding */}
        <Animated.View
          style={[
            styles.backdrop,
            { backgroundColor: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.45)' },
            backdropAnimatedStyle,
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Smooth non-spring bottom sheet */}
        <Animated.View
          style={[
            styles.sheetContainer,
            shadows.strong,
            {
              backgroundColor: isDark ? '#1C1C2E' : '#FFFFFF',
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingBottom: Platform.OS === 'ios' ? 36 : spacing.lg,
            },
            sheetAnimatedStyle,
          ]}
        >
          {/* Top Grabber */}
          <View style={styles.grabberRow}>
            <View
              style={[
                styles.grabber,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
              ]}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {isUz ? 'Tajvid ranglari qo‘llanmasi' : 'Шпаргалка цветов Таджвида'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {isUz
                    ? 'Qur’on tilovatida harflar ranglarining ma’nosi'
                    : 'Значение цветовых акцентов в тексте Корана'}
                </Text>
              </View>

              <Pressable
                onPress={handleClose}
                hitSlop={12}
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                ]}
              >
                <Feather name="x" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Quick Toggle Switch in Modal */}
            <View
              style={[
                styles.toggleCard,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <View style={styles.toggleTextCol}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>
                  {isUz ? 'Rangli tajvid belgilarini ko‘rsatish' : 'Цветная разметка Таджвида'}
                </Text>
                <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
                  {showTajweed
                    ? isUz
                      ? 'Qoidalar matnda rang bilan ajratilgan'
                      : 'Правила выделены в арабской вязи'
                    : isUz
                      ? 'Klassik qora matn (belgilarsiz)'
                      : 'Классический строгий шрифт'}
                </Text>
              </View>
              <Switch
                value={showTajweed}
                onValueChange={handleToggle}
                trackColor={{
                  false: isDark ? '#333333' : '#E0E0E0',
                  true: colors.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Family Legend Cards */}
            <View style={styles.listContainer}>
              {TAJWEED_FAMILY_GUIDES.map((guide: TajweedFamilyGuide) => {
                const guideColor = isDark ? guide.colorDark : guide.colorLight;
                const name = isUz ? guide.nameUz : guide.nameRu;
                const summary = isUz ? guide.summaryUz : guide.summaryRu;

                return (
                  <View
                    key={guide.family}
                    style={[
                      styles.legendCard,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                        borderColor: guideColor + '30',
                      },
                    ]}
                  >
                    <View style={styles.legendTopRow}>
                      <View style={styles.legendNameCol}>
                        <View style={styles.legendDotNameRow}>
                          <View style={[styles.colorDot, { backgroundColor: guideColor }]} />
                          <Text style={[styles.legendNameText, { color: colors.text }]}>
                            {name}
                          </Text>
                        </View>
                        <Text style={[styles.legendSummaryText, { color: colors.textSecondary }]}>
                          {summary}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.arabicBadge,
                          {
                            backgroundColor: guideColor + (isDark ? '20' : '15'),
                            borderColor: guideColor + '40',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.arabicNameText,
                            { color: guideColor, fontFamily: fontFamilies.arabic },
                          ]}
                        >
                          {guide.nameAr}
                        </Text>
                      </View>
                    </View>

                    {guide.exampleLetters ? (
                      <View
                        style={[
                          styles.exampleBox,
                          {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          },
                        ]}
                      >
                        <Text style={[styles.exampleLabel, { color: colors.textSecondary }]}>
                          {isUz ? 'Harflar:' : 'Буквы:'}
                        </Text>
                        <Text
                          style={[
                            styles.exampleLetters,
                            { color: guideColor, fontFamily: fontFamilies.arabic },
                          ]}
                        >
                          {guide.exampleLetters}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>

            {/* Close button */}
            <AnimatedPressable
              onPress={handleClose}
              style={[
                styles.doneButton,
                { backgroundColor: colors.primary, borderRadius: radius.lg, marginTop: spacing.md },
              ]}
            >
              <Text style={styles.doneButtonText}>
                {isUz ? 'Yopish' : 'Закрыть'}
              </Text>
            </AnimatedPressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalAligner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '88%',
    paddingTop: 10,
  },
  grabberRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  toggleTextCol: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  toggleSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  listContainer: {
    gap: 10,
  },
  legendCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  legendTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  legendNameCol: {
    flex: 1,
    marginRight: 10,
  },
  legendDotNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendNameText: {
    fontSize: 15,
    fontWeight: '700',
  },
  legendSummaryText: {
    fontSize: 13,
    lineHeight: 18,
  },
  arabicBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  arabicNameText: {
    fontSize: 17,
    fontWeight: '600',
  },
  exampleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  exampleLetters: {
    fontSize: 16,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  doneButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
