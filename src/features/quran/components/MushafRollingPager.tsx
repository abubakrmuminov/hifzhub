import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  clampIndex,
  initialBases,
  pageForBase,
  pagesForLogical,
  type SlotBase,
} from './mushafPagerMath';

export interface MushafRollingPagerRef {
  /** Jump to a page without swipe animation (audio sync, deep links). */
  setPage: (index: number) => void;
  /** Animated flip to adjacent page (nav buttons). */
  flipPage: (direction: 'prev' | 'next') => void;
}

export interface MushafRollingPagerProps {
  pageCount: number;
  pageIndex: number;
  onPageChange: (index: number) => void;
  onPageScrollIdle?: (index: number) => void;
  renderPage: (pageIndex: number) => React.ReactNode;
  renderPlaceholder?: () => React.ReactNode;
  /** Fired after a settle (never during drag). true while the user is flicking fast. */
  onRapidPagingChange?: (rapid: boolean) => void;
  layoutDirection?: 'ltr' | 'rtl';
  style?: StyleProp<ViewStyle>;
}

const ANIM_DURATION = 200;
const ANIM_EASING = Easing.out(Easing.cubic);
const SWIPE_RATIO = 0.18;
const VELOCITY_THRESHOLD = 750;
const RUBBER_BAND = 0.28;
const RAPID_RESTORE_MS = 320;

export const MushafRollingPager = forwardRef<
  MushafRollingPagerRef,
  MushafRollingPagerProps
