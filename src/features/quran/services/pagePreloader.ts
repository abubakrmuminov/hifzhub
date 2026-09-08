import { InteractionManager } from 'react-native';
import { getAyahTajweedSegments } from './tajweedParser';
import type { Ayah } from '@/db/schema';

export interface PreloadQueueItem {
  surahId: number;
  ayahNumber: number;
  textUthmani?: string;
}

let deferredPreloadHandle: { cancel: () => void } | null = null;

/**
 * Pre-warms Tajweed parser memory cache for all ayahs in the given list.
 * Synchronous and instant (pure in-memory string parsing, < 1ms per ayah).
 */
export function warmupPagesTajweed(ayahs: Ayah[]): void {
  for (let i = 0; i < ayahs.length; i++) {
    const a = ayahs[i];
    if (a.surahId && a.ayahNumber) {
      try {
        getAyahTajweedSegments(a.surahId, a.ayahNumber, a.textUthmani);
      } catch {}
    }
  }
}

/**
 * Pre-warms Tajweed parser memory cache for current and nearby pages.
 * Rolling window: current, previous, next, next+1 (Quran.com-style forward bias).
 */
export function preloadMushafPages(
  pages: { pageNumber: number; ayahs: Ayah[] }[],
  currentPageIndex?: number
): void {
  if (currentPageIndex == null) return;

  const nearIndices = [
    currentPageIndex,
    currentPageIndex - 1,
    currentPageIndex + 1,
    currentPageIndex + 2,
  ];

  const seen = new Set<number>();
  for (const pageIdx of nearIndices) {
    if (pageIdx < 0 || pageIdx >= pages.length || seen.has(pageIdx)) continue;
    seen.add(pageIdx);
    const page = pages[pageIdx];
    if (page?.ayahs) {
      warmupPagesTajweed(page.ayahs);
    }
  }
}

/**
 * Schedules Tajweed cache warm-up after animations and gestures settle.
 * Cancels any pending task to avoid piling up work during fast swiping.
 */
export function preloadMushafPagesDeferred(
  pages: { pageNumber: number; ayahs: Ayah[] }[],
  currentPageIndex?: number
): void {
  deferredPreloadHandle?.cancel();
  deferredPreloadHandle = InteractionManager.runAfterInteractions(() => {
    deferredPreloadHandle = null;
    preloadMushafPages(pages, currentPageIndex);
  });
}

/** Cancel a pending deferred preload (e.g. on unmount). */
export function cancelMushafPreload(): void {
  deferredPreloadHandle?.cancel();
  deferredPreloadHandle = null;
}

/**
 * Kept for backwards compatibility.
 * Audio is streamed and buffered on-demand by trackPlayer when actively playing.
 */
export async function preloadMushafPagesAudio(
  _surahId: number,
  pages: { pageNumber: number; ayahs: Ayah[] }[],
  currentPageIndex: number,
  _reciter?: string
): Promise<void> {
  preloadMushafPages(pages, currentPageIndex);
}
