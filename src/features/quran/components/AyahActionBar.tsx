import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/shared/theme';
import { GlassView } from '@/shared/components/GlassView';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import type { Ayah } from '@/db/schema';

export interface AyahActionBarProps {
  ayah: Ayah;
  surahName: string;
  surahArabic?: string;
  translationText?: string;
  onClose: () => void;
  onPlay: () => void;
}

export const AyahActionBar: React.FC<AyahActionBarProps> = ({
  ayah,
  surahName,
  surahArabic,
  translationText,
  onClose,
  onPlay,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, radius, spacing, fontFamilies, isDark } = useTheme();
  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const bookmarked = isBookmarked(ayah.id);

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const parts = [ayah.textUthmani];
    if (translationText) {
      parts.push(`«${translationText}»`);
    }
    const attribution = surahArabic
      ? `— Сура ${surahName} (${surahArabic}), Аят ${ayah.ayahNumber}`
      : `— Сура ${surahName}, Аят ${ayah.ayahNumber}`;
    parts.push(attribution);

    await Clipboard.setStringAsync(parts.join('\n\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleBookmark = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleBookmark(ayah);
  };

  const handlePlay = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPlay();
  };

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(16).stiffness(180)}
      exiting={SlideOutDown.duration(200)}
      style={[
        styles.wrapper,
        {
          bottom: Math.max(insets.bottom, 12) + 6,
          paddingHorizontal: spacing.sm,
        },
      ]}
    >
      <GlassView borderRadius={radius.xl} style={styles.container}>
        {/* Header with Title and Close Button */}
        <View style={styles.headerRow}>
          <View style={styles.titleWithIcon}>
            <View style={[styles.iconPill, { backgroundColor: colors.secondary + '20' }]}>
              <Ionicons name="sparkles" size={13} color={colors.secondary} />
            </View>
            <Text style={[styles.surahMetaText, { color: colors.textSecondary }]}>
              {`${surahName} • Аят ${ayah.ayahNumber}`}
            </Text>
          </View>

          <AnimatedPressable
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={[
              styles.closeButton,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(0,0,0,0.06)',
              },
            ]}
            accessibilityLabel="Close toolbar"
          >
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </AnimatedPressable>
        </View>

        {/* 1-Line Arabic Preview Snippet */}
        <Text
          numberOfLines={1}
          style={[
            styles.arabicSnippet,
            {
              fontFamily: fontFamilies.quran,
              color: colors.text,
            },
          ]}
        >
          {ayah.textUthmani}
        </Text>

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          {/* Copy Button */}
          <AnimatedPressable
            onPress={handleCopy}
            style={[
              styles.actionButton,
              {
                backgroundColor: copied
                  ? colors.primary + '22'
                  : isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.05)',
              },
            ]}
          >
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={15}
              color={copied ? colors.primary : colors.text}
              style={styles.actionIcon}
            />
            <Text
              style={[
                styles.actionText,
                { color: copied ? colors.primary : colors.text },
              ]}
            >
              {copied ? 'Скопировано' : 'Копировать'}
            </Text>
          </AnimatedPressable>

          {/* Bookmark / Save Button */}
          <AnimatedPressable
            onPress={handleToggleBookmark}
            style={[
              styles.actionButton,
              {
                backgroundColor: bookmarked
                  ? colors.secondary + '24'
                  : isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.05)',
              },
            ]}
          >
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={15}
              color={bookmarked ? colors.secondaryDark : colors.text}
              style={styles.actionIcon}
            />
            <Text
              style={[
                styles.actionText,
                { color: bookmarked ? colors.secondaryDark : colors.text },
              ]}
            >
              {bookmarked ? 'В закладках' : 'Сохранить'}
            </Text>
          </AnimatedPressable>

          {/* Play / Listen Button */}
          <AnimatedPressable onPress={handlePlay} style={styles.playButtonWrapper}>
            <LinearGradient
              colors={['#1DCF90', '#0D6B4E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.playButton, { borderRadius: radius.md }]}
            >
              <Ionicons name="play" size={15} color="#FFFFFF" style={styles.actionIcon} />
              <Text style={styles.playButtonText}>Слушать</Text>
            </LinearGradient>
          </AnimatedPressable>
        </View>
      </GlassView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    start: 0,
    end: 0,
    zIndex: 1000,
  },
  container: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahMetaText: {
    fontSize: 13,
    fontWeight: '700',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabicSnippet: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'right',
    marginVertical: 4,
    opacity: 0.9,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionIcon: {
    marginEnd: 5,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  playButtonWrapper: {
    flex: 1.1,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});