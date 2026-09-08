import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import PagerView from 'react-native-pager-view';

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
  layoutDirection?: 'ltr' | 'rtl';
  style?: StyleProp<ViewStyle>;
}

// Bounded window: keep active +- 1 plus recently visited pages (max 8)
const MAX_RETAINED_PAGES = 8;

function getInitialRenderedPages(targetPage: number, total: number): Set<number> {
  const set = new Set<number>();
  if (total <= 0) return set;
  const clamped = Math.max(0, Math.min(targetPage, total - 1));
  const start = Math.max(0, clamped - 1);
  const end = Math.min(total - 1, clamped + 1);
  for (let i = start; i <= end; i++) {
    set.add(i);
  }
  return set;
}

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
    renderPlaceholder,
    layoutDirection = 'rtl',
    style,
  },
  ref
) {
  const pagerRef = useRef<PagerView>(null);
  const currentPageRef = useRef(pageIndex);
  currentPageRef.current = pageIndex;

  const initialPageRef = useRef(
    Math.max(0, Math.min(pageIndex, Math.max(0, pageCount - 1)))
  );

  // Set of pages currently mounted with full content
  const [renderedPages, setRenderedPages] = useState<Set<number>>(() =>
    getInitialRenderedPages(pageIndex, pageCount)
  );

  // Queue of visited page indices for bounded LRU eviction
  const visitedQueueRef = useRef<number[]>([pageIndex]);

  const updateRenderedWindow = useCallback(
    (targetPage: number) => {
      if (pageCount <= 0) return;
      const clamped = Math.max(0, Math.min(targetPage, pageCount - 1));

      // Update visited queue
      const queue = visitedQueueRef.current.filter((p) => p !== clamped);
      queue.push(clamped);
      visitedQueueRef.current = queue;

      setRenderedPages((prev) => {
        // Active range that MUST be rendered: clamped - 1, clamped, clamped + 1
        const mustKeep = new Set<number>();
        const start = Math.max(0, clamped - 1);
        const end = Math.min(pageCount - 1, clamped + 1);
        for (let i = start; i <= end; i++) {
          mustKeep.add(i);
        }

        // Check if all required are already in prev
        let hasAll = true;
        for (const p of mustKeep) {
          if (!prev.has(p)) {
            hasAll = false;
            break;
          }
        }

        if (hasAll && prev.size <= MAX_RETAINED_PAGES) {
          return prev;
        }

        // Build next set: start with mustKeep
        const next = new Set<number>(mustKeep);

        // Add most recently visited pages until limit
        for (let i = queue.length - 1; i >= 0 && next.size < MAX_RETAINED_PAGES; i--) {
          const p = queue[i];
          if (p >= 0 && p < pageCount) {
            next.add(p);
          }
        }

        return next;
      });
    },
    [pageCount]
  );

  // External pageIndex or pageCount updates (e.g. audio auto-advance, surah change)
  useEffect(() => {
    if (pageCount <= 0) return;
    const clamped = Math.max(0, Math.min(pageIndex, pageCount - 1));

    if (clamped !== currentPageRef.current) {
      currentPageRef.current = clamped;
      updateRenderedWindow(clamped);
      pagerRef.current?.setPageWithoutAnimation(clamped);
    }
  }, [pageIndex, pageCount, updateRenderedWindow]);

  useImperativeHandle(
    ref,
    () => ({
      setPage: (targetIndex: number) => {
        if (targetIndex < 0 || targetIndex >= pageCount) return;
        currentPageRef.current = targetIndex;
        updateRenderedWindow(targetIndex);
        pagerRef.current?.setPageWithoutAnimation(targetIndex);
        onPageChange(targetIndex);
      },
      flipPage: (direction: 'prev' | 'next') => {
        const current = currentPageRef.current;
        if (direction === 'next' && current < pageCount - 1) {
          const next = current + 1;
          currentPageRef.current = next;
          updateRenderedWindow(next);
          pagerRef.current?.setPage(next);
        } else if (direction === 'prev' && current > 0) {
          const prev = current - 1;
          currentPageRef.current = prev;
          updateRenderedWindow(prev);
          pagerRef.current?.setPage(prev);
        }
      },
    }),
    [pageCount, onPageChange, updateRenderedWindow]
  );

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const newPage = e.nativeEvent.position;
      if (newPage < 0 || newPage >= pageCount) return;

      currentPageRef.current = newPage;
      updateRenderedWindow(newPage);
      onPageChange(newPage);
    },
    [pageCount, onPageChange, updateRenderedWindow]
  );

  const defaultPlaceholder = (
    <View style={{ flex: 1, backgroundColor: 'transparent' }} />
  );
  const placeholderNode = renderPlaceholder?.() ?? defaultPlaceholder;

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
    <PagerView
      ref={pagerRef}
      style={[{ flex: 1 }, style]}
      initialPage={initialPageRef.current}
      layoutDirection={layoutDirection}
      offscreenPageLimit={1}
      overScrollMode="never"
      onPageScrollStateChanged={(e) => {
        if (e.nativeEvent.pageScrollState === 'idle') {
          onPageScrollIdle?.(currentPageRef.current);
        }
      }}
      onPageSelected={handlePageSelected}
    >
      {Array.from({ length: pageCount }, (_, index) => {
        const isRendered = renderedPages.has(index);
        return (
          <View
            key={`mushaf-page-slot-${index}`}
            style={{ flex: 1 }}
            collapsable={false}
          >
            {isRendered ? renderPage(index) : placeholderNode}
          </View>
        );
      })}
    </PagerView>
  );
});