>(function MushafRollingPager(
  {
    pageCount,
    pageIndex,
    onPageChange,
    onPageScrollIdle,
    renderPage,
    onRapidPagingChange,
    layoutDirection = 'rtl',
    style,
  },
  ref
) {
  const rtl = layoutDirection === 'rtl';
  const rtlSV = useSharedValue(rtl ? 1 : 0);

  const logicalRef = useRef(clampIndex(pageIndex, pageCount));
  const pageCountRef = useRef(pageCount);
  const prevPageCountRef = useRef(pageCount);
  pageCountRef.current = pageCount;

  const basesRef = useRef<[SlotBase, SlotBase, SlotBase]>(initialBases());
  const [slotPages, setSlotPages] = useState<[number, number, number]>(() =>
    pagesForLogical(logicalRef.current, pageCount, rtl, basesRef.current)
  );
  const slotPagesRef = useRef(slotPages);
  slotPagesRef.current = slotPages;

  const widthRef = useRef(0);
  const widthSV = useSharedValue(0);
  const [measured, setMeasured] = useState(false);

  const slotX0 = useSharedValue(0);
  const slotX1 = useSharedValue(0);
  const slotX2 = useSharedValue(0);

  const start0 = useSharedValue(0);
  const start1 = useSharedValue(0);
  const start2 = useSharedValue(0);

  const lockedSV = useSharedValue(0);
  const atStartSV = useSharedValue(logicalRef.current <= 0 ? 1 : 0);
  const atEndSV = useSharedValue(
    logicalRef.current >= Math.max(0, pageCount - 1) ? 1 : 0
  );

  const lockedRef = useRef(false);
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;
  const onIdleRef = useRef(onPageScrollIdle);
  onIdleRef.current = onPageScrollIdle;
  const onRapidRef = useRef(onRapidPagingChange);
  onRapidRef.current = onRapidPagingChange;
  const rapidTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markRapidPaging = useCallback(() => {
    onRapidRef.current?.(true);
    if (rapidTimerRef.current) clearTimeout(rapidTimerRef.current);
    rapidTimerRef.current = setTimeout(() => {
      rapidTimerRef.current = null;
      onRapidRef.current?.(false);
    }, RAPID_RESTORE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (rapidTimerRef.current) clearTimeout(rapidTimerRef.current);
    };
  }, []);

  const setEdgeFlags = useCallback((logical: number, count: number) => {
    atStartSV.value = logical <= 0 ? 1 : 0;
    atEndSV.value = logical >= Math.max(0, count - 1) ? 1 : 0;
  }, [atEndSV, atStartSV]);

  const snapSlotsToBases = useCallback(
    (width: number) => {
      const [b0, b1, b2] = basesRef.current;
      slotX0.value = b0 * width;
      slotX1.value = b1 * width;
      slotX2.value = b2 * width;
    },
    [slotX0, slotX1, slotX2]
  );

  const unlock = useCallback(() => {
    lockedRef.current = false;
    lockedSV.value = 0;
  }, [lockedSV]);

  const applyWindow = useCallback(
    (logical: number, announce: boolean) => {
      const count = pageCountRef.current;
      const nextLogical = clampIndex(logical, count);
      logicalRef.current = nextLogical;
      basesRef.current = initialBases();
      const nextPages = pagesForLogical(
        nextLogical,
        count,
        rtl,
        basesRef.current
      );
      slotPagesRef.current = nextPages;
      setSlotPages(nextPages);
      snapSlotsToBases(widthRef.current);
      setEdgeFlags(nextLogical, count);
      if (announce) {
        onPageChangeRef.current(nextLogical);
        onIdleRef.current?.(nextLogical);
      }
      unlock();
    },
    [rtl, setEdgeFlags, snapSlotsToBases, unlock]
  );

  const recycleAfterSwipe = useCallback(
    (direction: 'next' | 'prev') => {
      const width = widthRef.current;
      const count = pageCountRef.current;
      const bases: SlotBase[] = [...basesRef.current];
      const left = bases.findIndex((b) => b === -1);
      const center = bases.findIndex((b) => b === 0);
      const right = bases.findIndex((b) => b === 1);
      if (left < 0 || center < 0 || right < 0) {
        applyWindow(logicalRef.current, true);
        return;
      }

      const xs = [slotX0, slotX1, slotX2];
      const pages = [...slotPagesRef.current] as [number, number, number];

      if (direction === 'next') {
        logicalRef.current = clampIndex(logicalRef.current + 1, count);
        if (rtl) {
          bases[left] = 0;
          bases[center] = 1;
          bases[right] = -1;
          pages[right] = pageForBase(logicalRef.current, -1, count, true);
          xs[left].value = 0;
          xs[center].value = width;
          xs[right].value = -width;
        } else {
          bases[right] = 0;
          bases[center] = -1;
          bases[left] = 1;
          pages[left] = pageForBase(logicalRef.current, 1, count, false);
          xs[right].value = 0;
          xs[center].value = -width;
          xs[left].value = width;
        }
      } else {
        logicalRef.current = clampIndex(logicalRef.current - 1, count);
        if (rtl) {
          bases[right] = 0;
          bases[center] = -1;
          bases[left] = 1;
          pages[left] = pageForBase(logicalRef.current, 1, count, true);
          xs[right].value = 0;
          xs[center].value = -width;
          xs[left].value = width;
        } else {
          bases[left] = 0;
          bases[center] = 1;
          bases[right] = -1;
          pages[right] = pageForBase(logicalRef.current, -1, count, false);
          xs[left].value = 0;
          xs[center].value = width;
          xs[right].value = -width;
        }
      }

      basesRef.current = [bases[0], bases[1], bases[2]] as [
        SlotBase,
        SlotBase,
        SlotBase,
      ];
      slotPagesRef.current = pages;
      markRapidPaging();
      setSlotPages(pages);
      setEdgeFlags(logicalRef.current, count);
      onPageChangeRef.current(logicalRef.current);
      onIdleRef.current?.(logicalRef.current);
      unlock();
    },
    [applyWindow, markRapidPaging, rtl, setEdgeFlags, slotX0, slotX1, slotX2, unlock]
  );

  const settleFromGesture = useCallback(
    (translationX: number, velocityX: number) => {
      lockedRef.current = true;
      const width = widthRef.current;
      if (width <= 0) {
        unlock();
        return;
      }

      const logical = logicalRef.current;
      const count = pageCountRef.current;
      const atStart = logical <= 0;
      const atEnd = logical >= Math.max(0, count - 1);
      const nextSign = rtl ? 1 : -1;

      const passedDistance = Math.abs(translationX) > width * SWIPE_RATIO;
      const passedVelocity = Math.abs(velocityX) > VELOCITY_THRESHOLD;
      const movingToNext = translationX * nextSign > 0;
      const movingToPrev = translationX * nextSign < 0;

      let direction: 'next' | 'prev' | 'cancel' = 'cancel';
      if ((passedDistance || passedVelocity) && movingToNext && !atEnd) {
        direction = 'next';
      } else if ((passedDistance || passedVelocity) && movingToPrev && !atStart) {
        direction = 'prev';
      }

      const targetDx =
        direction === 'next'
          ? nextSign * width
          : direction === 'prev'
          ? -nextSign * width
          : 0;

      const dest0 = start0.value + targetDx;
      const dest1 = start1.value + targetDx;
      const dest2 = start2.value + targetDx;
      const config = { duration: ANIM_DURATION, easing: ANIM_EASING };

      slotX0.value = withTiming(dest0, config);
      slotX1.value = withTiming(dest1, config);
      slotX2.value = withTiming(dest2, config, (finished) => {
        'worklet';
        if (!finished) {
          runOnJS(unlock)();
          return;
        }
        if (direction === 'cancel') {
          runOnJS(unlock)();
        } else {
          runOnJS(recycleAfterSwipe)(direction);
        }
      });
    },
    [
      recycleAfterSwipe,
      rtl,
      slotX0,
      slotX1,
      slotX2,
      start0,
      start1,
      start2,
      unlock,
    ]
  );

  const animateFlip = useCallback(
    (direction: 'prev' | 'next') => {
      if (lockedRef.current || pageCountRef.current <= 1) return;
      const logical = logicalRef.current;
      const count = pageCountRef.current;
      if (direction === 'next' && logical >= count - 1) return;
      if (direction === 'prev' && logical <= 0) return;

      const width = widthRef.current;
      if (width <= 0) {
        applyWindow(logical + (direction === 'next' ? 1 : -1), true);
        return;
      }

      lockedRef.current = true;
      lockedSV.value = 1;
      cancelAnimation(slotX0);
      cancelAnimation(slotX1);
      cancelAnimation(slotX2);

      start0.value = slotX0.value;
      start1.value = slotX1.value;
      start2.value = slotX2.value;

      const nextSign = rtl ? 1 : -1;
      const targetDx = direction === 'next' ? nextSign * width : -nextSign * width;
      const config = { duration: ANIM_DURATION, easing: ANIM_EASING };

      slotX0.value = withTiming(start0.value + targetDx, config);
      slotX1.value = withTiming(start1.value + targetDx, config);
      slotX2.value = withTiming(start2.value + targetDx, config, (finished) => {
        'worklet';
        if (!finished) {
          runOnJS(unlock)();
          return;
        }
        runOnJS(recycleAfterSwipe)(direction);
      });
    },
    [
      applyWindow,
      lockedSV,
      recycleAfterSwipe,
      rtl,
      slotX0,
      slotX1,
      slotX2,
      start0,
      start1,
      start2,
      unlock,
    ]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-14, 14])
        .failOffsetY([-28, 28])
        .onBegin(() => {
          if (lockedSV.value === 1) return;
          cancelAnimation(slotX0);
          cancelAnimation(slotX1);
          cancelAnimation(slotX2);
          start0.value = slotX0.value;
          start1.value = slotX1.value;
          start2.value = slotX2.value;
        })
        .onUpdate((e) => {
          if (lockedSV.value === 1) return;
          let dx = e.translationX;
          const nextSign = rtlSV.value === 1 ? 1 : -1;
          const movingToNext = dx * nextSign > 0;
          const movingToPrev = dx * nextSign < 0;
          if (atEndSV.value === 1 && movingToNext) {
            dx *= RUBBER_BAND;
          } else if (atStartSV.value === 1 && movingToPrev) {
            dx *= RUBBER_BAND;
          }
          slotX0.value = start0.value + dx;
          slotX1.value = start1.value + dx;
          slotX2.value = start2.value + dx;
        })
        .onEnd((e) => {
          if (lockedSV.value === 1) return;
          lockedSV.value = 1;
          runOnJS(settleFromGesture)(e.translationX, e.velocityX);
        })
        .onFinalize((_, success) => {
          if (!success && lockedSV.value === 0) {
            const width = widthSV.value;
            if (width > 0) {
              slotX0.value = withTiming(start0.value, {
                duration: 160,
                easing: ANIM_EASING,
              });
              slotX1.value = withTiming(start1.value, {
                duration: 160,
                easing: ANIM_EASING,
              });
              slotX2.value = withTiming(start2.value, {
                duration: 160,
                easing: ANIM_EASING,
              });
            }
          }
        }),
    [
      atEndSV,
      atStartSV,
      lockedSV,
      rtlSV,
      settleFromGesture,
      slotX0,
      slotX1,
      slotX2,
      start0,
      start1,
      start2,
      widthSV,
    ]
  );

  useImperativeHandle(
    ref,
    () => ({
      setPage: (targetIndex: number) => {
        if (targetIndex < 0 || targetIndex >= pageCountRef.current) return;
        if (targetIndex === logicalRef.current) return;
        lockedRef.current = true;
        lockedSV.value = 1;
        applyWindow(targetIndex, true);
      },
      flipPage: (direction: 'prev' | 'next') => {
        animateFlip(direction);
      },
    }),
    [animateFlip, applyWindow, lockedSV]
  );

  useEffect(() => {
    rtlSV.value = rtl ? 1 : 0;
  }, [rtl, rtlSV]);

  useEffect(() => {
    if (pageCount <= 0) return;
    const clamped = clampIndex(pageIndex, pageCount);
    const pageCountUnchanged = pageCount === prevPageCountRef.current;
    prevPageCountRef.current = pageCount;
    if (clamped === logicalRef.current && pageCountUnchanged) {
      return;
    }
    if (lockedRef.current && Math.abs(clamped - logicalRef.current) <= 1) {
      return;
    }
    lockedRef.current = true;
    lockedSV.value = 1;
    applyWindow(clamped, false);
  }, [pageIndex, pageCount, applyWindow, lockedSV]);

  const onLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number } } }) => {
      const nextWidth = Math.round(e.nativeEvent.layout.width);
      if (nextWidth <= 0 || nextWidth === widthRef.current) return;
      widthRef.current = nextWidth;
      widthSV.value = nextWidth;
      snapSlotsToBases(nextWidth);
      if (!measured) setMeasured(true);
    },
    [measured, snapSlotsToBases, widthSV]
  );

  const style0 = useAnimatedStyle(() => ({
    transform: [{ translateX: slotX0.value }],
  }));
  const style1 = useAnimatedStyle(() => ({
    transform: [{ translateX: slotX1.value }],
  }));
  const style2 = useAnimatedStyle(() => ({
    transform: [{ translateX: slotX2.value }],
  }));
  const slotStyles = [style0, style1, style2];

  if (pageCount <= 0) {
    return <View style={[{ flex: 1 }, style]} />;
  }

  if (pageCount === 1) {
    return (
      <View style={[{ flex: 1 }, style]} collapsable={false}>
        {renderPage(0)}
      </View>
    );
  }

  return (
    <GestureDetector gesture={panGesture}>
      <View
        style={[{ flex: 1, overflow: 'hidden' }, style]}
        onLayout={onLayout}
        collapsable={false}
      >
        {measured
          ? slotPages.map((page, slot) => (
              <Animated.View
                key={`mushaf-slot-${slot}`}
                pointerEvents={page === logicalRef.current ? 'auto' : 'none'}
                style={[styles.slot, slotStyles[slot]]}
                collapsable={false}
              >
                {page >= 0 ? renderPage(page) : <View style={styles.empty} />}
              </Animated.View>
            ))
          : null}
      </View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  empty: {
    flex: 1,
  },
});
