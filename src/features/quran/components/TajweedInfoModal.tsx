import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
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
import type { TajweedRuleInfo } from '../services/tajweedParser';

export interface TajweedInfoModalProps {
  visible: boolean;
  rule: TajweedRuleInfo | null;
  matchedText?: string;
  onClose: () => void;
}

export const TajweedInfoModal: React.FC<TajweedInfoModalProps> = ({
  visible,
  rule,
  matchedText,
  onClose,
}) => {
  const { colors, spacing, radius, shadows, fontFamilies, isDark } = useTheme();
  const language = useSettingsStore((s) => s.language);
  const isUz = language === 'uz';

  const [activeRule, setActiveRule] = useState<TajweedRuleInfo | null>(rule);
  const [activeText, setActiveText] = useState<string | undefined>(matchedText);
  const isClosingRef = useRef(false);

  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(600);

  // Sync state and run enter animation
  useEffect(() => {
    if (visible && rule) {
      setActiveRule(rule);
      setActiveText(matchedText);
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
  }, [visible, rule, matchedText, backdropOpacity, sheetTranslateY]);

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

  const currentRule = rule ?? activeRule;
  const currentText = matchedText ?? activeText;

  if (!visible && !activeRule) return null;
  if (!currentRule) return null;

  const ruleColor = isDark ? currentRule.darkColor : currentRule.lightColor;
  const name = isUz ? currentRule.nameUz : currentRule.nameRu;
  const category = isUz ? currentRule.categoryUz : currentRule.categoryRu;
  const description = isUz ? currentRule.descriptionUz : currentRule.descriptionRu;
  const howToRead = isUz ? currentRule.howToReadUz : currentRule.howToReadRu;
  const duration = isUz ? currentRule.durationUz : currentRule.durationRu;

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
            {/* Header: Badge & Close Button */}
            <View style={styles.headerRow}>
              <View style={[styles.badgePill, { backgroundColor: ruleColor + '20', borderColor: ruleColor }]}>
                <View style={[styles.badgeDot, { backgroundColor: ruleColor }]} />
                <Text style={[styles.badgeText, { color: ruleColor }]}>
                  {category}
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

            {/* Rule Titles */}
            <View style={styles.titleSection}>
              <View style={styles.titleRow}>
                <Text style={[styles.ruleNameText, { color: colors.text }]}>
                  {name}
                </Text>
                <Text
                  style={[
                    styles.arabicNameText,
                    { color: ruleColor, fontFamily: fontFamilies.arabic },
                  ]}
                >
                  {currentRule.nameAr}
                </Text>
              </View>

              {currentText ? (
                <View
                  style={[
                    styles.previewBox,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      borderColor: ruleColor + '40',
                    },
                  ]}
                >
                  <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                    {isUz ? 'Oyatdagi so‘z:' : 'Слово в аяте:'}
                  </Text>
                  <Text
                    style={[
                      styles.previewArabic,
                      { color: ruleColor, fontFamily: fontFamilies.quran },
                    ]}
                  >
                    {currentText}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Description Card */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="information-circle-outline" size={18} color={ruleColor} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {isUz ? 'Qoida haqida' : 'Суть правила'}
                </Text>
              </View>
              <Text style={[styles.bodyText, { color: colors.text }]}>
                {description}
              </Text>
            </View>

            {/* How to Read / Pronunciation Instructions */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: ruleColor + (isDark ? '15' : '10'),
                  borderColor: ruleColor + '30',
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="mic-outline" size={18} color={ruleColor} />
                <Text style={[styles.cardTitle, { color: ruleColor, fontWeight: '700' }]}>
                  {isUz ? 'Qanday to‘g‘ri o‘qiladi?' : 'Как правильно читать?'}
                </Text>
              </View>
              <Text style={[styles.bodyText, { color: colors.text, lineHeight: 22 }]}>
                {howToRead}
              </Text>
            </View>

            {/* Meta Attributes: Duration & Letters */}
            <View style={styles.metaRow}>
              {duration ? (
                <View
                  style={[
                    styles.metaPill,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                >
                  <Ionicons name="time-outline" size={15} color={colors.secondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {duration}
                  </Text>
                </View>
              ) : null}

              {currentRule.lettersAr ? (
                <View
                  style={[
                    styles.metaPill,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                >
                  <Text style={[styles.lettersArabic, { color: colors.text, fontFamily: fontFamilies.arabic }]}>
                    {currentRule.lettersAr}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Bottom Dismiss Button */}
            <AnimatedPressable
              onPress={handleClose}
              style={[
                styles.doneButton,
                { backgroundColor: colors.primary, borderRadius: radius.lg, marginTop: spacing.md },
              ]}
            >
              <Text style={styles.doneButtonText}>
                {isUz ? 'Tushunarli' : 'Понятно'}
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
    maxHeight: '85%',
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
    alignItems: 'center',
    marginBottom: 12,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  ruleNameText: {
    fontSize: 22,
    fontWeight: '800',
  },
  arabicNameText: {
    fontSize: 26,
    fontWeight: '600',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  previewArabic: {
    fontSize: 26,
    writingDirection: 'rtl',
  },
  infoCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  lettersArabic: {
    fontSize: 15,
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
