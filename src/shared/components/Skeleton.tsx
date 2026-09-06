import React from 'react';
import {
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MotiView } from 'moti';
import { useTheme } from '@/shared/theme';

export interface SkeletonProps {
  width: DimensionValue;
  height: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  radius = 8,
  style,
}) => {
  const { isDark } = useTheme();
  const baseColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  return (
    <MotiView
      from={{ opacity: 0.35 }}
      animate={{ opacity: 0.85 }}
      transition={{ type: 'timing', duration: 900, loop: true, repeatReverse: true }}
      style={[{ width, height, borderRadius: radius, backgroundColor: baseColor }, style]}
    />
  );
};

export interface SurahListSkeletonProps {
  count?: number;
  style?: StyleProp<ViewStyle>;
}

export const SurahListSkeleton: React.FC<SurahListSkeletonProps> = ({
  count = 6,
  style,
}) => (
  <View style={[styles.listContainer, style]}>
    {Array.from({ length: count }).map((_, index) => (
      <View key={`surah-skeleton-${index}`} style={styles.surahRow}>
        <Skeleton width={42} height={42} radius={21} />
        <View style={styles.surahInfo}>
          <Skeleton width="45%" height={16} radius={4} />
          <Skeleton width="28%" height={12} radius={4} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={68} height={22} radius={6} />
      </View>
    ))}
  </View>
);

export interface AyahSkeletonProps {
  style?: StyleProp<ViewStyle>;
}

export const AyahSkeleton: React.FC<AyahSkeletonProps> = ({ style }) => {
  const { isDark } = useTheme();
  const cardBg = isDark ? 'rgba(37, 37, 66, 0.6)' : 'rgba(255, 255, 255, 0.7)';

  return (
    <View style={[styles.ayahCard, { backgroundColor: cardBg }, style]}>
      <View style={styles.rowBetween}>
        <Skeleton width={32} height={32} radius={16} />
        <View style={styles.row}>
          <Skeleton width={28} height={28} radius={14} style={{ marginEnd: 8 }} />
          <Skeleton width={28} height={28} radius={14} />
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <Skeleton width="100%" height={26} radius={6} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={26} radius={6} style={{ alignSelf: 'flex-end' }} />
      </View>

      <View style={{ marginTop: 16 }}>
        <Skeleton width="92%" height={14} radius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={14} radius={4} />
      </View>

      <View style={[styles.row, { marginTop: 14 }]}>
        <Skeleton width={32} height={32} radius={16} style={{ marginEnd: 10 }} />
        <Skeleton width={32} height={32} radius={16} style={{ marginEnd: 10 }} />
        <Skeleton width={32} height={32} radius={16} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  surahRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  surahInfo: { flex: 1, marginStart: 14, marginEnd: 12 },
  ayahCard: { borderRadius: 20, padding: 16, marginHorizontal: 16, marginVertical: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
